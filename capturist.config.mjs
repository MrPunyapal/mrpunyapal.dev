import { defineConfig } from "capturist";
import { getPendingPages } from "./scripts/og-pages.mjs";

const forceAll = process.argv.includes('--force') || process.env.FORCE_ALL_OG === 'true';
const pages = getPendingPages(forceAll);

export default defineConfig({
  cache: {
    path: "public/og/.capturist-cache.json",
    adopt: true,
    prune: false,
  },
  server: {
    dir: "./dist",
    buildCommand: "npm run build",
  },
  retina: true,
  outputDir: "public",
  pages: pages.length > 0 ? pages : [{ route: "/", output: "og/master.png" }],
});
