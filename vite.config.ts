import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    // O plugin do Router precisa vir antes do React para gerar o routeTree.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    host: process.env.HOST ?? 'localhost',
    // O HMR sai da raiz para não colidir com o Socket.IO interceptado pelo MSW.
    hmr: { path: '/__vite_hmr' },
  },
  preview: { port: 4173, host: process.env.HOST ?? 'localhost' },
});
