require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');

// --- IMPORT MODELS ---
const Interview = require('./models/Interview'); 
const Resume = require('./models/Resume');
const Skill = require('./models/Skill');
const UserProgress = require('./models/UserProgress');

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/career-ai")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// --- GROQ CONFIGURATION ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


/* ==========================================================================
   FEATURE 1: CHAT & MOCK INTERVIEW ROUTES
   ========================================================================== */

// 1. CHAT ENDPOINT (Updated Model)
app.post('/api/chat', async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    const messages = (history || []).map(msg => ({
      role: msg.role === 'model' || msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.content || msg.text || ""
    }));

    messages.push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      messages: messages,
      // UPDATED MODEL: Using the latest fast model
      model: "llama-3.1-8b-instant", 
    });

    const reply = completion.choices[0]?.message?.content || "I'm not sure how to respond.";
    res.json({ reply });

  } catch (error) {
    console.error("Groq Chat Error:", error);
    res.status(500).json({ error: "Failed to fetch response", reply: "Offline mode: AI unavailable." });
  }
});

// 2. Generate Interview Questions (Updated Model)
app.post('/api/interview/generate', async (req, res) => {
  const { role, techStack, experience } = req.body;
  try {
    const prompt = `Generate 5 technical interview questions for a ${role} with ${experience} years experience in ${techStack}. 
    Return ONLY a raw JSON array of strings (e.g. ["Question 1", "Question 2"]). Do not output markdown or explanations.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      // UPDATED MODEL: Using the versatile model for better logic
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    const text = completion.choices[0]?.message?.content || "[]";
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(jsonStr);
    
    res.json({ questions });
  } catch (error) {
    console.error("Groq Generate Error:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// 3. Feedback Analysis (Updated Model)
app.post('/api/interview/feedback', async (req, res) => {
  const { userId, questions, answers, role } = req.body;
  try {
    const prompt = `
      Analyze this interview for a ${role}.
      Questions: ${JSON.stringify(questions)}
      Answers: ${JSON.stringify(answers)}
      
      Return valid JSON with these keys:
      {
        "rating": (number 1-10),
        "feedback": (string summary),
        "improvement": (string specific advice)
      }
      Do not use markdown. Just raw JSON.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      // UPDATED MODEL: Using the versatile model for complex analysis
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" } 
    });

    const text = completion.choices[0]?.message?.content;
    const feedbackData = JSON.parse(text);

    const interview = await Interview.create({
      userId,
      role,
      questions,
      answers,
      rating: feedbackData.rating,
      feedback: feedbackData.feedback,
      date: new Date()
    });

    await UserProgress.findOneAndUpdate(
      { userId },
      { $inc: { xp: 100 }, $set: { lastActivity: new Date() } },
      { upsert: true }
    );

    res.json(interview);
  } catch (error) {
    console.error("Groq Feedback Error:", error);
    res.status(500).json({ error: "Failed to process feedback" });
  }
});

// 4. Get History
app.get('/api/interview/history/:userId', async (req, res) => {
  try {
    const history = await Interview.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ==========================================================================
   FEATURE 2: AI RESUME BUILDER
   ========================================================================== */

app.get('/api/resume/:userId', async (req, res) => {
  try {
    let resume = await Resume.findOne({ userId: req.params.userId });
    if (!resume) resume = await Resume.create({ userId: req.params.userId, personal: {}, experience: [], skills: [] });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resume/save', async (req, res) => {
  const { userId, personal, experience, skills } = req.body;
  try {
    const updated = await Resume.findOneAndUpdate(
      { userId },
      { personal, experience, skills },
      { new: true, upsert: true }
    );
    await UserProgress.findOneAndUpdate({ userId }, { $inc: { xp: 20 } }, { upsert: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resume/optimize', async (req, res) => {
  const { currentResume } = req.body;
  try {
    const prompt = `Optimize this professional summary for a tech resume. Make it impactful and under 50 words: "${currentResume.personal.summary}"`;
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      // UPDATED MODEL
      model: "llama-3.1-8b-instant",
    });

    res.json({ optimizedSummary: completion.choices[0]?.message?.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Groq Generation Failed" });
  }
});


/* ==========================================================================
   FEATURE 3 & 4: SKILLS & MARKET DATA
   ========================================================================== */

app.get('/api/skills/:userId', async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.params.userId });
    let progress = await UserProgress.findOne({ userId: req.params.userId });
    if (!progress) progress = await UserProgress.create({ userId: req.params.userId, xp: 0, streak: 1 });
    res.json({ skills, xp: progress.xp, streak: progress.streak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/skills', async (req, res) => {
  const { userId, name, category, level, goal } = req.body;
  try {
    const newSkill = await Skill.create({ userId, name, category, level, goal });
    res.json(newSkill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/skills/:id/progress', async (req, res) => {
  const { userId, level } = req.body;
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, { level }, { new: true });
    const progress = await UserProgress.findOneAndUpdate({ userId }, { $inc: { xp: 10 } }, { new: true });
    res.json({ skill, xp: progress.xp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/market-insights', (req, res) => {
  res.json({
    salaryData: [
      { name: 'Jr. Dev', salary: 65000 },
      { name: 'Mid Dev', salary: 98000 },
      { name: 'Sr. Dev', salary: 145000 },
      { name: 'Lead', salary: 190000 },
    ],
    demandData: [
      { month: 'Jan', demand: 4200 },
      { month: 'Feb', demand: 3800 },
      { month: 'Mar', demand: 5500 },
      { month: 'Apr', demand: 5100 },
      { month: 'May', demand: 6700 },
    ],
    hotSkills: ["React", "Node.js", "Python", "AWS", "Docker", "Kubernetes", "TypeScript"]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});