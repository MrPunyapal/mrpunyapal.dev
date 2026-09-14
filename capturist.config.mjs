import { defineConfig } from "capturist";
import fs from "node:fs";
import path from "node:path";

const forceAll = process.argv.includes('--force') || process.env.FORCE_ALL_OG === 'true';

function getMainPages() {
  const mainRoutes = [
    { route: "/", output: "og/master.png", source: "index.html" },
    { route: "/services", output: "og/services.png", source: "services.html" },
    { route: "/projects", output: "og/projects.png", source: "projects.html" },
    { route: "/talks", output: "og/talks.png", source: "talks.html" },
    { route: "/opensource", output: "og/opensource.png", source: "opensource.html" },
    { route: "/resume", output: "og/resume.png", source: "resume.html" },
    { route: "/laravelblr", output: "og/laravelblr.png", source: "laravelblr/index.html" },
  ];

  if (forceAll) {
    return mainRoutes.map(({ route, output }) => ({ route, output }));
  }

  return mainRoutes
    .filter(({ output, source }) => {
      const outPath = path.resolve(`./public/${output}`);
      if (!fs.existsSync(outPath)) return true;
      if (!process.env.CI) {
        const srcPath = path.resolve(`./${source}`);
        if (fs.existsSync(srcPath)) {
          const srcStat = fs.statSync(srcPath);
          const outStat = fs.statSync(outPath);
          return srcStat.mtimeMs > outStat.mtimeMs;
        }
      }
      return false;
    })
    .map(({ route, output }) => ({ route, output }));
}

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
  pages: [
    ...getMainPages(),
  ],
});
