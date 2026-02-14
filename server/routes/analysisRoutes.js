const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Resume = require('../models/Resume');
const JobDescription = require('../models/JobDescription');
const Analysis = require('../models/Analysis');
const geminiService = require('../services/geminiService');

// @route   POST /api/analyze
// @desc    Analyze resume against job description
// @access  Private
router.post('/', auth, [
  body('resumeId').notEmpty().withMessage('Resume ID is required'),
  body('jdId').notEmpty().withMessage('Job description ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { resumeId, jdId } = req.body;

    // Get resume and JD
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.user._id
    });

    const jd = await JobDescription.findOne({
      _id: jdId,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (!jd) {
      return res.status(404).json({ message: 'Job description not found' });
    }

    // Analyze using enhanced service (combines algorithmic + AI)
    const analysisResults = await geminiService.analyzeResumeMatch(
      resume.content.rawText,
      jd.extractedKeywords
    );

    // Match percentage is already calculated in the analysis
    const matchPercentage = analysisResults.matchPercentage || 0;

    // Save analysis
    const analysis = new Analysis({
      userId: req.user._id,
      resumeId,
      jdId,
      analysisResults: {
        atsScore: analysisResults.atsScore,
        matchPercentage,
        missingKeywords: analysisResults.missingKeywords || [],
        suggestions: analysisResults.suggestions || [],
        matchDetails: analysisResults.matchDetails || null,
        breakdown: analysisResults.breakdown || null
      }
    });

    await analysis.save();

    res.status(201).json({
      message: 'Analysis completed',
      analysis: {
        id: analysis._id,
        atsScore: analysisResults.atsScore,
        matchPercentage,
        missingKeywords: analysisResults.missingKeywords,
        suggestions: analysisResults.suggestions,
        matchDetails: analysisResults.matchDetails,
        breakdown: analysisResults.breakdown
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: error.message || 'Error analyzing resume' });
  }
});

// @route   POST /api/optimize
// @desc    Generate optimized resume
// @access  Private
router.post('/optimize', auth, [
  body('analysisId').notEmpty().withMessage('Analysis ID is required'),
  body('selectedKeywords').isArray().withMessage('Selected keywords must be an array'),
  body('optimizationLevel').optional().isIn(['aggressive', 'balanced', 'conservative'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { analysisId, selectedKeywords, optimizationLevel = 'balanced' } = req.body;

    // Get analysis
    const analysis = await Analysis.findOne({
      _id: analysisId,
      userId: req.user._id
    }).populate('resumeId');

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    const resume = analysis.resumeId;

    // Optimize resume using Gemini
    const optimizedContent = await geminiService.optimizeResume(
      resume.content.rawText,
      selectedKeywords,
      optimizationLevel
    );

    // Re-analyze optimized resume
    const jd = await JobDescription.findById(analysis.jdId);
    const reAnalysis = await geminiService.analyzeResumeMatch(
      optimizedContent,
      jd.extractedKeywords
    );

    // Update analysis
    analysis.optimizedResume = {
      content: optimizedContent,
      changesMade: [`Added ${selectedKeywords.length} keywords`],
      finalAtsScore: reAnalysis.atsScore,
      selectedKeywords
    };

    await analysis.save();

    res.json({
      message: 'Resume optimized successfully',
      optimizedResume: {
        content: optimizedContent,
        finalAtsScore: reAnalysis.atsScore,
        originalAtsScore: analysis.analysisResults.atsScore,
        improvement: reAnalysis.atsScore - analysis.analysisResults.atsScore
      }
    });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ message: error.message || 'Error optimizing resume' });
  }
});

// @route   GET /api/analyze/history
// @desc    Get user's analysis history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user._id })
      .populate('resumeId', 'originalFilename')
      .populate('jdId', 'title company')
      .select('analysisResults optimizedResume createdAt')
      .sort({ createdAt: -1 });

    res.json(analyses);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/analyze/save-optimized
// @desc    Save optimized resume as a new resume
// @access  Private
router.post('/save-optimized', auth, [
  body('analysisId').notEmpty().withMessage('Analysis ID is required'),
  body('filename').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { analysisId, filename } = req.body;

    // Get analysis with optimized resume
    const analysis = await Analysis.findOne({
      _id: analysisId,
      userId: req.user._id
    }).populate('resumeId');

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    if (!analysis.optimizedResume || !analysis.optimizedResume.content) {
      return res.status(400).json({ message: 'No optimized resume found. Please optimize first.' });
    }

    // Create new resume entry with optimized content
    const originalResume = analysis.resumeId;
    const optimizedFilename = filename || `optimized-${originalResume.originalFilename}`;

    const newResume = new Resume({
      userId: req.user._id,
      originalFilename: optimizedFilename,
      fileType: originalResume.fileType,
      filePath: originalResume.filePath, // Keep same path or generate new one
      content: {
        rawText: analysis.optimizedResume.content,
        parsedSections: originalResume.content.parsedSections // Keep original structure
      }
    });

    await newResume.save();

    res.status(201).json({
      message: 'Optimized resume saved successfully',
      resume: {
        id: newResume._id,
        filename: newResume.originalFilename
      }
    });
  } catch (error) {
    console.error('Save optimized resume error:', error);
    res.status(500).json({ message: error.message || 'Error saving optimized resume' });
  }
});

// @route   GET /api/analyze/:id
// @desc    Get specific analysis
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
      .populate('resumeId')
      .populate('jdId');

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
