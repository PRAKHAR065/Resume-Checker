import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  AutoFixHigh as OptimizeIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { getUserResumes } from '../store/slices/resumeSlice';
import { getUserJDs } from '../store/slices/jdSlice';
import { analyzeResume, optimizeResume } from '../store/slices/analysisSlice';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import api from '../services/api';

const OptimizeResume = () => {
  const [selectedResume, setSelectedResume] = useState('');
  const [selectedJD, setSelectedJD] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [optimizationLevel, setOptimizationLevel] = useState('balanced');
  const [showPreview, setShowPreview] = useState(false);
  const dispatch = useDispatch();
  const { resumes } = useSelector((state) => state.resume);
  const { jds } = useSelector((state) => state.jd);
  const { currentAnalysis, optimizedResume, loading, optimizing } = useSelector(
    (state) => state.analysis
  );

  useEffect(() => {
    dispatch(getUserResumes());
    dispatch(getUserJDs());
  }, [dispatch]);

  const handleAnalyze = async () => {
    if (!selectedResume || !selectedJD) {
      toast.error('Please select both resume and job description');
      return;
    }

    const result = await dispatch(
      analyzeResume({ resumeId: selectedResume, jdId: selectedJD })
    );
    if (analyzeResume.fulfilled.match(result)) {
      toast.success('Analysis completed!');
      setSelectedKeywords([]);
    } else {
      toast.error(result.payload || 'Analysis failed');
    }
  };

  const handleKeywordToggle = (keyword) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleOptimize = async () => {
    if (selectedKeywords.length === 0) {
      toast.error('Please select at least one keyword to add');
      return;
    }

    const result = await dispatch(
      optimizeResume({
        analysisId: currentAnalysis.id || currentAnalysis._id,
        selectedKeywords,
        optimizationLevel,
      })
    );
    if (optimizeResume.fulfilled.match(result)) {
      toast.success('Resume optimized successfully!');
      setShowPreview(true);
    } else {
      toast.error(result.payload || 'Optimization failed');
    }
  };

  const handleDownload = () => {
    if (!optimizedResume?.content) {
      toast.error('No optimized resume available');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    // Split content into lines
    const lines = doc.splitTextToSize(optimizedResume.content, maxWidth);
    
    let y = margin;
    const lineHeight = 7;
    const pageHeightUsable = pageHeight - 2 * margin;
    
    lines.forEach((line) => {
      if (y + lineHeight > pageHeightUsable) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });
    
    const filename = `optimized-resume-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    toast.success('Resume downloaded as PDF!');
  };

  const handleSaveOptimized = async () => {
    if (!optimizedResume?.content || !currentAnalysis) {
      toast.error('No optimized resume available to save');
      return;
    }

    try {
      const response = await api.post('/analyze/save-optimized', {
        analysisId: currentAnalysis.id || currentAnalysis._id,
        filename: `optimized-${getResumeName(selectedResume)}`
      });

      toast.success('Optimized resume saved successfully!');
      // Refresh resumes list
      dispatch(getUserResumes());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving optimized resume');
    }
  };

  const getResumeName = (id) => {
    const resume = resumes.find((r) => r._id === id);
    return resume?.originalFilename || 'Unknown';
  };

  const getJDName = (id) => {
    const jd = jds.find((j) => j._id === id);
    return jd?.title || 'Untitled';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Optimize Resume
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Select your resume and a job description to analyze and optimize your resume for better ATS scores.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Step 1: Select Resume & Job Description
            </Typography>
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>Select Resume</InputLabel>
              <Select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                label="Select Resume"
              >
                {resumes.map((resume) => (
                  <MenuItem key={resume._id} value={resume._id}>
                    {resume.originalFilename}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Job Description</InputLabel>
              <Select
                value={selectedJD}
                onChange={(e) => setSelectedJD(e.target.value)}
                label="Select Job Description"
              >
                {jds.map((jd) => (
                  <MenuItem key={jd._id} value={jd._id}>
                    {jd.title || 'Untitled'} {jd.company && `- ${jd.company}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              fullWidth
              onClick={handleAnalyze}
              disabled={loading || !selectedResume || !selectedJD}
            >
              {loading ? <CircularProgress size={24} /> : 'Analyze Resume'}
            </Button>
          </Paper>
        </Grid>

        {currentAnalysis && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Analysis Results
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body1" fontWeight="bold">
                      ATS Score
                    </Typography>
                    <Typography variant="h5" color={currentAnalysis.atsScore >= 70 ? 'success.main' : currentAnalysis.atsScore >= 50 ? 'warning.main' : 'error.main'}>
                      {currentAnalysis.atsScore}/100
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={currentAnalysis.atsScore}
                    sx={{ 
                      height: 12, 
                      borderRadius: 1,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: currentAnalysis.atsScore >= 70 ? 'success.main' : currentAnalysis.atsScore >= 50 ? 'warning.main' : 'error.main'
                      }
                    }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Match Percentage: <strong>{currentAnalysis.matchPercentage}%</strong>
                </Typography>

                {/* Detailed Breakdown */}
                {currentAnalysis.matchDetails && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Score Breakdown:
                    </Typography>
                    
                    {currentAnalysis.matchDetails.requiredSkills && (
                      <Box sx={{ mt: 1.5, mb: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" fontWeight="bold">
                            Required Skills
                          </Typography>
                          <Typography variant="caption">
                            {currentAnalysis.matchDetails.requiredSkills.matched}/{currentAnalysis.matchDetails.requiredSkills.total} ({currentAnalysis.matchDetails.requiredSkills.percentage}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={currentAnalysis.matchDetails.requiredSkills.percentage}
                          sx={{ height: 6, borderRadius: 1 }}
                          color="error"
                        />
                      </Box>
                    )}

                    {currentAnalysis.matchDetails.preferredSkills && (
                      <Box sx={{ mt: 1.5, mb: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" fontWeight="bold">
                            Preferred Skills
                          </Typography>
                          <Typography variant="caption">
                            {currentAnalysis.matchDetails.preferredSkills.matched}/{currentAnalysis.matchDetails.preferredSkills.total} ({currentAnalysis.matchDetails.preferredSkills.percentage}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={currentAnalysis.matchDetails.preferredSkills.percentage}
                          sx={{ height: 6, borderRadius: 1 }}
                          color="warning"
                        />
                      </Box>
                    )}

                    {currentAnalysis.matchDetails.tools && (
                      <Box sx={{ mt: 1.5, mb: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" fontWeight="bold">
                            Tools & Technologies
                          </Typography>
                          <Typography variant="caption">
                            {currentAnalysis.matchDetails.tools.matched}/{currentAnalysis.matchDetails.tools.total} ({currentAnalysis.matchDetails.tools.percentage}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={currentAnalysis.matchDetails.tools.percentage}
                          sx={{ height: 6, borderRadius: 1 }}
                          color="info"
                        />
                      </Box>
                    )}

                    {currentAnalysis.matchDetails.keywords && (
                      <Box sx={{ mt: 1.5, mb: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" fontWeight="bold">
                            Keywords
                          </Typography>
                          <Typography variant="caption">
                            {currentAnalysis.matchDetails.keywords.matched}/{currentAnalysis.matchDetails.keywords.total} ({currentAnalysis.matchDetails.keywords.percentage}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={currentAnalysis.matchDetails.keywords.percentage}
                          sx={{ height: 6, borderRadius: 1 }}
                          color="secondary"
                        />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {currentAnalysis && currentAnalysis.missingKeywords?.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Step 2: Select Keywords to Add
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the keywords you want to add to your resume. They will be integrated naturally into your resume.
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Optimization Level</InputLabel>
            <Select
              value={optimizationLevel}
              onChange={(e) => setOptimizationLevel(e.target.value)}
              label="Optimization Level"
            >
              <MenuItem value="conservative">Conservative (Minimal changes)</MenuItem>
              <MenuItem value="balanced">Balanced (Natural integration)</MenuItem>
              <MenuItem value="aggressive">Aggressive (Max keyword density)</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {['Technical Skills', 'Soft Skills', 'Tools/Technologies', 'Certifications', 'Experience Keywords'].map(
              (category) => {
                const keywords = currentAnalysis.missingKeywords.filter(
                  (k) => k.category === category
                );
                if (keywords.length === 0) return null;

                return (
                  <Box key={category} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {category}
                    </Typography>
                    <FormGroup>
                      {keywords.map((item, index) => (
                        <FormControlLabel
                          key={index}
                          control={
                            <Checkbox
                              checked={selectedKeywords.includes(item.keyword)}
                              onChange={() => handleKeywordToggle(item.keyword)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{item.keyword}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Importance: {item.importance}/10 | Suggested Section: {item.suggestedSection}
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Box>
                );
              }
            )}
          </Box>

          {selectedKeywords.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Keywords ({selectedKeywords.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedKeywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    onDelete={() => handleKeywordToggle(keyword)}
                    color="primary"
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            startIcon={optimizing ? <CircularProgress size={20} color="inherit" /> : <OptimizeIcon />}
            onClick={handleOptimize}
            disabled={optimizing || selectedKeywords.length === 0}
            fullWidth
            sx={{ mt: 3 }}
          >
            {optimizing ? 'Optimizing...' : 'Optimize Resume'}
          </Button>
        </Paper>
      )}

      {optimizedResume && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Optimized Resume
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveOptimized}
              >
                Save as New Resume
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download PDF
              </Button>
            </Box>
          </Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            ATS Score improved from {optimizedResume.originalAtsScore || currentAnalysis?.atsScore || 0} to {optimizedResume.finalAtsScore} (+{optimizedResume.improvement || (optimizedResume.finalAtsScore - (optimizedResume.originalAtsScore || currentAnalysis?.atsScore || 0))} points)!
          </Alert>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              maxHeight: 400,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }}
          >
            {optimizedResume.content}
          </Paper>
        </Paper>
      )}

      {currentAnalysis && currentAnalysis.suggestions?.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Suggestions
          </Typography>
          <ul>
            {currentAnalysis.suggestions.map((suggestion, index) => (
              <li key={index}>
                <Typography variant="body2">{suggestion}</Typography>
              </li>
            ))}
          </ul>
        </Paper>
      )}
    </Box>
  );
};

export default OptimizeResume;
