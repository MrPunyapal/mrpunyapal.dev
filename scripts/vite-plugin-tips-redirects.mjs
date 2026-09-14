import fs from 'node:fs';
import path from 'node:path';

const DOCSMITH_BASE = 'https://mrpunyapal.github.io/tips';

export function tipsRedirectPlugin() {
  const mapPath = path.resolve('scripts', 'tips-redirect-map.json');
  let redirectMap = {};
  if (fs.existsSync(mapPath)) {
    redirectMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  }

  return {
    name: 'vite-plugin-tips-redirects',

    // In dev server, intercept /tips and /tips/:slug and send 301 redirects
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        if (url === '/tips' || url === '/tips/') {
          res.writeHead(301, { Location: `${DOCSMITH_BASE}/` });
          return res.end();
        }

        const match = url.match(/^\/tips\/([^/]+?)(?:\.html)?\/?$/);
        if (match) {
          const slug = match[1];
          const targetPath = redirectMap[slug];
          const targetUrl = targetPath
            ? `${DOCSMITH_BASE}/${targetPath}/`
            : `${DOCSMITH_BASE}/`;
          res.writeHead(301, { Location: targetUrl });
          return res.end();
        }

        next();
      });
    },

    // In build, generate Cloudflare Pages _redirects file without emitting any HTML files
    generateBundle() {
      const redirectRules = [
        `/tips  ${DOCSMITH_BASE}/  301`,
        `/tips/  ${DOCSMITH_BASE}/  301`,
      ];

      for (const [slug, targetPath] of Object.entries(redirectMap)) {
        const targetUrl = `${DOCSMITH_BASE}/${targetPath}/`;
        redirectRules.push(`/tips/${slug}  ${targetUrl}  301`);
        redirectRules.push(`/tips/${slug}/  ${targetUrl}  301`);
      }

      // Catch-all for any other tips paths
      redirectRules.push(`/tips/*  ${DOCSMITH_BASE}/  301`);

      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: redirectRules.join('\n') + '\n',
      });
    },
  };
}
