const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const JobDescription = require('../models/JobDescription');
const geminiService = require('../services/geminiService');

// @route   POST /api/jd/analyze
// @desc    Analyze job description
// @access  Private
router.post('/analyze', auth, [
  body('text').trim().notEmpty().withMessage('Job description text is required'),
  body('title').optional().trim(),
  body('company').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, title = 'Untitled', company = '' } = req.body;

    // Analyze JD using Gemini
    const extractedKeywords = await geminiService.analyzeJobDescription(text);

    // Save to database
    const jd = new JobDescription({
      userId: req.user._id,
      title,
      company,
      rawText: text,
      extractedKeywords
    });

    await jd.save();

    res.status(201).json({
      message: 'Job description analyzed successfully',
      jd: {
        id: jd._id,
        title,
        company,
        extractedKeywords,
        uploadDate: jd.uploadDate
      }
    });
  } catch (error) {
    console.error('JD analysis error:', error);
    res.status(500).json({ message: error.message || 'Error analyzing job description' });
  }
});

// @route   GET /api/jd/user/all
// @desc    Get all user's job descriptions
// @access  Private
router.get('/user/all', auth, async (req, res) => {
  try {
    const jds = await JobDescription.find({ userId: req.user._id })
      .select('title company uploadDate')
      .sort({ uploadDate: -1 });

    res.json(jds);
  } catch (error) {
    console.error('Get JDs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/jd/:id
// @desc    Get job description details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const jd = await JobDescription.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!jd) {
      return res.status(404).json({ message: 'Job description not found' });
    }

    res.json({
      id: jd._id,
      title: jd.title,
      company: jd.company,
      rawText: jd.rawText,
      extractedKeywords: jd.extractedKeywords,
      uploadDate: jd.uploadDate
    });
  } catch (error) {
    console.error('Get JD error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
