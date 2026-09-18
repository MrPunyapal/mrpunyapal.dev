import { chromium } from 'playwright';
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pages = [
  { name: '01-home', path: '/' },
  { name: '02-services', path: '/services' },
  { name: '03-projects', path: '/projects' },
  { name: '04-opensource', path: '/opensource' },
  { name: '05-talks', path: '/talks' },
  { name: '06-resume', path: '/resume' },
  { name: '07-laravelblr', path: '/laravelblr/' },
];

const viewports = [
  {
    type: 'desktop',
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
  },
  {
    type: 'mobile',
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  }
];

async function capture() {
  console.log('Starting preview server on dist/...');
  const server = await preview({
    root: rootDir,
    preview: {
      port: 4173,
      host: '127.0.0.1',
    }
  });

  const baseUrl = 'http://127.0.0.1:4173';
  console.log(`Preview server ready at ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });

  try {
    for (const vp of viewports) {
      const outDir = path.resolve(rootDir, 'screenshots', vp.type);
      fs.mkdirSync(outDir, { recursive: true });

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: vp.isMobile || false,
        hasTouch: vp.hasTouch || false,
      });

      const page = await context.newPage();

      for (const item of pages) {
        const targetUrl = `${baseUrl}${item.path}`;
        console.log(`[${vp.type.toUpperCase()}] Capturing ${item.name} (${targetUrl})...`);
        try {
          await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });
          await page.evaluate(async () => {
            if (document.fonts && document.fonts.ready) {
              await document.fonts.ready;
            }
          });
          await page.waitForTimeout(600);

          const outPath = path.join(outDir, `${item.name}.png`);
          await page.screenshot({ path: outPath, fullPage: true });
          console.log(`  -> Saved: ${path.relative(rootDir, outPath)}`);
        } catch (err) {
          console.error(`  -> Failed to capture ${item.name}:`, err.message);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
    server.httpServer.close();
    console.log('\nPreview server closed. All screenshots captured successfully!');
  }
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
