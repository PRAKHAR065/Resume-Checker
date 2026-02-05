import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const uploadResume = createAsyncThunk(
  'resume/upload',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const response = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Upload failed');
    }
  }
);

export const getUserResumes = createAsyncThunk(
  'resume/getUserResumes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/resume/user/all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch resumes');
    }
  }
);

export const getResumeDetails = createAsyncThunk(
  'resume/getDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/resume/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch resume');
    }
  }
);

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    resumes: [],
    currentResume: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentResume: (state) => {
      state.currentResume = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.loading = false;
        state.resumes.unshift(action.payload.resume);
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getUserResumes.fulfilled, (state, action) => {
        state.resumes = action.payload;
      })
      .addCase(getResumeDetails.fulfilled, (state, action) => {
        state.currentResume = action.payload;
      });
  },
});

export const { clearCurrentResume } = resumeSlice.actions;
export default resumeSlice.reducer;
