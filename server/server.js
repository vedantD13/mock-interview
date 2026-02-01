require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Groq = require('groq-sdk');

// --- IMPORT MODELS ---
// Ensure these files exist in server/models/
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

// --- CONSTANTS: XP SHOP ITEMS ---
const SHOP_ITEMS = [
    // THEMES
    { id: 'theme-light', name: 'Standard Light', type: 'theme', cost: 0, description: 'Default bright theme.', icon: 'Sun' },
    { id: 'theme-dracula', name: 'Dracula', type: 'theme', cost: 300, description: 'A dark theme for vampires.', icon: 'Moon' },
    { id: 'theme-monokai', name: 'Monokai', type: 'theme', cost: 400, description: 'Vibrant and contrasty.', icon: 'Palette' },
    { id: 'theme-nord', name: 'Nord', type: 'theme', cost: 450, description: 'An arctic, north-bluish palette.', icon: 'Snowflake' },
    { id: 'theme-matrix', name: 'The Matrix', type: 'theme', cost: 500, description: 'Green code raining down.', icon: 'Terminal' },
    { id: 'theme-cyberpunk', name: 'Cyberpunk 2077', type: 'theme', cost: 1000, description: 'Neon pinks and deep blues.', icon: 'Zap' },
    
    // TITLES
    { id: 'title-novice', name: 'Novice', type: 'title', cost: 0, description: 'The journey begins.', icon: 'Sprout' },
    { id: 'title-bug-hunter', name: 'Bug Hunter', type: 'title', cost: 200, description: 'Squashing bugs for fun.', icon: 'Bug' },
    { id: 'title-stack-overflow', name: 'Stack Overflow VIP', type: 'title', cost: 500, description: 'Ctrl+C, Ctrl+V expert.', icon: 'Copy' },
    { id: 'title-algo-wizard', name: 'Algo Wizard', type: 'title', cost: 800, description: 'Master of complexity.', icon: 'Wand' },
    { id: 'title-senior-dev', name: '10x Engineer', type: 'title', cost: 2000, description: 'Highly efficient.', icon: 'Rocket' },
    { id: 'title-architect', name: 'System Architect', type: 'title', cost: 5000, description: 'Draws boxes and arrows.', icon: 'Ruler' },
];

// --- UTILS: STREAK & PROGRESS CALCULATOR ---
const updateStreak = async (userId) => {
  let progress = await UserProgress.findOne({ userId });
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (!progress) {
    progress = await UserProgress.create({ 
      userId, 
      xp: 0, 
      lifetimeXP: 0, 
      streak: 1, 
      lastActivity: now,
      inventory: ['theme-light', 'title-novice'],
      equipped: { theme: 'light', title: 'Novice' }
    });
    return progress;
  }

  // MIGRATION: Ensure lifetimeXP and shop fields exist
  if (progress.lifetimeXP === undefined) progress.lifetimeXP = progress.xp;
  if (!progress.inventory) progress.inventory = ['theme-light', 'title-novice'];
  if (!progress.equipped) progress.equipped = { theme: 'light', title: 'Novice' };

  const lastActivity = new Date(progress.lastActivity);
  const lastDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());

  const diffTime = today - lastDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 

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
   FEATURE 1: CHAT & MOCK INTERVIEW ROUTES (Restored)
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

    // Add XP for completing interview
    await UserProgress.findOneAndUpdate(
      { userId },
      { $inc: { xp: 100, lifetimeXP: 100 }, $set: { lastActivity: new Date() } },
      { upsert: true }
    );
    await updateStreak(userId);

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
   FEATURE 2: AI RESUME BUILDER ROUTES (Restored)
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
    // Add XP for saving resume
    await UserProgress.findOneAndUpdate(
      { userId }, 
      { $inc: { xp: 20, lifetimeXP: 20 }, $set: { lastActivity: new Date() } }, 
      { upsert: true }
    );
    await updateStreak(userId);
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
   FEATURE 3: SKILLS TRACKER & GAMIFICATION
   ========================================================================== */

