import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { uploadResume, getUserResumes } from '../store/slices/resumeSlice';
import { toast } from 'react-toastify';

const UploadResume = () => {
  const dispatch = useDispatch();
  const { resumes, loading } = useSelector((state) => state.resume);

  useEffect(() => {
    dispatch(getUserResumes());
  }, [dispatch]);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, DOCX, and TXT files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const result = await dispatch(uploadResume(file));
    if (uploadResume.fulfilled.match(result)) {
      toast.success('Resume uploaded successfully!');
      dispatch(getUserResumes());
    } else {
      toast.error(result.payload || 'Upload failed');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Upload Resume
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload your resume in PDF, DOCX, or TXT format. We'll extract the text and analyze it for optimization.
      </Typography>

      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mt: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s',
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop the file here' : 'Drag & drop a resume file here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select a file
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Supported formats: PDF, DOCX, TXT (Max 5MB)
        </Typography>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {resumes.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Your Resumes
          </Typography>
          <List>
            {resumes.map((resume) => (
              <Paper key={resume._id} sx={{ mb: 1 }}>
                <ListItem>
                  <DescriptionIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary={resume.originalFilename}
                    secondary={`Uploaded: ${new Date(resume.uploadDate).toLocaleDateString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete" disabled>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Paper>
            ))}
          </List>
        </Box>
      )}

      {resumes.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No resumes uploaded yet. Upload your first resume to get started!
        </Alert>
      )}
    </Box>
  );
};

export default UploadResume;
