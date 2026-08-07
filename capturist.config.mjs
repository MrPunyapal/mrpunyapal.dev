import { defineConfig } from "capturist";

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
  ],
});
