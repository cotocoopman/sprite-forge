import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@store': resolve(__dirname, 'src/store'),
      '@components': resolve(__dirname, 'src/components'),
    },
  },
  server: { port: 5173 },
  build: { minify: true },
});
