const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Tools' },
  level: { type: Number, default: 0 },
  unlockedLevel: { type: Number, default: 1 },
  levelStars: { type: Object, default: {} },
  target: { type: String, default: 'Intermediate' },
  resources: { type: Array, default: [] },
  lastPracticed: { type: Date, default: Date.now },
  // NEW FIELD: Prerequisites
  prerequisites: [{ 
      skillName: String, 
      requiredLevel: Number 
  }]
});

module.exports = mongoose.model('Skill', SkillSchema);