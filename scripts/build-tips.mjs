import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

import { slugify, extractSummary, marked, renderRssHtml, getTipEffectiveDate, normalizeDateStr } from './tips/tips-helpers.mjs';
import { generateTipsHubPage } from './tips/tips-hub.mjs';
import { generateSingleTipPage } from './tips/tips-single.mjs';
import { generateRssFeed } from './tips/tips-rss.mjs';
import { generateSitemap } from './tips/tips-sitemap.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tipsContentDir = fs.existsSync(path.resolve(rootDir, 'content', 'tips', 'content'))
    ? path.resolve(rootDir, 'content', 'tips', 'content')
    : path.resolve(rootDir, 'content', 'tips');
const tipsOutDir = path.resolve(rootDir, 'tips');
const publicDir = path.resolve(rootDir, 'public');

// Main Build Function
export async function buildTips() {
    console.log('🔨 Starting Tips build...');

    if (!fs.existsSync(tipsContentDir)) {
        console.error(`❌ Tips content directory not found: ${tipsContentDir}`);
        return;
    }

    if (!fs.existsSync(tipsOutDir)) {
        fs.mkdirSync(tipsOutDir, { recursive: true });
    }

    function getTipFilesRecursively(dir) {
        let results = [];
        if (!fs.existsSync(dir)) return results;
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory()) {
                results = results.concat(getTipFilesRecursively(fullPath));
            } else if (file.endsWith('.md') && file.toLowerCase() !== 'readme.md') {
                results.push(fullPath);
            }
        });
        return results;
    }

    const files = getTipFilesRecursively(tipsContentDir);
    console.log(`📖 Found ${files.length} tip markdown files.`);

    const tips = [];

    for (const filePath of files) {
        const file = path.basename(filePath);
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(rawContent);

        // Derive title: from frontmatter OR from the first markdown heading # Title
        let title = data.title;
        let cleanBody = content;
        if (!title) {
            const h1Match = content.match(/^#\s+(.+)$/m);
            if (h1Match) {
                title = h1Match[1].trim();
                cleanBody = content.replace(/^#\s+.+$/m, '').trim();
            } else {
                title = file.replace(/\.md$/, '').replace(/-/g, ' ');
            }
        }

        // Derive slug: from frontmatter OR file basename
        const slug = data.slug || file.replace(/\.md$/, '') || slugify(title);

        // Derive summary: from frontmatter OR automatically extract first 160 characters
        const summary = extractSummary(cleanBody, data.summary);

        const category = data.category || 'Laravel';
        const subcategory = data.subcategory || null;
        const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(',').map(s => s.trim()) : [category]);
        const created_at = normalizeDateStr(data.created_at || data.date) || '2026-07-01';
        const updated_at = normalizeDateStr(data.updated_at || data.updated || data.last_updated) || null;
        const effectiveDate = getTipEffectiveDate({ created_at, updated_at });
        const tweet_url = data.tweet_url || null;
        const author = data.author || 'Punyapal Shah';
        const author_url = data.author_url || (author === 'Punyapal Shah' ? 'https://x.com/MrPunyapal' : null);
        const og_image = data.og_image || data.image || `https://mrpunyapal.dev/og/tips/${slug}.png`;

        const htmlContent = marked.parse(cleanBody);
        const rssContent = renderRssHtml(cleanBody);

        tips.push({
            slug,
            title,
            category,
            subcategory,
            tags,
            created_at,
            updated_at,
            effectiveDate,
            date: effectiveDate,
            summary,
            tweet_url,
            author,
            author_url,
            og_image,
            rawMarkdown: cleanBody,
            htmlContent,
            rssContent,
        });
    }

    // Sort by effective date descending (updated_at ?? created_at)
    tips.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    // Generate categories list with counts
    const categoriesMap = { 'All': tips.length };
    tips.forEach(tip => {
        categoriesMap[tip.category] = (categoriesMap[tip.category] || 0) + 1;
    });

    const categoryList = Object.keys(categoriesMap);

    // 1. Generate tips.html (Hub archive)
    generateTipsHubPage(tips, categoryList, categoriesMap, rootDir);

    // 2. Generate individual tip pages in tips/${slug}.html
    for (const tip of tips) {
        generateSingleTipPage(tip, tips, tipsOutDir);
    }

    // 3. Generate public search index
    const searchIndex = tips.map(t => {
        const item = {
            slug: t.slug,
            title: t.title,
            category: t.category,
            subcategory: t.subcategory,
            tags: t.tags,
            created_at: t.created_at,
            effective_date: t.effectiveDate,
            date: t.effectiveDate,
            summary: t.summary,
            author: t.author,
            author_url: t.author_url,
        };
        if (t.updated_at) {
            item.updated_at = t.updated_at;
        }
        return item;
    });
    fs.writeFileSync(path.join(publicDir, 'tips-search-index.json'), JSON.stringify(searchIndex, null, 2));

    // 4. Automatically generate/synchronize public/sitemap.xml
    generateSitemap(tips, publicDir);

    // 5. Generate RSS 2.0 Feed at public/tips/feed.xml
    generateRssFeed(tips, publicDir);

    console.log(`✅ Tips build complete: generated tips.html, ${tips.length} individual pages, search index, RSS feed (public/tips/feed.xml), and sitemap.xml.`);
}

// Run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    buildTips();
}
