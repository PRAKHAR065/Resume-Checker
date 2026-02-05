const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    default: ''
  },
  rawText: {
    type: String,
    required: true
  },
  extractedKeywords: {
    required: [String],
    preferred: [String],
    tools: [String],
    experienceLevel: {
      type: String,
      enum: ['Entry', 'Mid', 'Senior'],
      default: 'Mid'
    },
    keywords: [String]
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
