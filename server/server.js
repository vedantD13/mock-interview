require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import Models
// Make sure these files exist in server/models/
const Interview = require('./models/Interview'); // Your existing model
const Resume = require('./models/Resume');       // New model
const Skill = require('./models/Skill');         // New model
const UserProgress = require('./models/UserProgress'); // New model

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/career-ai")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// AI Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* =========================================
   FEATURE 1: MOCK INTERVIEW ROUTES
   (Preserving your core functionality)
   ========================================= */

// Generate Interview Questions
app.post('/api/interview/generate', async (req, res) => {
  const { role, techStack, experience } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Generate 5 technical interview questions for a ${role} with ${experience} years experience in ${techStack}. Return valid JSON array of strings.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Basic cleanup to ensure JSON
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(jsonStr);
    
    res.json({ questions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// Save Interview & Get Feedback
app.post('/api/interview/feedback', async (req, res) => {
  const { userId, questions, answers, role } = req.body;
  try {
    // 1. Generate Feedback using AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      Analyze this interview for a ${role}.
      Questions: ${JSON.stringify(questions)}
      Answers: ${JSON.stringify(answers)}
      
      Provide a JSON object with:
      - rating (number 1-10)
      - feedback (string summary)
      - improvements (array of strings)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '').trim();
    const feedbackData = JSON.parse(text);

    // 2. Save to Database
    const interview = await Interview.create({
      userId,
      role,
      questions,
      answers,
      rating: feedbackData.rating,
      feedback: feedbackData.feedback,
      date: new Date()
    });

    // 3. Update User Streak/XP (Gamification Integration)
    await UserProgress.findOneAndUpdate(
      { userId },
      { $inc: { xp: 100 }, $set: { lastActivity: new Date() } },
      { upsert: true }
    );

    res.json(interview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process interview" });
  }
});

// Get Past Interviews
app.get('/api/interview/history/:userId', async (req, res) => {
  try {
    const history = await Interview.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* =========================================
   FEATURE 2: RESUME BUILDER ROUTES
   ========================================= */

// Get Resume
app.get('/api/resume/:userId', async (req, res) => {
  try {
    let resume = await Resume.findOne({ userId: req.params.userId });
    if (!resume) {
      resume = await Resume.create({ 
        userId: req.params.userId,
        personal: {}, experience: [], skills: [] 
      });
    }
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Resume
app.post('/api/resume/save', async (req, res) => {
  const { userId, personal, experience, skills } = req.body;
  try {
    const updated = await Resume.findOneAndUpdate(
      { userId },
      { personal, experience, skills },
      { new: true, upsert: true }
    );
    // Award XP for updating resume
    await UserProgress.findOneAndUpdate(
       { userId },
       { $inc: { xp: 20 } },
       { upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Optimize Resume
app.post('/api/resume/optimize', async (req, res) => {
  const { currentResume } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `
      Act as an expert Resume Writer. Optimize the following professional summary to be more impactful, 
      action-oriented, and tailored for a tech role. Keep it under 50 words.
      Current Summary: "${currentResume.personal.summary}"
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ optimizedSummary: response.text() });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "Failed to generate AI content" });
  }
});


/* =========================================
   FEATURE 3: SKILL TRACKER & GAMIFICATION
   ========================================= */

// Get Skills & Progress
app.get('/api/skills/:userId', async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.params.userId });
    let progress = await UserProgress.findOne({ userId: req.params.userId });
    
    if (!progress) {
      progress = await UserProgress.create({ userId: req.params.userId, xp: 0, streak: 1 });
    }

    res.json({ skills, xp: progress.xp, streak: progress.streak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add New Skill
app.post('/api/skills', async (req, res) => {
  const { userId, name, category, level, goal } = req.body;
  try {
    const newSkill = await Skill.create({ userId, name, category, level, goal });
    res.json(newSkill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Skill Progress (XP Boost)
app.put('/api/skills/:id/progress', async (req, res) => {
  const { userId, level } = req.body;
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, { level }, { new: true });
    
    // Award 10 XP for practicing
    const progress = await UserProgress.findOneAndUpdate(
      { userId },
      { $inc: { xp: 10 } },
      { new: true }
    );

    res.json({ skill, xp: progress.xp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* =========================================
   FEATURE 4: MARKET INSIGHTS
   ========================================= */

app.get('/api/market-insights', (req, res) => {
  //  - Can be visualized in frontend
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

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});