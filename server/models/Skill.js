const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  level: { type: Number, default: 0 },
  goal: { type: Number, default: 100 },
  category: { type: String, enum: ['Technical', 'Soft Skill'], default: 'Technical' }
});

module.exports = mongoose.model('Skill', SkillSchema);