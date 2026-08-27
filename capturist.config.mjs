import { defineConfig } from "capturist";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const forceAll = process.argv.includes('--force') || process.env.FORCE_ALL_OG === 'true';

function getMarkdownSourceMap() {
  const tipsContentDir = path.resolve('./content/tips');
  const map = new Map();

  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('.md') && file.toLowerCase() !== 'readme.md') {
        const slug = file.replace(/\.md$/, '');
        map.set(slug, fullPath);
      }
    }
  }

  scan(tipsContentDir);
  return map;
}

function getChangedTipsFromGit() {
  const changed = new Set();
  try {
    const status = execSync('git -C content/tips status --porcelain', { encoding: 'utf-8' });
    for (const line of status.split('\n')) {
      const match = line.trim().match(/^[AMDRCU?]{1,2}\s+(.+)$/);
      if (match && match[1].endsWith('.md')) {
        changed.add(path.basename(match[1], '.md'));
      }
    }
  } catch {}

  try {
    const diff = execSync('git -C content/tips diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' });
    for (const line of diff.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.endsWith('.md')) {
        changed.add(path.basename(trimmed, '.md'));
      }
    }
  } catch {}

  return changed;
}

function getMainPages() {
  const mainRoutes = [
    { route: "/", output: "og/master.png", source: "index.html" },
    { route: "/services", output: "og/services.png", source: "services.html" },
    { route: "/projects", output: "og/projects.png", source: "projects.html" },
    { route: "/talks", output: "og/talks.png", source: "talks.html" },
    { route: "/opensource", output: "og/opensource.png", source: "opensource.html" },
    { route: "/resume", output: "og/resume.png", source: "resume.html" },
    { route: "/tips", output: "og/tips.png", source: "tips.html" },
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

function getTipPages() {
  const tipsDir = path.resolve("./tips");
  const tipPages = [];
  const mdMap = getMarkdownSourceMap();
  const changedTips = getChangedTipsFromGit();

  if (fs.existsSync(tipsDir)) {
    const files = fs.readdirSync(tipsDir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const slug = file.replace(/\.html$/, '');
      const outPath = path.resolve(`./public/og/tips/${slug}.png`);
      const mdSourcePath = mdMap.get(slug);

      if (forceAll || !fs.existsSync(outPath) || changedTips.has(slug)) {
        tipPages.push({
          route: `/tips/${slug}`,
          output: `og/tips/${slug}.png`,
        });
      } else if (!process.env.CI && mdSourcePath && fs.existsSync(mdSourcePath)) {
        const mdStat = fs.statSync(mdSourcePath);
        const outStat = fs.statSync(outPath);
        if (mdStat.mtimeMs > outStat.mtimeMs) {
          tipPages.push({
            route: `/tips/${slug}`,
            output: `og/tips/${slug}.png`,
          });
        }
      }
    }
  }
  return tipPages;
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
    ...getTipPages(),
  ],
});
