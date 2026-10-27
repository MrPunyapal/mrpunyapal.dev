import fs from 'node:fs';
import path from 'node:path';
import { getTipEffectiveDate, writeFileIfChanged } from '../content-helpers.mjs';

/**
 * Generate XML Sitemap including core pages, blog articles, and tips
 * Output: public/sitemap.xml
 */
export function generateBlogSitemap(posts, rootDir) {
    const sitemapOutPath = path.resolve(rootDir, 'public', 'sitemap.xml');
    const tipsIndexPath = path.resolve(rootDir, 'public', 'tips-search-index.json');

    const corePages = [
        { loc: 'https://mrpunyapal.dev/', changefreq: 'weekly', priority: '1.0' },
        { loc: 'https://mrpunyapal.dev/services', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/projects', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/opensource', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/blog', changefreq: 'weekly', priority: '0.9' },
        { loc: 'https://mrpunyapal.dev/tips', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/resume', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/talks', changefreq: 'weekly', priority: '0.8' },
        { loc: 'https://mrpunyapal.dev/laravelblr', changefreq: 'weekly', priority: '0.8' },
    ];

    const coreUrlsXml = corePages.map(page => `    <url>
        <loc>${page.loc}</loc>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('\n');

    const blogUrlsXml = posts.map(post => {
        const effectiveDate = getTipEffectiveDate(post);
        const lastmodXml = effectiveDate ? `\n        <lastmod>${effectiveDate}</lastmod>` : '';
        return `    <url>
        <loc>https://mrpunyapal.dev/blog/${post.slug}</loc>${lastmodXml}
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
    }).join('\n');

    // Also include tips if search index is present
    let tipsUrlsXml = '';
    if (fs.existsSync(tipsIndexPath)) {
        try {
            const tips = JSON.parse(fs.readFileSync(tipsIndexPath, 'utf-8'));
            tipsUrlsXml = tips.map(tip => {
                const lastmodXml = tip.date ? `\n        <lastmod>${tip.date}</lastmod>` : '';
                return `    <url>
        <loc>https://mrpunyapal.dev/tips/${tip.slug}</loc>${lastmodXml}
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
            }).join('\n');
        } catch (e) {
            console.warn('Could not parse tips index for sitemap generation:', e);
        }
    }

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${coreUrlsXml}
${blogUrlsXml}${tipsUrlsXml ? '\n' + tipsUrlsXml : ''}
</urlset>
`;

    writeFileIfChanged(sitemapOutPath, sitemapXml);
}
