import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPendingPages } from './og-pages.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isForce = process.argv.includes('--force') || process.env.FORCE_ALL_OG === 'true';

const pendingPages = getPendingPages(isForce);

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
