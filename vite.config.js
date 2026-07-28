import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [tailwindcss()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        resume: resolve(__dirname, 'resume.html'),
        talks: resolve(__dirname, 'talks.html'),
        projects: resolve(__dirname, 'projects.html'),
        opensource: resolve(__dirname, 'opensource.html'),
      },
    },
  },
});
