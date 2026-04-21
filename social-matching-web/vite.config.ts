import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '::',
    port: 4173,
  },
  /** Same defaults as dev so `vite preview` works from a phone / LAN IP after a local build. */
  preview: {
    host: '::',
    port: 4173,
  },
});
