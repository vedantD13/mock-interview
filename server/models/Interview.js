const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: { type: String, default: 'guest' },
  jsonResume: { type: Object }, // Stores extracted skills/experience
  messages: [
    {
      role: { type: String, enum: ['ai', 'user'] },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);