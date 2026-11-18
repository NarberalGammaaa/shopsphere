import { createSlice } from '@reduxjs/toolkit';

const load = () => {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: load() },
  reducers: {
    addToCart(state, { payload: product }) {
      // price shown in the cart is the sale price; the server recalculates it at checkout anyway
      const price = product.salePrice ?? product.price;
      const line = state.items.find((i) => i.id === product.id);
      if (line) {
        line.stock = product.stock;
        line.price = price;
        line.quantity = Math.min(line.quantity + 1, product.stock);
      } else {
        state.items.push({
          id: product.id,
          name: product.name,
          price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          quantity: 1,
        });
      }
    },
    setQuantity(state, { payload: { id, quantity } }) {
      const line = state.items.find((i) => i.id === id);
      if (line) line.quantity = Math.max(1, Math.min(quantity, line.stock));
    },
    removeFromCart(state, { payload: id }) {
      state.items = state.items.filter((i) => i.id !== id);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, setQuantity, removeFromCart, clearCart } = cartSlice.actions;

export const selectCartCount = (state) => state.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartTotal = (state) => state.cart.items.reduce((n, i) => n + i.price * i.quantity, 0);

export default cartSlice.reducer;
