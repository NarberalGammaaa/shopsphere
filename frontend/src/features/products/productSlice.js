import { createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios.js';
import { apiThunk } from '../../api/thunk.js';

export const fetchProducts = apiThunk('products/fetchAll', async (params) => (await api.get('/products', { params })).data);
export const fetchCategories = apiThunk('products/fetchCategories', async () => (await api.get('/categories')).data);
export const fetchProduct = apiThunk('products/fetchOne', async (id) => (await api.get(`/products/${id}`)).data);

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
      });
  },
});

export default productSlice.reducer;
