import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import adminSave from './vite-admin-save.js';

export default defineConfig({
  plugins: [react(), tailwindcss(), adminSave()],
});
