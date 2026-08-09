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
        output: `tips/${slug}-og.png`,
      });
    }
  }
  return tipPages;
}

export default defineConfig({
  // Built-in static server automatically builds and serves the compiled production assets with full Tailwind CSS & themes
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
      output: "master-og-image.png",
    },
    {
      route: "/projects",
      output: "projects-og-image.png",
    },
    {
      route: "/talks",
      output: "talks-og-image.png",
    },
    {
      route: "/opensource",
      output: "opensource-og-image.png",
    },
    {
      route: "/resume",
      output: "resume-og-image.png",
    },
    {
      route: "/tips",
      output: "tips-og-image.png",
    },
    ...getTipPages(),
  ],
});

