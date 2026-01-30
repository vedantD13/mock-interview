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
// Increased limit to 50mb to handle profile image uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/career-ai")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// --- GROQ CONFIGURATION ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- UTILS: STREAK CALCULATOR (NEW) ---
// This function handles the logic for daily streaks and penalties
const updateStreak = async (userId) => {
  let progress = await UserProgress.findOne({ userId });
  if (!progress) {
    progress = await UserProgress.create({ userId, xp: 0, streak: 1, lastActivity: new Date() });
    return progress;
  }

  const now = new Date();
  const last = new Date(progress.lastActivity);
  const diffTime = Math.abs(now - last);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  // Logic: 
  // 1 day diff = streak continues
  // >1 day diff = streak broken (penalty: reset to 1)
  // 0 day diff = same day login, no change
  if (diffDays === 1) {
    progress.streak += 1;
  } else if (diffDays > 1) {
    progress.streak = 1; 
  }
  
  progress.lastActivity = now;
  await progress.save();
  return progress;
};


/* ==========================================================================
   FEATURE 1: CHAT & MOCK INTERVIEW ROUTES
   ========================================================================== */

// 1. CHAT ENDPOINT
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
      model: "llama-3.1-8b-instant", 
    });

    const reply = completion.choices[0]?.message?.content || "I'm not sure how to respond.";
    res.json({ reply });

  } catch (error) {
    console.error("Groq Chat Error:", error);
    res.status(500).json({ error: "Failed to fetch response", reply: "Offline mode: AI unavailable." });
  }
});

// 2. Generate Interview Questions
app.post('/api/interview/generate', async (req, res) => {
  const { role, techStack, experience } = req.body;
  try {
    const prompt = `Generate 5 technical interview questions for a ${role} with ${experience} years experience in ${techStack}. 
    Return ONLY a raw JSON array of strings (e.g. ["Question 1", "Question 2"]). Do not output markdown or explanations.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
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

// 3. Feedback Analysis
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

// Get Resume
app.get('/api/resume/:userId', async (req, res) => {
  try {
    let resume = await Resume.findOne({ userId: req.params.userId });
    if (!resume) resume = await Resume.create({ userId: req.params.userId, personal: {}, experience: [], education: [], skills: [] });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Resume
app.post('/api/resume/save', async (req, res) => {
  const { userId, personal, experience, education, skills } = req.body;
  try {
    const updated = await Resume.findOneAndUpdate(
      { userId },
      { personal, experience, education, skills },
      { new: true, upsert: true }
    );
    await UserProgress.findOneAndUpdate({ userId }, { $inc: { xp: 20 } }, { upsert: true });
    res.json(updated);
  } catch (err) {
    console.error("Resume Save Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// AI Resume Assistant
app.post('/api/ai/resume-assist', async (req, res) => {
  const { type, context } = req.body;
  
  let prompt = "";
  if (type === 'summary') {
    prompt = `You are an expert resume writer. Write a professional, punchy summary (maximum 40 words) for a candidate with the Job Title: "${context.title || 'Professional'}" and Key Skills: "${context.skills || 'General'}". Focus on value and expertise. Do not use conversational filler, just the summary text.`;
  } else if (type === 'description') {
    prompt = `You are an expert resume writer. Enhance the following job description into 3 professional, results-oriented bullet points. Use action verbs. 
    Role: ${context.role}
    Company: ${context.company}
    Raw Description: ${context.description || "General responsibilities"}
    Output ONLY the bullet points, one per line.`;
  } else {
    return res.status(400).json({ error: "Invalid type" });
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    const result = completion.choices[0]?.message?.content || "Could not generate content.";
    res.json({ result });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// Legacy Optimization Endpoint
app.post('/api/resume/optimize', async (req, res) => {
  const { currentResume } = req.body;
  try {
    const prompt = `Optimize this professional summary for a tech resume. Make it impactful and under 50 words: "${currentResume.personal.summary}"`;
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
    });
    res.json({ optimizedSummary: completion.choices[0]?.message?.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Groq Generation Failed" });
  }
});


/* ==========================================================================
   FEATURE 3 & 4: SKILLS & MARKET DATA (UPDATED FOR SKILL TRACKER)
   ========================================================================== */

// Get Skills
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

// Update Skill Progress
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

// Delete Skill
app.delete('/api/skills/:id', async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: "Skill deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Skill Gap Analysis
app.post('/api/ai/skill-gap', async (req, res) => {
  const { currentSkills, targetRole } = req.body;
  
  try {
    const prompt = `
      I am a ${targetRole}. 
      My current skills are: ${currentSkills.join(', ')}.
      
      Identify 3-5 critical skills I am missing or need to improve for this role in 2026.
      Return ONLY a raw JSON array of objects with this format:
      [{"name": "Skill Name", "category": "Frontend/Backend/Tools", "reason": "Why it matters"}]
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const content = completion.choices[0]?.message?.content || "[]";
    const jsonStr = content.replace(/```json|```/g, '').trim();
    const suggestions = JSON.parse(jsonStr);

    res.json({ suggestions });
  } catch (error) {
    console.error("AI Skill Gap Error:", error);
    res.status(500).json({ error: "Failed to analyze skill gap" });
  }
});

// --- NEW: Generate Skill Challenge (LeetCode Style) ---
app.post('/api/ai/generate-challenge', async (req, res) => {
  const { skill, level } = req.body;
  
  try {
    const prompt = `
      Create a technical interview question or coding challenge to test a user's knowledge of "${skill}" at a "${level}% proficiency" level.
      
      Return JSON format:
      {
        "title": "Short Title",
        "description": "The problem statement.",
        "type": "code", 
        "starterCode": "function solve() { // your code }"
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const challenge = JSON.parse(completion.choices[0]?.message?.content);
    res.json(challenge);
  } catch (error) {
    console.error("Challenge Gen Error:", error);
    res.status(500).json({ error: "Failed to generate challenge" });
  }
});

// --- NEW: Validate Skill Challenge (The Judge) ---
app.post('/api/ai/validate-challenge', async (req, res) => {
  const { userId, skillId, question, userAnswer } = req.body;

  try {
    const prompt = `
      You are a strict code reviewer. 
      Question: ${question}
      User Answer: ${userAnswer}

      Did they solve it correctly?
      Return JSON:
      {
        "passed": boolean,
        "feedback": "Concise feedback explaining why it passed or failed.",
        "xpAward": number (between 10-50 based on quality)
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content);

    if (result.passed) {
      // 1. Increase Skill Level (+5%)
      await Skill.findByIdAndUpdate(skillId, { $inc: { level: 5 } });
      
      // 2. Update User Streak & XP using our utility function
      const progress = await updateStreak(userId);
      progress.xp += result.xpAward || 20; // Default 20 XP if not provided
      await progress.save();
      
      result.newStreak = progress.streak;
      result.newXP = progress.xp;
    }

    res.json(result);
  } catch (error) {
    console.error("Validation Error:", error);
    res.status(500).json({ error: "Grading failed" });
  }
});

// Market Insights Data
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