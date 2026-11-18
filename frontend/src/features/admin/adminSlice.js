import { createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios.js';
import { apiThunk } from '../../api/thunk.js';
import { logout } from '../auth/authSlice.js';

export const fetchAdminOrders = apiThunk('admin/orders', async () => (await api.get('/admin/orders')).data);
export const updateAdminOrder = apiThunk('admin/updateOrder', async ({ id, status }) =>
  (await api.patch(`/admin/orders/${id}/status`, { status })).data
);
export const fetchOffers = apiThunk('admin/offers', async () => (await api.get('/admin/offers')).data);
export const createOffer = apiThunk('admin/createOffer', async (body) => (await api.post('/admin/offers', body)).data);
export const deleteOffer = apiThunk('admin/deleteOffer', async (id) => {
  await api.delete(`/admin/offers/${id}`);
  return id;
});

const initialState = { orders: [], offers: [] };

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => initialState)
      .addCase(fetchAdminOrders.fulfilled, (s, { payload }) => {
        s.orders = payload;
      })
      .addCase(updateAdminOrder.fulfilled, (s, { payload }) => {
        const index = s.orders.findIndex((o) => o.id === payload.id);
        if (index >= 0) s.orders[index] = payload;
      })
      .addCase(fetchOffers.fulfilled, (s, { payload }) => {
        s.offers = payload;
      })
      .addCase(createOffer.fulfilled, (s, { payload }) => {
        s.offers.unshift(payload);
      })
      .addCase(deleteOffer.fulfilled, (s, { payload }) => {
        s.offers = s.offers.filter((o) => o.id !== payload);
      });
  },
});

export default adminSlice.reducer;
