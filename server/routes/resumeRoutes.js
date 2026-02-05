const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Resume = require('../models/Resume');
const fileParser = require('../services/fileParser');
const path = require('path');
const fs = require('fs');

// @route   POST /api/resume/upload
// @desc    Upload and parse resume
// @access  Private
router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).slice(1).toLowerCase();
    const originalFilename = req.file.originalname;

    // Parse file
    const parsedData = await fileParser.parseFile(filePath, fileType);
    const parsedSections = fileParser.parseResumeSections(parsedData.text);

    // Save to database
    const resume = new Resume({
      userId: req.user._id,
      originalFilename,
      fileType,
      filePath,
      content: {
        rawText: parsedData.text,
        parsedSections
      }
    });

    await resume.save();

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        id: resume._id,
        filename: originalFilename,
        fileType,
        uploadDate: resume.uploadDate
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message || 'Error uploading resume' });
  }
});

// @route   GET /api/resume/user/all
// @desc    Get all user's resumes
// @access  Private
router.get('/user/all', auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .select('originalFilename fileType uploadDate')
      .sort({ uploadDate: -1 });

    res.json(resumes);
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/resume/:id
// @desc    Get resume details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.json({
      id: resume._id,
      filename: resume.originalFilename,
      fileType: resume.fileType,
      content: resume.content,
      uploadDate: resume.uploadDate
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/resume/:id
// @desc    Delete resume
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete file
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    await Resume.deleteOne({ _id: req.params.id });

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
