const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  personal: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    title: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    summary: { type: String, default: '' },
    photo: { type: String, default: '' } // Added field for Base64 image
  },
  experience: [{
    id: Number,
    company: String,
    role: String,
    startDate: String,
    endDate: String,
    description: String
  }],
  education: [{ // Added education array
    id: Number,
    school: String,
    degree: String,
    year: String
  }],
  skills: [{
    id: Number,
    name: String,
    level: String
  }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', ResumeSchema);