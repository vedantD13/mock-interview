const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Frontend', 'Backend', 'Tools', 'Soft Skills', 'Languages'],
    default: 'Tools' 
  },
  level: { type: Number, default: 0, min: 0, max: 100 }, // 0 to 100%
  target: { type: String, default: 'Intermediate' }, // Beginner, Intermediate, Expert
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Skill', SkillSchema);