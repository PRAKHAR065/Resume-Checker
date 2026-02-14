const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  jdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    required: true
  },
  analysisResults: {
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    matchPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    missingKeywords: [{
      keyword: String,
      category: {
        type: String,
        enum: ['Technical Skills', 'Soft Skills', 'Tools/Technologies', 'Certifications', 'Experience Keywords']
      },
      importance: {
        type: Number,
        min: 1,
        max: 10
      },
      suggestedSection: String
    }],
    suggestions: [String],
    matchDetails: {
      requiredSkills: {
        matched: Number,
        total: Number,
        percentage: Number
      },
      preferredSkills: {
        matched: Number,
        total: Number,
        percentage: Number
      },
      tools: {
        matched: Number,
        total: Number,
        percentage: Number
      },
      keywords: {
        matched: Number,
        total: Number,
        percentage: Number
      }
    },
    breakdown: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  optimizedResume: {
    content: String,
    changesMade: [String],
    finalAtsScore: Number,
    selectedKeywords: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analysis', analysisSchema);
