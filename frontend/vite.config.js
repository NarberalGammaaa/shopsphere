import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api calls are proxied to Spring Boot so the browser sees one origin (no CORS fuss).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
    },
  },
});
