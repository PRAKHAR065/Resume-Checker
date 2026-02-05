const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'txt'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  content: {
    rawText: {
      type: String,
      required: true
    },
    parsedSections: {
      experience: [{
        title: String,
        company: String,
        duration: String,
        description: String
      }],
      skills: [String],
      education: [{
        degree: String,
        institution: String,
        year: String
      }],
      summary: String,
      contact: {
        email: String,
        phone: String,
        location: String
      }
    }
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', resumeSchema);
