import { defineConfig } from "capturist";
import fs from "node:fs";
import path from "node:path";

function getTipPages() {
  const tipsDir = path.resolve("./tips");
  const tipPages = [];
  if (fs.existsSync(tipsDir)) {
    const files = fs.readdirSync(tipsDir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const slug = file.replace(/\.html$/, '');
      tipPages.push({
        route: `/tips/${slug}`,
        output: `og/tips/${slug}.png`,
      });
    }
  }
  return tipPages;
}

export default defineConfig({
  // Built-in static server automatically builds and serves the compiled production assets with full Tailwind CSS & themes
  cache: {
    path: "public/og/.capturist-cache.json",
    adopt: true,
    prune: true,
  },
  server: {
    dir: "./dist",
    buildCommand: "npm run build",
  },

  // 2x Retina high-resolution presets with font smoothing
  retina: true,

  // Save generated screenshots directly to the public/ directory
  outputDir: "public",

  // Page targets matching the website structure
  pages: [
    {
      route: "/",
      output: "og/master.png",
    },
    {
      route: "/services",
      output: "og/services.png",
    },
    {
      route: "/projects",
      output: "og/projects.png",
    },
    {
      route: "/talks",
      output: "og/talks.png",
    },
    {
      route: "/opensource",
      output: "og/opensource.png",
    },
    {
      route: "/resume",
      output: "og/resume.png",
    },
    {
      route: "/tips",
      output: "og/tips.png",
    },
    ...getTipPages(),
  ],
});

