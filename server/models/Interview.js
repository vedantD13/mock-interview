const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: String,
  jsonResume: Object,
  messages: Array,
  // NEW: Store the feedback so the Dashboard can show it
  feedback: {
    rating: Number,
    feedback: String,
    improvement: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);