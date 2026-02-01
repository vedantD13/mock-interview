const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Tools' },
  level: { type: Number, default: 0 },         // Matches frontend 'level'
  target: { type: String, default: 'Intermediate' }, // Matches frontend 'target' (String)
  resources: [{
    title: String,
    url: String
  }],
  lastPracticed: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Skill', SkillSchema);