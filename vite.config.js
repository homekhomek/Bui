import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import adminSave from './vite-admin-save.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), adminSave()],
  // Dev server only: poll for file changes instead of relying on OS events,
  // which on Windows can miss a file saved twice in quick succession (Vite
  // then serves the stale copy until the file changes again).
  server: {
    watch: { usePolling: true, interval: 100 },
  },
});
