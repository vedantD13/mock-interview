const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },         // Currency (Spendable)
  lifetimeXP: { type: Number, default: 0 }, // Rank (Cumulative)
  streak: { type: Number, default: 1 },
  lastActivity: { type: Date, default: Date.now },
  
  // --- NEW: Shop Data ---
  inventory: { type: [String], default: ['title-novice', 'theme-light'] }, // IDs of owned items
  equipped: {
    theme: { type: String, default: 'light' },
    title: { type: String, default: 'Novice' }
  }
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);