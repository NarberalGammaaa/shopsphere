import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errorMessage } from '../../api/axios.js';

const thunk = (type, fn) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  });

export const fetchProducts = thunk('products/fetchAll', async (params) => (await api.get('/products', { params })).data);
export const fetchCategories = thunk('products/fetchCategories', async () => (await api.get('/categories')).data);
export const fetchProduct = thunk('products/fetchOne', async (id) => (await api.get(`/products/${id}`)).data);

// Admin only (the backend enforces ROLE_ADMIN)
export const saveProduct = thunk('products/save', async ({ id, ...body }) =>
  (id ? await api.put(`/admin/products/${id}`, body) : await api.post('/admin/products', body)).data
);
export const deleteProduct = thunk('products/delete', async (id) => {
  await api.delete(`/admin/products/${id}`);
  return id;
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
    categories: [],
    current: null,
    listStatus: 'idle',
    detailStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => {
        s.listStatus = 'loading';
        s.error = null;
      })
      .addCase(fetchProducts.fulfilled, (s, { payload }) => {
        s.listStatus = 'idle';
        s.items = payload.content;
        s.page = payload.page;
        s.totalPages = payload.totalPages;
        s.totalElements = payload.totalElements;
      })
      .addCase(fetchProducts.rejected, (s, { payload }) => {
        s.listStatus = 'failed';
        s.error = payload;
      })
      .addCase(fetchCategories.fulfilled, (s, { payload }) => {
        s.categories = payload;
      })
      .addCase(fetchProduct.pending, (s) => {
        s.detailStatus = 'loading';
        s.current = null;
      })
      .addCase(fetchProduct.fulfilled, (s, { payload }) => {
        s.detailStatus = 'idle';
        s.current = payload;
      })
      .addCase(fetchProduct.rejected, (s, { payload }) => {
        s.detailStatus = 'failed';
        s.error = payload;
      })
      .addCase(saveProduct.fulfilled, (s, { payload }) => {
        const index = s.items.findIndex((p) => p.id === payload.id);
        if (index >= 0) s.items[index] = payload;
        else s.items.unshift(payload);
      })
      .addCase(deleteProduct.fulfilled, (s, { payload }) => {
        s.items = s.items.filter((p) => p.id !== payload);
      });
  },
});

export default productSlice.reducer;
