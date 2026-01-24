const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 1 },
  lastActivity: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);