import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const analyzeJD = createAsyncThunk(
  'jd/analyze',
  async (jdData, { rejectWithValue }) => {
    try {
      const response = await api.post('/jd/analyze', jdData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'JD analysis failed');
    }
  }
);

export const getUserJDs = createAsyncThunk(
  'jd/getUserJDs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/jd/user/all');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch JDs');
    }
  }
);

export const getJDDetails = createAsyncThunk(
  'jd/getDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/jd/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch JD');
    }
  }
);

const jdSlice = createSlice({
  name: 'jd',
  initialState: {
    jds: [],
    currentJD: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentJD: (state) => {
      state.currentJD = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeJD.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeJD.fulfilled, (state, action) => {
        state.loading = false;
        state.currentJD = action.payload.jd;
        state.jds.unshift(action.payload.jd);
      })
      .addCase(analyzeJD.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getUserJDs.fulfilled, (state, action) => {
        state.jds = action.payload;
      })
      .addCase(getJDDetails.fulfilled, (state, action) => {
        state.currentJD = action.payload;
      });
  },
});

export const { clearCurrentJD } = jdSlice.actions;
export default jdSlice.reducer;
