import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // L'editor di testo dei piani alimentari è un blocco a sé (~460 kB) caricato solo quando serve.
  build: { chunkSizeWarningLimit: 600 },
  server: {
    port: 5173,
    // In locale le chiamate /api vengono girate al server Express (porta 5000).
    proxy: { '/api': 'http://localhost:5000' },
  },
});
