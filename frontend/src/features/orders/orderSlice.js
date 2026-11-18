import { createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios.js';
import { apiThunk } from '../../api/thunk.js';
import { logout } from '../auth/authSlice.js';

// POST /orders returns { orders, payment }. payment is null for cash on delivery.
export const checkout = apiThunk('orders/checkout', async (body) => (await api.post('/orders', body)).data);
export const fetchMyOrders = apiThunk('orders/fetchMine', async () => (await api.get('/orders/my')).data);
export const fetchOrder = apiThunk('orders/fetchOne', async (id) => (await api.get(`/orders/${id}`)).data);
export const verifyPayment = apiThunk('orders/verifyPayment', async (body) => (await api.post('/payments/verify', body)).data);
export const startPayment = apiThunk('orders/startPayment', async (checkoutId) => (await api.post(`/payments/${checkoutId}/init`)).data);

const initialState = { mine: [], current: null, status: 'idle', detailStatus: 'idle', error: null };

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
      .addCase(fetchOrder.pending, (s) => {
        s.detailStatus = 'loading';
        s.current = null;
      })
      .addCase(fetchOrder.fulfilled, (s, { payload }) => {
        s.detailStatus = 'idle';
        s.current = payload;
      })
      .addCase(fetchOrder.rejected, (s, { payload }) => {
        s.detailStatus = 'failed';
        s.error = payload;
      });
  },
});

export default orderSlice.reducer;
