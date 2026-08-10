import fs from 'node:fs';
import path from 'node:path';

export function generateSitemap(tips, publicDir) {
    const staticPages = [
        'https://mrpunyapal.dev/',
        'https://mrpunyapal.dev/projects',
        'https://mrpunyapal.dev/opensource',
        'https://mrpunyapal.dev/tips',
        'https://mrpunyapal.dev/resume',
        'https://mrpunyapal.dev/talks',
    ];

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(url => `    <url>
        <loc>${url}</loc>
    </url>`).join('\n')}
${tips.map(tip => `    <url>
        <loc>https://mrpunyapal.dev/tips/${tip.slug}</loc>
        <lastmod>${tip.date}</lastmod>
    </url>`).join('\n')}
</urlset>
`;

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml.trim() + '\n', 'utf8');
}
