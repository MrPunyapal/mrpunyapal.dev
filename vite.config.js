import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import fs from 'node:fs';
import { buildTips } from './scripts/build-tips.mjs';
import { renderSiteHeader } from './scripts/site-header.mjs';

function siteComponentsPlugin() {
  return {
    name: 'vite-plugin-site-components',
    transformIndexHtml(html) {
      // Replaces <site-header active="xxx"></site-header> or <site-header active="xxx"/> or <site-header></site-header>
      return html.replace(/<site-header(?:\s+active="([^"]*)")?\s*(?:\/>|><\/site-header>)/gi, (match, active) => {
        return renderSiteHeader(active || 'home');
      });
    },
  };
}

function tipsAutoGeneratorPlugin() {
  return {
    name: 'vite-plugin-auto-generate-tips',
    async buildStart() {
      await buildTips();
    },
    async handleHotUpdate({ file, server }) {
      if ((file.includes('content') && file.endsWith('.md')) || file.endsWith('site-header.mjs')) {
        console.log(`📝 File modified: ${file}`);
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
    siteComponentsPlugin(),
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
