import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import fs from 'node:fs';
import { renderSiteHeader } from './scripts/site-header.mjs';
import { tipsRedirectPlugin } from './scripts/vite-plugin-tips-redirects.mjs';

function siteComponentsPlugin() {
  return {
    name: 'vite-plugin-site-components',
    transformIndexHtml(html) {
      return html.replace(/<site-header(?:\s+active="([^"]*)")?\s*(?:\/>|><\/site-header>)/gi, (match, active) => {
        return renderSiteHeader(active || 'home');
      });
    },
  };
}

function getLaravelblrInputs() {
  const laravelblrDir = resolve(__dirname, 'laravelblr');
  const inputs = {};
  if (fs.existsSync(laravelblrDir)) {
    const files = fs.readdirSync(laravelblrDir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const key = `laravelblr/${file.replace(/\.html$/, '')}`;
      inputs[key] = resolve(laravelblrDir, file);
    }
  }
  return inputs;
}

export default defineConfig({
  plugins: [
    siteComponentsPlugin(),
    tailwindcss(),
    tipsRedirectPlugin(),
  ],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        services: resolve(__dirname, 'services.html'),
        resume: resolve(__dirname, 'resume.html'),
        talks: resolve(__dirname, 'talks.html'),
        projects: resolve(__dirname, 'projects.html'),
        opensource: resolve(__dirname, 'opensource.html'),
        ...getLaravelblrInputs(),
      },
    },
  },
});