// 1. GET Skills & User Progress (With Sticky Rank)
app.get('/api/skills/:userId', async (req, res) => {
  try {
    const skills = await Skill.find({ userId: req.params.userId }).sort({ lastPracticed: -1 });
    
    let progress = await UserProgress.findOne({ userId: req.params.userId });
    
    // Create default progress if missing
    if (!progress) {
        progress = await UserProgress.create({ 
            userId: req.params.userId, 
            xp: 0, 
            lifetimeXP: 0, 
            streak: 0, 
            lastActivity: new Date(),
            inventory: ['theme-light', 'title-novice'],
            equipped: { theme: 'light', title: 'Novice' }
        });
    }

    // Migration fixes for existing users
    if (progress.lifetimeXP === undefined) {
       progress.lifetimeXP = progress.xp;
       await progress.save();
    }
    if (!progress.inventory) {
        progress.inventory = ['theme-light', 'title-novice'];
        progress.equipped = { theme: 'light', title: 'Novice' };
        await progress.save();
    }

    const rank = Math.floor(progress.lifetimeXP / 100) + 1;
    const rankProgress = progress.lifetimeXP % 100;

    res.json({ 
        skills, 
        xp: progress.xp, 
        rank, 
        rankProgress,
        streak: progress.streak,
        inventory: progress.inventory,
        equipped: progress.equipped
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching skills" });
  }
});

// 2. ADD XP (Passing challenges)
app.post('/api/user/add-xp', async (req, res) => {
    const { userId, amount } = req.body;
    try {
        const progress = await UserProgress.findOneAndUpdate(
            { userId },
            { $inc: { xp: amount, lifetimeXP: amount } },
            { new: true, upsert: true }
        );
        res.json({ success: true, newXP: progress.xp, newLifetimeXP: progress.lifetimeXP });
    } catch (err) {
        res.status(500).json({ error: "Failed to add XP" });
    }
});

// 3. DEDUCT XP (Buying hints - affects Balance only, not Rank)
app.post('/api/user/deduct-xp', async (req, res) => {
  const { userId, amount } = req.body;
  try {
    const progress = await UserProgress.findOne({ userId });
    if (!progress) return res.status(404).json({ error: "User not found" });

    if (progress.xp < amount) {
      return res.status(400).json({ error: "Insufficient XP", currentXP: progress.xp });
    }

    progress.xp -= amount;
    await progress.save();
    res.json({ success: true, newXP: progress.xp });
  } catch (err) {
    console.error("XP Deduction Error:", err);
    res.status(500).json({ error: "Failed to deduct XP" });
  }
});

// 4. PENALIZE (Cheating - affects everything)
app.post('/api/user/penalize', async (req, res) => {
    const { userId, amount } = req.body;
    try {
      const progress = await UserProgress.findOne({ userId });
      if (progress) {
          progress.xp = Math.max(0, progress.xp - amount);
          progress.lifetimeXP = Math.max(0, progress.lifetimeXP - amount);
          await progress.save();
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Penalty failed" });
    }
  });

// --- SKILL CRUD ROUTES ---

app.post('/api/skills', async (req, res) => {
  try {
    const { userId, name, category, level, target, resources, prerequisites } = req.body;
    if (!userId || !name) return res.status(400).json({ error: "Missing required fields" });

    const newSkill = new Skill({
      userId, name, category: category || 'Tools', level: level || 0,
      target: target || 'Intermediate', resources: resources || [],
      lastPracticed: new Date(),
      prerequisites: prerequisites || []
    });

    const savedSkill = await newSkill.save();
    await updateStreak(userId);
    res.json(savedSkill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/skills/:id', async (req, res) => {
  try {
    const updatedSkill = await Skill.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updatedSkill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/skills/:id', async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: "Skill deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   FEATURE 6: XP SHOP ROUTES
   ========================================================================== */

app.get('/api/shop/items', (req, res) => {
    res.json(SHOP_ITEMS);
});

app.post('/api/shop/buy', async (req, res) => {
    const { userId, itemId } = req.body;
    try {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if(!item) return res.status(404).json({ error: "Item not found" });

        const user = await UserProgress.findOne({ userId });
        if(!user) return res.status(404).json({ error: "User not found" });

        if(user.inventory.includes(itemId)) {
            return res.status(400).json({ error: "Already owned" });
        }

        if(user.xp < item.cost) {
            return res.status(400).json({ error: "Insufficient XP" });
        }

        user.xp -= item.cost;
        user.inventory.push(itemId);
        await user.save();

        res.json({ success: true, newXP: user.xp, inventory: user.inventory });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/shop/equip', async (req, res) => {
    const { userId, itemId, type } = req.body;
    try {
        const user = await UserProgress.findOne({ userId });
        if(!user) return res.status(404).json({ error: "User not found" });

        if(!user.inventory.includes(itemId)) {
            return res.status(403).json({ error: "You do not own this item" });
        }

        const itemDef = SHOP_ITEMS.find(i => i.id === itemId);
        
        if (type === 'theme') user.equipped.theme = itemId;
        if (type === 'title') user.equipped.title = itemDef.name;
        
        await user.save();
        res.json({ success: true, equipped: user.equipped });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/* ==========================================================================
   FEATURE 4: AI CHALLENGES & RESOURCES
   ========================================================================== */

app.post('/api/ai/skill-gap', async (req, res) => {
  const { currentSkills, targetRole } = req.body;
  try {
    const prompt = `I am a ${targetRole}. My current skills: ${currentSkills.join(', ')}.
    Identify 3-5 critical missing skills. 
    You MUST return a JSON object with a single key "suggestions" containing an array.
    Each item must have a "name" and a "category".
    Example: { "suggestions": [{"name": "Skill Name", "category": "Category Name"}] }`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a career coach. Output strictly valid JSON only." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const parsedData = JSON.parse(content);
    let rawSuggestions = Array.isArray(parsedData) ? parsedData : (parsedData.suggestions || []);
    
    // Normalize data
    const suggestions = rawSuggestions.map(s => {
        if (typeof s === 'string') return { name: s, category: 'Recommended' };
        return {
            name: s.name || s.skill || s.tool || "Unknown Skill",
            category: s.category || 'Recommended'
        };
    });

    res.json({ suggestions });
  } catch (error) {
    console.error("AI Skill Gap Error:", error);
    res.json({ suggestions: [] });
  }
});

app.post('/api/ai/generate-challenge', async (req, res) => {
  const { skill, level } = req.body;
  const difficulties = ["Novice", "Novice", "Beginner", "Beginner", "BOSS: Basic", "Intermediate", "Intermediate", "Adept", "Adept", "BOSS: Problem Solving", "Advanced", "Advanced", "Expert", "Expert", "BOSS: System Design", "Master", "Master", "Grandmaster", "Grandmaster", "FINAL BOSS"];
  const difficulty = difficulties[Math.min(level - 1, 19)];
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Generate a coding challenge for ${skill} at level ${level} (${difficulty}).
          Return JSON object: { "title": "...", "description": "...", "starterCode": "...", "hints": ["hint1", "hint2"] }`
        },
        { role: "user", content: `Generate challenge` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6, 
      response_format: { type: "json_object" }
    });
    res.json(JSON.parse(completion.choices[0]?.message?.content || "{}"));
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

app.post('/api/ai/validate-challenge', async (req, res) => {
  const { question, userAnswer, level } = req.body;
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
            role: "system", 
            content: `Evaluate code. Return JSON: { "passed": boolean, "stars": number, "feedback": "string" }` 
        },
        { role: "user", content: `Q: ${question}\nCode: ${userAnswer}` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    if (result.passed) {
        result.newXP = (level || 1) * 100;
    } else {
        result.newXP = 0;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Validation failed" });
  }
});

app.post('/api/ai/recommend-resources', async (req, res) => {
    const { skill } = req.body;
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: `Generate 3 learning resources for ${skill} as JSON: { "resources": [{ "title": "...", "url": "..." }] }` }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
      });
      const data = JSON.parse(completion.choices[0]?.message?.content || "{}");
      res.json({ resources: data.resources || [] });
    } catch (err) {
      res.json({ resources: [] });
    }
});

app.get('/api/market-insights', (req, res) => {
    res.json({
      salaryData: [ { name: 'Jr', salary: 65000 }, { name: 'Sr', salary: 145000 } ],
      demandData: [ { month: 'Jan', demand: 4200 }, { month: 'May', demand: 6700 } ],
      hotSkills: ["React", "Node.js", "Python"]
    });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});