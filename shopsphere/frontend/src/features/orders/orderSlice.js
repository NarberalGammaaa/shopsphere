import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errorMessage } from '../../api/axios.js';
import { logout } from '../auth/authSlice.js';

const thunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  });

export const placeOrder = thunk('orders/place', async (body) => (await api.post('/orders', body)).data);
export const fetchMyOrders = thunk('orders/fetchMine', async () => (await api.get('/orders/my')).data);

// Admin only
export const fetchAllOrders = thunk('orders/fetchAll', async () => (await api.get('/admin/orders')).data);
export const updateOrderStatus = thunk('orders/updateStatus', async ({ id, status }) =>
  (await api.patch(`/admin/orders/${id}/status`, { status })).data
);

const initialState = { mine: [], all: [], status: 'idle', error: null };

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => initialState)
      .addCase(fetchMyOrders.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (s, { payload }) => {
        s.status = 'idle';
        s.mine = payload;
      })
      .addCase(fetchMyOrders.rejected, (s, { payload }) => {
        s.status = 'failed';
        s.error = payload;
      })
      .addCase(fetchAllOrders.fulfilled, (s, { payload }) => {
        s.all = payload;
      })
      .addCase(updateOrderStatus.fulfilled, (s, { payload }) => {
        const index = s.all.findIndex((o) => o.id === payload.id);
        if (index >= 0) s.all[index] = payload;
      });
  },
});

export default orderSlice.reducer;
