import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errorMessage } from '../../api/axios.js';

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem('auth') || 'null');
  } catch {
    return null;
  }
})();

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return (await api.post('/auth/login', credentials)).data;
  } catch (e) {
    return rejectWithValue(errorMessage(e));
  }
});

export const register = createAsyncThunk('auth/register', async (details, { rejectWithValue }) => {
  try {
    return (await api.post('/auth/register', details)).data;
  } catch (e) {
    return rejectWithValue(errorMessage(e));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: saved?.token || null, user: saved?.user || null, status: 'idle', error: null },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.status = 'loading';
      state.error = null;
    };
    const fulfilled = (state, { payload }) => {
      state.status = 'idle';
      state.token = payload.token;
      state.user = payload.user;
    };
    const rejected = (state, { payload }) => {
      state.status = 'idle';
      state.error = payload;
    };
    builder
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, fulfilled)
      .addCase(register.rejected, rejected);
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
