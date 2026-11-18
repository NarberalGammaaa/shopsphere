import { createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios.js';
import { apiThunk } from '../../api/thunk.js';

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem('auth') || 'null');
  } catch {
    return null;
  }
})();

// Customers (and the admin) use /auth/*, sellers have their own endpoints under /seller/auth/*.
export const login = apiThunk('auth/login', async (body) => (await api.post('/auth/login', body)).data);
export const register = apiThunk('auth/register', async (body) => (await api.post('/auth/register', body)).data);
export const sellerLogin = apiThunk('auth/sellerLogin', async (body) => (await api.post('/seller/auth/login', body)).data);
export const sellerRegister = apiThunk('auth/sellerRegister', async (body) => (await api.post('/seller/auth/register', body)).data);

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
    [login, register, sellerLogin, sellerRegister].forEach((thunk) => {
      builder.addCase(thunk.pending, pending).addCase(thunk.fulfilled, fulfilled).addCase(thunk.rejected, rejected);
    });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
