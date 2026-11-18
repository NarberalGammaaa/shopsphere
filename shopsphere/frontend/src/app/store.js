import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import cartReducer from '../features/cart/cartSlice.js';
import productReducer from '../features/products/productSlice.js';
import orderReducer from '../features/orders/orderSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    orders: orderReducer,
  },
});

// Persist the session and the cart so a refresh keeps them. Only writes when the slice changed.
let lastAuth;
let lastCart;
store.subscribe(() => {
  const { auth, cart } = store.getState();
  if (auth !== lastAuth) {
    lastAuth = auth;
    if (auth.token) localStorage.setItem('auth', JSON.stringify({ token: auth.token, user: auth.user }));
    else localStorage.removeItem('auth');
  }
  if (cart !== lastCart) {
    lastCart = cart;
    localStorage.setItem('cart', JSON.stringify(cart.items));
  }
});
