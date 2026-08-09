import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import fs from 'node:fs';
import { buildTips } from './scripts/build-tips.mjs';

function tipsAutoGeneratorPlugin() {
  return {
    name: 'vite-plugin-auto-generate-tips',
    async buildStart() {
      await buildTips();
    },
    async handleHotUpdate({ file, server }) {
      if (file.includes('content') && file.endsWith('.md')) {
        console.log(`📝 Tip Markdown file modified: ${file}`);
        await buildTips();
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

function getTipInputs() {
  const tipsDir = resolve(__dirname, 'tips');
  const inputs = {};
  if (fs.existsSync(tipsDir)) {
    const files = fs.readdirSync(tipsDir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const key = `tips/${file.replace(/\.html$/, '')}`;
      inputs[key] = resolve(tipsDir, file);
    }
  }
  return inputs;
}

export default defineConfig({
  plugins: [
    tipsAutoGeneratorPlugin(),
    tailwindcss(),
  ],
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
        tips: resolve(__dirname, 'tips.html'),
        ...getTipInputs(),
      },
    },
  },
});
