require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const Groq = require('groq-sdk/index.mjs');
const Interview = require('./models/Interview');

// --- SAFE PDF IMPORT ---
// This handles cases where the library loads differently
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.error("PDF Library missing. Run: npm install pdf-parse");
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

// ROUTE 1: UPLOAD RESUME (Fixed)
app.post('/api/upload-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let resumeText = "No resume text extracted.";

    // DEBUG: Check if PDF library is loaded
    if (typeof pdfParse !== 'function') {
      console.warn("⚠️ Warning: pdf-parse is not a function. It is:", typeof pdfParse);
      // Fallback: Use default export if available, or skip PDF parsing
      if (pdfParse && typeof pdfParse.default === 'function') {
        pdfParse = pdfParse.default;
      } else {
        // If PDF parsing fails completely, don't crash. Just continue with empty text.
        console.warn("⚠️ Skipping PDF parsing due to library issue.");
        resumeText = "Resume uploaded but text could not be parsed. Ask candidate about their skills.";
      }
    }

    // Try parsing if function exists
    if (typeof pdfParse === 'function') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        resumeText = pdfData.text;
      } catch (parseErr) {
        console.error("❌ PDF Parse Error:", parseErr.message);
        resumeText = "Error parsing PDF. Ask candidate about their background.";
      }
    }

    // Send to Groq (Updated Model)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Extract name, technical skills, and experience. Summarize it." },
        { role: "user", content: `Resume Content: ${resumeText.substring(0, 3000)}` }
      ],
      // FIX: Use the new supported model
      model: "llama-3.3-70b-versatile", 
    });

    const analysis = completion.choices[0]?.message?.content || "Resume processed.";

    // Create Session
    const newInterview = new Interview({
      userId: "user_uploaded",
      jsonResume: { analysis },
      messages: []
    });
    await newInterview.save();

    res.json({ sessionId: newInterview._id, analysis });

  } catch (error) {
    console.error("❌ Upload Endpoint Error:", error);
    res.status(500).json({ error: "Server Error: " + error.message });
  }
});

// ROUTE 2: CHAT (Updated Model)
app.post('/api/chat', async (req, res) => {
  let { sessionId, userMessage } = req.body;

  try {
    let interview;

    // Guest Session Fix
    const isInvalidId = !sessionId || sessionId === 'guest_session' || !mongoose.Types.ObjectId.isValid(sessionId);

    if (isInvalidId) {
      console.log("ℹ️ Creating new session for Guest...");
      interview = new Interview({
        userId: "guest",
        jsonResume: { analysis: "No resume provided. Generic software engineer interview." },
        messages: []
      });
      await interview.save();
      sessionId = interview._id; 
    } else {
      interview = await Interview.findById(sessionId);
      if (!interview) return res.status(404).json({ error: "Session not found" });
    }

    // Save User Message
    interview.messages.push({ role: 'user', content: userMessage });

    // Prepare Context for Groq
    const messages = [
      { 
        role: "system", 
        content: `You are a technical interviewer. Context: ${JSON.stringify(interview.jsonResume)}. Ask one short technical question.` 
      },
      ...interview.messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    // Call Groq (Updated Model)
    const completion = await groq.chat.completions.create({
      messages,
      // FIX: Use the new supported model
      model: "llama-3.3-70b-versatile",
    });

    const aiReply = completion.choices[0]?.message?.content || "I am listening.";

    // Save AI Reply
    interview.messages.push({ role: 'ai', content: aiReply });
    await interview.save();

    res.json({ reply: aiReply, sessionId: interview._id }); 

  } catch (error) {
    console.error("❌ Chat Error:", error.message); 
    res.status(500).json({ error: "AI failed to respond. " + error.message });
  }
});

// ROUTE 3: END INTERVIEW & GET FEEDBACK
app.post('/api/feedback', async (req, res) => {
  const { sessionId } = req.body;

  try {
    const interview = await Interview.findById(sessionId);
    if (!interview) return res.status(404).json({ error: "Session not found" });

    // Prepare conversation history for the AI
    const historyText = interview.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

    // Ask Groq for a structured assessment
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `You are a strict technical interviewer. 
          Review the following interview history.
          Provide feedback in this JSON format:
          {
            "rating": "Number between 1-10",
            "feedback": "A 2-sentence summary of performance",
            "improvement": "1 specific technical area to improve"
          }
          Do not include any other text, just the JSON.` 
        },
        { role: "user", content: historyText }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" } // Force JSON response
    });

    const feedbackData = JSON.parse(completion.choices[0]?.message?.content || "{}");

    res.json(feedbackData);

  } catch (error) {
    console.error("Feedback Error:", error);
    res.status(500).json({ error: "Failed to generate feedback" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));