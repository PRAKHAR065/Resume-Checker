import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import resumeReducer from './slices/resumeSlice';
import jdReducer from './slices/jdSlice';
import analysisReducer from './slices/analysisSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    resume: resumeReducer,
    jd: jdReducer,
    analysis: analysisReducer,
  },
});
