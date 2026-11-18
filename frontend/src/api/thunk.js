import { createAsyncThunk } from '@reduxjs/toolkit';
import { errorMessage } from './axios.js';

// createAsyncThunk wrapper: the thunk rejects with a readable message string.
export const apiThunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  });
