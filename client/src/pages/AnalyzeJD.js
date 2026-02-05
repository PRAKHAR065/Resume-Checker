import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { analyzeJD, getUserJDs } from '../store/slices/jdSlice';
import { toast } from 'react-toastify';

const AnalyzeJD = () => {
  const [jdText, setJdText] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const dispatch = useDispatch();
  const { currentJD, loading, jds } = useSelector((state) => state.jd);

  useEffect(() => {
    dispatch(getUserJDs());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jdText.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    const result = await dispatch(analyzeJD({ text: jdText, title, company }));
    if (analyzeJD.fulfilled.match(result)) {
      toast.success('Job description analyzed successfully!');
    } else {
      toast.error(result.payload || 'Analysis failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analyze Job Description
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Paste a job description below and we'll extract key requirements, skills, and keywords.
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company (Optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={15}
                label="Job Description"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                variant="outlined"
                required
                placeholder="Paste the complete job description here..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                disabled={loading || !jdText.trim()}
                fullWidth
              >
                {loading ? 'Analyzing...' : 'Analyze Job Description'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {currentJD && currentJD.extractedKeywords && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h5" gutterBottom>
            Analysis Results
          </Typography>
          {currentJD.title && (
            <Typography variant="h6" color="primary" gutterBottom>
              {currentJD.title} {currentJD.company && `at ${currentJD.company}`}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Experience Level: <strong>{currentJD.extractedKeywords.experienceLevel}</strong>
            </Typography>

            {currentJD.extractedKeywords.requiredSkills?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Required Skills:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentJD.extractedKeywords.requiredSkills.map((skill, index) => (
                    <Chip key={index} label={skill} color="error" size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {currentJD.extractedKeywords.preferredSkills?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Preferred Skills:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentJD.extractedKeywords.preferredSkills.map((skill, index) => (
                    <Chip key={index} label={skill} color="warning" size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {currentJD.extractedKeywords.tools?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tools & Technologies:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentJD.extractedKeywords.tools.map((tool, index) => (
                    <Chip key={index} label={tool} color="info" size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {currentJD.extractedKeywords.keywords?.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Keywords:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentJD.extractedKeywords.keywords.map((keyword, index) => (
                    <Chip key={index} label={keyword} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {jds.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Previous Job Descriptions
          </Typography>
          {jds.map((jd) => (
            <Paper key={jd._id} sx={{ p: 2, mb: 1 }}>
              <Typography variant="subtitle1">
                {jd.title || 'Untitled'} {jd.company && `- ${jd.company}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Analyzed: {new Date(jd.uploadDate).toLocaleDateString()}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AnalyzeJD;
