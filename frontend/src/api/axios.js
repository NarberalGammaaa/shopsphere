import axios from 'axios';

// '/api' works in dev (Vite proxy) and in Docker (nginx proxy). Override with VITE_API_URL if needed.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  try {
    const auth = JSON.parse(localStorage.getItem('auth') || 'null');
    if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`;
  } catch {
    /* corrupt storage: send the request without a token */
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    // Expired/invalid token on a protected call: drop the session and go to the right login page.
    if (error.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('auth');
      const inSeller = window.location.pathname.startsWith('/seller');
      const target = inSeller ? '/seller/login' : '/login';
      if (window.location.pathname !== target) window.location.assign(target);
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (e) => e.response?.data?.message || e.message || 'Something went wrong';

export default api;
