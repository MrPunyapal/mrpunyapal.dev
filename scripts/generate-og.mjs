import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isForce = process.argv.includes('--force');

function getMarkdownSourceMap() {
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

function getPendingPages() {
  const pending = [];

  const mainPages = [
    { route: '/', output: 'og/master.png', source: 'index.html' },
    { route: '/services', output: 'og/services.png', source: 'services.html' },
    { route: '/projects', output: 'og/projects.png', source: 'projects.html' },
    { route: '/talks', output: 'og/talks.png', source: 'talks.html' },
    { route: '/opensource', output: 'og/opensource.png', source: 'opensource.html' },
    { route: '/resume', output: 'og/resume.png', source: 'resume.html' },
    { route: '/tips', output: 'og/tips.png', source: 'tips.html' },
  ];

  for (const page of mainPages) {
    const outPath = path.resolve(rootDir, 'public', page.output);
    const srcPath = path.resolve(rootDir, page.source);

    if (isForce || !fs.existsSync(outPath)) {
      pending.push(page);
    } else if (fs.existsSync(srcPath)) {
      const srcStat = fs.statSync(srcPath);
      const outStat = fs.statSync(outPath);
      if (srcStat.mtimeMs > outStat.mtimeMs) {
        pending.push(page);
      }
    }
  }

  const tipsDir = path.resolve(rootDir, 'tips');
  const mdMap = getMarkdownSourceMap();

  if (fs.existsSync(tipsDir)) {
    const files = fs.readdirSync(tipsDir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const slug = file.replace(/\.html$/, '');
      const outPath = path.resolve(rootDir, 'public', 'og', 'tips', `${slug}.png`);
      const mdSourcePath = mdMap.get(slug);

      if (isForce || !fs.existsSync(outPath)) {
        pending.push({ route: `/tips/${slug}`, output: `og/tips/${slug}.png` });
      } else if (mdSourcePath && fs.existsSync(mdSourcePath)) {
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

const pendingPages = getPendingPages();

if (!isForce && pendingPages.length === 0) {
  console.log('🖼️ All OG images are already up to date. Skipping screenshot generation.');
  process.exit(0);
}

console.log(`📸 Generating ${pendingPages.length} OG screenshot(s)${isForce ? ' (forced)' : ''}...`);

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = isForce ? ['capturist', '--force'] : ['capturist'];

const child = spawn(npxCmd, args, {
  stdio: 'inherit',
  cwd: rootDir,
  shell: true,
});

child.on('exit', (code) => {
  if (code === 0) {
    const now = new Date();
    for (const p of pendingPages) {
      const outPath = path.resolve(rootDir, 'public', p.output);
      if (fs.existsSync(outPath)) {
        try {
          fs.utimesSync(outPath, now, now);
        } catch {
          // Ignore timestamp touch errors
        }
      }
    }
  }
  process.exit(code ?? 0);
});
