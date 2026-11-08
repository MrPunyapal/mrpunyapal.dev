/**
 * Visual regression smoke test for the hybrid architectural-grid design.
 * Captures screenshots of the real Vite build, not the ZIP's standalone demo.
 * The Elephpant and theme switch are queried only, never modified.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173';
const routes = [
  ['home', '/index.html'],
  ['services', '/services.html'],
  ['projects', '/projects.html'],
  ['opensource', '/opensource.html'],
  ['resume', '/resume.html'],
  ['talks', '/talks.html'],
  ['blog', '/blog.html'],
  ['tips', '/tips.html'],
];
const resolutions = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const themes = ['light', 'dark'];
const screenshots = 'visual-qa';
const failures = [];
const report = [];
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function waitForServer() {
  for (let attempt = 0; attempt < 75; attempt++) {
    try {
      const response = await fetch(base + '/index.html');
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Vite preview server did not start');
}

async function main() {
  await mkdir(screenshots, { recursive: true });
  const server = spawn('node', [
    'node_modules/vite/bin/vite.js',
    'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort',
  ], { stdio: 'ignore' });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    for (const layout of resolutions) {
      for (const theme of themes) {
        const context = await browser.newContext({
          viewport: { width: layout.width, height: layout.height },
          deviceScaleFactor: 1,
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        await context.addInitScript(t => {
          localStorage.setItem('theme', t);
          document.documentElement.classList.toggle('dark', t === 'dark');
        }, theme);
        for (const [name, path] of routes) {
          const page = await context.newPage();
          const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
          await page.locator('main.portfolio-v2').waitFor({ timeout: 8000 });
          await page.evaluate(() => document.fonts.ready);
          const result = await page.evaluate(() => {
            const frame = document.querySelector('.portfolio-frame');
            const main = document.querySelector('main.portfolio-v2');
            const toggle = document.querySelector('[data-theme-toggle]');
            const frameColor = frame ? getComputedStyle(frame).backgroundColor : null;
            return {
              title: document.title,
              hasFrame: Boolean(frame),
              hasThemeToggle: Boolean(toggle),
              themeMatches: document.documentElement.classList.contains('dark')
                === (localStorage.getItem('theme') === 'dark'),
              hasOriginalDoor: Boolean(document.getElementById('door-container')),
              frameColor,
              horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
              tiles: main.querySelectorAll('.portfolio-tiles').length,
            };
          });
          if (!response?.ok() || !result.hasFrame || !result.hasThemeToggle || !result.themeMatches || result.horizontalOverflow || (name === 'home' && !result.hasOriginalDoor)) {
            failures.push({ name, layout: layout.name, theme, status: response?.status(), ...result });
          }
          await page.screenshot({
            path: screenshots + '/' + name + '-' + layout.name + '-' + theme + '.png',
            animations: 'disabled',
          });
          report.push({ name, layout: layout.name, theme, status: response.status(), ...result });
          await page.close();
        }
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
    await writeFile(screenshots + '/report.json', JSON.stringify({ report, failures }, null, 2));
  }
  console.log('Screenshots:', report.length, 'Failures:', failures.length);
  if (failures.length) {
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
