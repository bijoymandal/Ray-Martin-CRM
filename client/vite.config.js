import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Determine backend target based on environment
// 'server' works within Docker Compose network, 'localhost' is for local host machine dev.
const backendTarget = process.env.BACKEND_URL || (process.env.DOCKER_RUNNING ? 'http://server:5000' : 'http://localhost:5000');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
});
