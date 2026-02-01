require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');

// --- IMPORT MODELS ---
// Ensure you have created these files in server/models/
const Interview = require('./models/Interview'); 
const Resume = require('./models/Resume');
const Skill = require('./models/Skill');
const UserProgress = require('./models/UserProgress');

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/career-ai")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// --- GROQ CONFIGURATION ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- UTILS: STREAK CALCULATOR ---
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
   FEATURE 3: SKILLS TRACKER
   ========================================================================== */

// 1. GET Skills
app.get('/api/skills/:userId', async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.params.userId }).sort({ lastPracticed: -1 });
    // Calculate XP based on levels
    const xp = skills.reduce((acc, skill) => acc + (skill.level * 10), 0);
    res.json({ skills, xp, streak: 5 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching skills" });
  }
});

// 2. CREATE Skill
app.post('/api/skills', async (req, res) => {
  try {
    const { userId, name, category, level, target, resources } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newSkill = new Skill({
      userId,
      name,
      category: category || 'Tools',
      level: level || 0,
      target: target || 'Intermediate',
      resources: resources || []
    });

    const savedSkill = await newSkill.save();
    res.json(savedSkill);
  } catch (err) {
    console.error("Save Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// 3. UPDATE Skill
app.put('/api/skills/:id', async (req, res) => {
  try {
    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true } 
    );
    res.json(updatedSkill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. DELETE Skill
app.delete('/api/skills/:id', async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: "Skill deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   FEATURE 4: AI CHALLENGES & RESOURCES (FIXED MODELS)
   ========================================================================== */

// AI Skill Gap Analysis
app.post('/api/ai/skill-gap', async (req, res) => {
  const { currentSkills, targetRole } = req.body;
  try {
    const prompt = `I am a ${targetRole}. My current skills: ${currentSkills.join(', ')}.
    Identify 3-5 critical missing skills. Return JSON array: [{"name": "Skill", "category": "Tools"}]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const content = completion.choices[0]?.message?.content || "[]";
    const jsonStr = content.replace(/```json|```/g, '').trim();
    res.json({ suggestions: JSON.parse(jsonStr) });
  } catch (error) {
    console.error("AI Skill Gap Error:", error);
    res.status(500).json({ error: "Failed to analyze skill gap" });
  }
});

// ... existing imports and setup

// ... (Previous imports and setup remain the same)

// --- AI ROUTES (UPDATED FOR 20 LEVELS) ---

// 1. GENERATE CHALLENGE
app.post('/api/ai/generate-challenge', async (req, res) => {
  const { skill, level } = req.body;
  
  // Expanded Difficulty Map for 20 Levels
  const difficulties = [
    "Novice", "Novice", "Beginner", "Beginner", "BOSS: Basic Competency", // 1-5
    "Intermediate", "Intermediate", "Adept", "Adept", "BOSS: Problem Solving", // 6-10
    "Advanced", "Advanced", "Expert", "Expert", "BOSS: System Design", // 11-15
    "Master", "Master", "Grandmaster", "Grandmaster", "FINAL BOSS: Legend" // 16-20
  ];
  
  const difficulty = difficulties[Math.min(level - 1, 19)];
  const isBoss = level % 5 === 0;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a Game Master for a coding RPG. 
          Generate a ${isBoss ? "HIGH STAKES BOSS BATTLE" : "standard"} coding challenge for ${skill}.
          Difficulty: Level ${level} (${difficulty}).
          
          ${isBoss ? "For this BOSS LEVEL, make the scenario epic, the problem complex, and edge cases tricky." : "Keep it educational but fun."}

          Return ONLY a raw JSON object (no markdown) with this format:
          {
            "title": "RPG Style Title",
            "description": "Story-driven problem statement.",
            "starterCode": "// Starter code here"
          }`
        },
        { role: "user", content: `Generate level ${level} challenge for ${skill}.` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6, // Slightly higher for creativity in boss titles
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(cleanJson));

  } catch (err) {
    console.error("AI Challenge Error:", err.message);
    res.status(500).json({ error: "Failed to generate challenge" });
  }
});

// --- 2. VALIDATE CHALLENGE (Updated for Star Rating) ---
app.post('/api/ai/validate-challenge', async (req, res) => {
  const { question, userAnswer } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Evaluate the code. Return ONLY raw JSON:
          {
            "passed": boolean,
            "stars": number (1 = barely passed, 2 = good, 3 = optimal/clean code, 0 if failed),
            "feedback": "Encouraging game-style feedback.",
            "newXP": number (base 100 * stars)
          }`
        },
        {
          role: "user",
          content: `Question: ${question}\nUser Code: ${userAnswer}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanJson);

    res.json(result);

  } catch (err) {
    console.error("AI Validate Error:", err.message);
    res.status(500).json({ error: "Validation failed" });
  }
});

// Recommend Resources (Fixing "Invalid Link" & Crash issue)
app.post('/api/ai/recommend-resources', async (req, res) => {
  const { skill } = req.body;
  if (!skill) return res.status(400).json({ error: 'Skill name required' });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful education assistant.
          Generate 3 high-quality learning resources for: ${skill}.
          
          Instead of guessing specific video IDs (which fail), construct SMART SEARCH URLs.
          
          Return ONLY a raw JSON array. Format:
          [
            { "title": "Official Docs", "url": "https://www.google.com/search?q=${skill}+official+documentation" },
            { "title": "YouTube Crash Course", "url": "https://www.youtube.com/results?search_query=${skill}+crash+course" },
            { "title": "Interactive Tutorial", "url": "https://www.google.com/search?q=${skill}+interactive+tutorial" }
          ]`
        },
        { role: "user", content: `Resources for ${skill}` }
      ],
      model: "llama-3.3-70b-versatile", // UPDATED
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content || "[]";
    const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let suggestions = [];
    try {
      suggestions = JSON.parse(cleanJson);
    } catch (e) {
      console.error("JSON Parse Error", e);
      suggestions = [];
    }

    // Safety: Filter out bad objects
    const validSuggestions = Array.isArray(suggestions) 
      ? suggestions.filter(s => s && s.title && s.url) 
      : [];

    res.json({ resources: validSuggestions });

  } catch (err) {
    console.error("AI Resource Error:", err.message);
    res.json({ resources: [] }); // Safe empty array on error
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