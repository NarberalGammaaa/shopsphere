import { createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios.js';
import { apiThunk } from '../../api/thunk.js';
import { logout } from '../auth/authSlice.js';

export const fetchSellerStats = apiThunk('seller/stats', async () => (await api.get('/seller/stats')).data);
export const fetchSellerProducts = apiThunk('seller/products', async (params) => (await api.get('/seller/products', { params })).data);
export const saveSellerProduct = apiThunk('seller/saveProduct', async ({ id, ...body }) =>
  (id ? await api.put(`/seller/products/${id}`, body) : await api.post('/seller/products', body)).data
);
export const deleteSellerProduct = apiThunk('seller/deleteProduct', async (id) => {
  await api.delete(`/seller/products/${id}`);
  return id;
});
export const fetchSellerOrders = apiThunk('seller/orders', async () => (await api.get('/seller/orders')).data);
export const updateSellerOrder = apiThunk('seller/updateOrder', async ({ id, status }) =>
  (await api.patch(`/seller/orders/${id}/status`, { status })).data
);

const initialState = { stats: null, products: [], page: 0, totalPages: 0, orders: [] };

const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => initialState)
      .addCase(fetchSellerStats.fulfilled, (s, { payload }) => {
        s.stats = payload;
      })
      .addCase(fetchSellerProducts.fulfilled, (s, { payload }) => {
        s.products = payload.content;
        s.page = payload.page;
        s.totalPages = payload.totalPages;
      })
      .addCase(saveSellerProduct.fulfilled, (s, { payload }) => {
        const index = s.products.findIndex((p) => p.id === payload.id);
        if (index >= 0) s.products[index] = payload;
        else s.products.unshift(payload);
      })
      .addCase(deleteSellerProduct.fulfilled, (s, { payload }) => {
        s.products = s.products.filter((p) => p.id !== payload);
      })
      .addCase(fetchSellerOrders.fulfilled, (s, { payload }) => {
        s.orders = payload;
      })
      .addCase(updateSellerOrder.fulfilled, (s, { payload }) => {
        const index = s.orders.findIndex((o) => o.id === payload.id);
        if (index >= 0) s.orders[index] = payload;
      });
  },
});

export default sellerSlice.reducer;
