import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In locale le chiamate /api vengono girate al server Express (porta 5000).
    proxy: { '/api': 'http://localhost:5000' },
  },
});
