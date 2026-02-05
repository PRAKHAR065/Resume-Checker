import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Description as DescriptionIcon,
  AutoFixHigh as OptimizeIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { getUserResumes } from '../store/slices/resumeSlice';
import { getUserJDs } from '../store/slices/jdSlice';
import { getAnalysisHistory } from '../store/slices/analysisSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { resumes, loading: resumesLoading } = useSelector((state) => state.resume);
  const { jds, loading: jdsLoading } = useSelector((state) => state.jd);
  const { history, loading: historyLoading } = useSelector((state) => state.analysis);

  useEffect(() => {
    dispatch(getUserResumes());
    dispatch(getUserJDs());
    dispatch(getAnalysisHistory());
  }, [dispatch]);

  const cards = [
    {
      title: 'Resumes',
      count: resumes.length,
      icon: <UploadIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/upload'),
      color: '#1976d2',
    },
    {
      title: 'Job Descriptions',
      count: jds.length,
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/analyze-jd'),
      color: '#2e7d32',
    },
    {
      title: 'Optimizations',
      count: history.length,
      icon: <OptimizeIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/optimize'),
      color: '#ed6c02',
    },
    {
      title: 'History',
      count: history.length,
      icon: <HistoryIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/history'),
      color: '#9c27b0',
    },
  ];

  if (resumesLoading || jdsLoading || historyLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to your Resume Optimizer dashboard. Upload your resume, analyze job descriptions, and optimize your resume for better ATS scores.
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: card.color, mb: 2 }}>{card.icon}</Box>
                <Typography variant="h4" component="div">
                  {card.count}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={card.action} fullWidth>
                  View
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<UploadIcon />}
              onClick={() => navigate('/upload')}
            >
              Upload Resume
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<DescriptionIcon />}
              onClick={() => navigate('/analyze-jd')}
            >
              Analyze Job Description
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
