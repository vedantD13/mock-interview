require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const Groq = require('groq-sdk');
const Interview = require('./models/Interview');

// --- SAFE PDF IMPORT ---
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.error("⚠️ PDF Library missing. Run: npm install pdf-parse");
}

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_interviewer_db')
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// --- AI CONFIGURATION ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- ROUTES ---

// 1. UPLOAD RESUME
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let resumeText = "No resume text extracted.";
    // Safe PDF Parsing
    if (typeof pdfParse === 'function' || (pdfParse && typeof pdfParse.default === 'function')) {
      try {
        const parser = typeof pdfParse === 'function' ? pdfParse : pdfParse.default;
        const pdfData = await parser(req.file.buffer);
        resumeText = pdfData.text;
      } catch (err) { console.error("PDF Error:", err); }
    }

    // AI Analysis
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Extract name, top 3 skills, and experience. Summarize briefly." },
        { role: "user", content: `Resume: ${resumeText.substring(0, 3000)}` }
      ],
      model: "llama-3.3-70b-versatile",
    });

    const analysis = completion.choices[0]?.message?.content || "Resume processed.";

    const newInterview = new Interview({
      userId: "guest", // Ideally, use a real user ID here if you add Auth later
      jsonResume: { analysis },
      messages: []
    });
    await newInterview.save();

    res.json({ sessionId: newInterview._id, analysis });
  } catch (error) {
    res.status(500).json({ error: "Upload failed: " + error.message });
  }
});

// 2. CHAT
app.post('/api/chat', async (req, res) => {
  let { sessionId, userMessage, topic } = req.body;

  try {
    let interview;
    const isNewSession = !sessionId || sessionId === 'guest_session' || sessionId === 'new_topic_session' || !mongoose.Types.ObjectId.isValid(sessionId);

    if (isNewSession) {
      const context = topic ? `Focus on ${topic}.` : "General Software Engineering.";
      interview = new Interview({
        userId: "guest",
        jsonResume: { analysis: context, topic: topic || "General" },
        messages: []
      });
      await interview.save();
      sessionId = interview._id;
    } else {
      interview = await Interview.findById(sessionId);
      if (!interview) return res.status(404).json({ error: "Session not found" });
    }

    if (userMessage !== "START_INTERVIEW") {
      interview.messages.push({ role: 'user', content: userMessage });
    }

    const messages = [
      { role: "system", content: `You are a technical interviewer. Context: ${JSON.stringify(interview.jsonResume)}. Ask ONE short technical question.` },
      ...interview.messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
    ];

    const completion = await groq.chat.completions.create({ messages, model: "llama-3.3-70b-versatile" });
    const aiReply = completion.choices[0]?.message?.content || "Ready.";

    interview.messages.push({ role: 'ai', content: aiReply });
    await interview.save();

    res.json({ reply: aiReply, sessionId: interview._id });
  } catch (error) {
    res.status(500).json({ error: "Chat error" });
  }
});

// 3. FEEDBACK (Updated to SAVE to DB)
app.post('/api/feedback', async (req, res) => {
  const { sessionId } = req.body;
  try {
    const interview = await Interview.findById(sessionId);
    if (!interview) return res.status(404).json({ error: "Session not found" });

    const history = interview.messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Rate the interview 1-10. Return JSON: { \"rating\": number, \"feedback\": string, \"improvement\": string }" },
        { role: "user", content: history }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const feedbackData = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // NEW: Save Feedback to Database
    interview.feedback = feedbackData;
    await interview.save();

    res.json(feedbackData);
  } catch (error) {
    res.status(500).json({ error: "Feedback failed" });
  }
});

// 4. NEW: DASHBOARD ROUTE
app.get('/api/dashboard', async (req, res) => {
  try {
    // Fetch last 10 interviews that have feedback (completed ones)
    const history = await Interview.find({ "feedback.rating": { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Could not load dashboard" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));