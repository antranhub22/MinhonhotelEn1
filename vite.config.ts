import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath, URL } from 'url';

// helper to use __dirname equivalent
const root = fileURLToPath(new URL('./client', import.meta.url));
const outDir = fileURLToPath(new URL('./dist/public', import.meta.url));

export default defineConfig({
  root,
  base: './',
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./client/src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '@assets': fileURLToPath(new URL('./attached_assets', import.meta.url))
    }
  },
  plugins: [
    react()
  ]
});
