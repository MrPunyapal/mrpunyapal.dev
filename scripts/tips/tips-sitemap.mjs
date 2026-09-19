import path from 'node:path';
import { getTipEffectiveDate, writeFileIfChanged } from './tips-helpers.mjs';

/**
 * Generate XML Sitemap for the personal website and all tips
 * Output: public/sitemap.xml
 */
export function generateSitemap(tips, rootDir) {
    const sitemapOutPath = path.resolve(rootDir, 'public', 'sitemap.xml');

    const corePages = [
        { loc: 'https://mrpunyapal.dev/', changefreq: 'weekly', priority: '1.0' },
        { loc: 'https://mrpunyapal.dev/services', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/projects', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/opensource', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/tips', changefreq: 'weekly', priority: '0.9' },
        { loc: 'https://mrpunyapal.dev/resume', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/talks', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/laravelblr', changefreq: 'weekly', priority: '0.8' },
    ];

    const coreUrlsXml = corePages.map(page => `    <url>
        <loc>${page.loc}</loc>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('\n');

    const tipsUrlsXml = tips.map(tip => {
        const effectiveDate = getTipEffectiveDate(tip);
        const lastmodXml = effectiveDate ? `\n        <lastmod>${effectiveDate}</lastmod>` : '';
        return `    <url>
        <loc>https://mrpunyapal.dev/tips/${tip.slug}</loc>${lastmodXml}
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
    }).join('\n');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${coreUrlsXml}
${tipsUrlsXml}
</urlset>
`;

    writeFileIfChanged(sitemapOutPath, sitemapXml);
}
