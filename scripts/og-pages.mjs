import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function getMarkdownSourceMap() {
  const tipsContentDir = path.resolve(rootDir, 'content', 'tips');
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

export function getChangedTipsFromGit() {
  const changed = new Set();

  // 1. Check submodule status
  try {
    const status = execSync('git -C content/tips status --porcelain', {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      cwd: rootDir,
    });
    for (const line of status.split('\n')) {
      const match = line.trim().match(/^[AMDRCU?]{1,2}\s+(.+)$/);
      if (match && match[1].endsWith('.md')) {
        changed.add(path.basename(match[1], '.md'));
      }
    }
  } catch {}

  // 2. Check submodule diff
  try {
    const diff = execSync('git -C content/tips diff --name-only HEAD~1 HEAD', {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      cwd: rootDir,
    });
    for (const line of diff.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.endsWith('.md')) {
        changed.add(path.basename(trimmed, '.md'));
      }
    }
  } catch {}

  // 3. Check parent repo diff for tips/ HTML files or submodule commit changes
  try {
    const diffParent = execSync('git diff --name-only HEAD~1 HEAD -- tips/ content/tips', {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      cwd: rootDir,
    });
    for (const line of diffParent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('tips/') && trimmed.endsWith('.html') && !trimmed.endsWith('index.html')) {
        changed.add(path.basename(trimmed, '.html'));
      }
    }
  } catch {}

  return changed;
}

export function getPendingPages(isForce = false) {
  const pending = [];
  const changedTips = getChangedTipsFromGit();

  const mainPages = [
    { route: '/', output: 'og/master.png', source: 'index.html' },
    { route: '/services', output: 'og/services.png', source: 'services.html' },
    { route: '/projects', output: 'og/projects.png', source: 'projects.html' },
    { route: '/talks', output: 'og/talks.png', source: 'talks.html' },
    { route: '/opensource', output: 'og/opensource.png', source: 'opensource.html' },
    { route: '/resume', output: 'og/resume.png', source: 'resume.html' },
    { route: '/tips', output: 'og/tips.png', source: 'tips.html' },
    { route: '/laravelblr', output: 'og/laravelblr.png', source: 'laravelblr/index.html' },
  ];

  for (const page of mainPages) {
    const outPath = path.resolve(rootDir, 'public', page.output);
    const srcPath = path.resolve(rootDir, page.source);

    if (isForce || !fs.existsSync(outPath)) {
      pending.push({ route: page.route, output: page.output });
    } else if (!process.env.CI && fs.existsSync(srcPath)) {
      const srcStat = fs.statSync(srcPath);
      const outStat = fs.statSync(outPath);
      if (srcStat.mtimeMs > outStat.mtimeMs) {
        pending.push({ route: page.route, output: page.output });
      }
    } else if (process.env.CI && fs.existsSync(srcPath)) {
      try {
        const diff = execSync(`git diff --name-only HEAD~1 HEAD -- ${page.source}`, {
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf-8',
          cwd: rootDir,
        }).trim();
        if (diff.length > 0) {
          pending.push({ route: page.route, output: page.output });
        }
      } catch {}
    }
  }

  const tipsDir = path.resolve(rootDir, 'tips');
  const mdMap = getMarkdownSourceMap();

  if (fs.existsSync(tipsDir)) {
    const files = fs.readdirSync(tipsDir).filter(f => f.endsWith('.html') && f !== 'index.html');
    for (const file of files) {
      const slug = file.replace(/\.html$/, '');
      const outPath = path.resolve(rootDir, 'public', 'og', 'tips', `${slug}.png`);
      const mdSourcePath = mdMap.get(slug);

      if (isForce || !fs.existsSync(outPath) || changedTips.has(slug)) {
        pending.push({ route: `/tips/${slug}`, output: `og/tips/${slug}.png` });
      } else if (!process.env.CI && mdSourcePath && fs.existsSync(mdSourcePath)) {
        const mdStat = fs.statSync(mdSourcePath);
        const outStat = fs.statSync(outPath);
        if (mdStat.mtimeMs > outStat.mtimeMs) {
          pending.push({ route: `/tips/${slug}`, output: `og/tips/${slug}.png` });
        }
      }
    }
  }

  return pending;
}
