import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const analyzeResume = createAsyncThunk(
  'analysis/analyze',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/analyze', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Analysis failed');
    }
  }
);

export const optimizeResume = createAsyncThunk(
  'analysis/optimize',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/optimize', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Optimization failed');
    }
  }
);

export const getAnalysisHistory = createAsyncThunk(
  'analysis/getHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analyze/history');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch history');
    }
  }
);

export const getAnalysisDetails = createAsyncThunk(
  'analysis/getDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/analyze/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analysis');
    }
  }
);

const analysisSlice = createSlice({
  name: 'analysis',
  initialState: {
    currentAnalysis: null,
    optimizedResume: null,
    history: [],
    loading: false,
    optimizing: false,
    error: null,
  },
  reducers: {
    clearAnalysis: (state) => {
      state.currentAnalysis = null;
      state.optimizedResume = null;
    },
    clearOptimizedResume: (state) => {
      state.optimizedResume = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeResume.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnalysis = action.payload.analysis;
      })
      .addCase(analyzeResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(optimizeResume.pending, (state) => {
        state.optimizing = true;
        state.error = null;
      })
      .addCase(optimizeResume.fulfilled, (state, action) => {
        state.optimizing = false;
        state.optimizedResume = action.payload.optimizedResume;
      })
      .addCase(optimizeResume.rejected, (state, action) => {
        state.optimizing = false;
        state.error = action.payload;
      })
      .addCase(getAnalysisHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })
      .addCase(getAnalysisDetails.fulfilled, (state, action) => {
        state.currentAnalysis = action.payload;
      });
  },
});

export const { clearAnalysis, clearOptimizedResume } = analysisSlice.actions;
export default analysisSlice.reducer;
