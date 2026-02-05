import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import { getAnalysisHistory } from '../store/slices/analysisSlice';

const History = () => {
  const dispatch = useDispatch();
  const { history, loading } = useSelector((state) => state.analysis);

  useEffect(() => {
    dispatch(getAnalysisHistory());
  }, [dispatch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (history.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Analysis History
        </Typography>
        <Alert severity="info" sx={{ mt: 3 }}>
          No analysis history found. Start by analyzing a resume against a job description.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analysis History
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        View all your resume analyses and optimizations.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {history.map((item) => (
          <Grid item xs={12} md={6} key={item._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {item.resumeId?.originalFilename || 'Resume'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {item.jdId?.title || 'Job Description'} {item.jdId?.company && `at ${item.jdId.company}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(item.createdAt).toLocaleString()}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Initial ATS Score: <strong>{item.analysisResults?.atsScore}/100</strong>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={item.analysisResults?.atsScore || 0}
                    sx={{ mt: 1, mb: 2, height: 8, borderRadius: 1 }}
                  />
                </Box>

                {item.optimizedResume?.finalAtsScore && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Optimized ATS Score: <strong>{item.optimizedResume.finalAtsScore}/100</strong>
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={item.optimizedResume.finalAtsScore}
                      sx={{ mt: 1, mb: 2, height: 8, borderRadius: 1 }}
                      color="success"
                    />
                    <Chip
                      label={`+${item.optimizedResume.finalAtsScore - item.analysisResults.atsScore} improvement`}
                      color="success"
                      size="small"
                    />
                  </Box>
                )}

                {item.analysisResults?.missingKeywords?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Missing Keywords: {item.analysisResults.missingKeywords.length}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default History;
