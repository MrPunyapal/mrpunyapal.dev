import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

import {
    estimateReadingTime,
    extractSummary,
    formatCategory,
    formatSubcategory,
    getTipEffectiveDate,
    normalizeDateStr,
    slugify,
    writeFileIfChanged
} from './tips/tips-helpers.mjs';

import { generateTipsHubPage } from './tips/tips-hub.mjs';
import { generateSingleTipPage } from './tips/tips-single.mjs';
import { generateTipsRssFeed } from './tips/tips-rss.mjs';
import { generateSitemap } from './tips/tips-sitemap.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tipsContentDir = fs.existsSync(path.resolve(rootDir, 'content', 'tips', 'content'))
    ? path.resolve(rootDir, 'content', 'tips', 'content')
    : path.resolve(rootDir, 'content', 'tips');

const tipsOutDir = path.resolve(rootDir, 'tips');
const publicDir = path.resolve(rootDir, 'public');

/**
 * Scan directory recursively for all markdown tip files
 */
function scanMarkdownFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(scanMarkdownFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            // Ignore top-level readme or documentation files
            if (entry.name.toLowerCase() === 'readme.md') continue;
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Clean up stale generated tip HTML files
 */
function cleanupStaleTipPages(validSlugs) {
    if (!fs.existsSync(tipsOutDir)) return;

    const files = fs.readdirSync(tipsOutDir);
    let deletedCount = 0;
    for (const file of files) {
        if (!file.endsWith('.html') || file === 'index.html') continue;
        const slug = file.replace(/\.html$/, '');
        if (!validSlugs.has(slug)) {
            fs.unlinkSync(path.join(tipsOutDir, file));
            deletedCount++;
        }
    }
    if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} stale tip HTML files.`);
    }
}

/**
 * Master build function for Laravel Tips platform
 */
export async function buildTips() {
    console.log('🔨 Starting Tips build...');

    if (!fs.existsSync(tipsContentDir)) {
        console.error(`❌ Tips content directory not found: ${tipsContentDir}`);
        return;
    }

    if (!fs.existsSync(tipsOutDir)) {
        fs.mkdirSync(tipsOutDir, { recursive: true });
    }

    const tipsFeedDir = path.resolve(publicDir, 'tips');
    if (!fs.existsSync(tipsFeedDir)) {
        fs.mkdirSync(tipsFeedDir, { recursive: true });
    }

    const markdownFiles = scanMarkdownFiles(tipsContentDir);
    console.log(`📖 Found ${markdownFiles.length} tip markdown files in ${tipsContentDir}`);

    const tips = [];
    const categoriesMap = { All: 0 };
    const subcategoriesMap = {};

    for (const filePath of markdownFiles) {
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(rawContent);

        const fileSlug = path.basename(filePath, '.md');
        const relPath = path.relative(path.resolve(rootDir, 'content', 'tips'), filePath).replace(/\\/g, '/');

        // Relative path directory parts for category fallback
        const relFromContent = path.relative(tipsContentDir, filePath).replace(/\\/g, '/');
        const parts = relFromContent.split('/');

        // Extract title: from frontmatter or first # Heading
        let title = data.title;
        let cleanBody = content;
        const h1Match = cleanBody.match(/^#\s+(.+)$/m);
        if (h1Match) {
            if (!title) title = h1Match[1].trim();
            cleanBody = cleanBody.replace(h1Match[0], '').trim();
        }
        if (!title) {
            title = fileSlug.replace(/-/g, ' ');
        }

        const slug = data.slug || fileSlug;

        // Extract summary: from frontmatter or first blockquote
        let summary = data.summary;
        const quoteMatch = cleanBody.match(/^>\s*(.+)$/m);
        if (quoteMatch) {
            if (!summary) summary = quoteMatch[1].replace(/[`*_[\]]/g, '').trim();
            cleanBody = cleanBody.replace(quoteMatch[0], '').trim();
        }
        if (!summary) {
            summary = extractSummary(cleanBody);
        }

        // Category resolution
        let category = data.category;
        if (!category && parts.length > 1) {
            category = parts[0];
        }
        category = formatCategory(category || 'Laravel');

        // Subcategory resolution
        let subcategory = data.subcategory;
        if (!subcategory && parts.length > 2) {
            subcategory = parts[1];
        }
        subcategory = formatSubcategory(subcategory);

        // Tags resolution (ensure no '#' prefix)
        let tags = [];
        if (Array.isArray(data.tags)) {
            tags = data.tags.map(t => String(t).replace(/^#/, '').trim()).filter(Boolean);
        } else if (typeof data.tags === 'string') {
            tags = data.tags.split(',').map(t => t.replace(/^#/, '').trim()).filter(Boolean);
        }
        if (tags.length === 0 && category) {
            tags.push(category);
        }

        // Date normalization
        const date = normalizeDateStr(data.date || data.created_at) || '2026-07-01';
        const created_at = normalizeDateStr(data.created_at || data.date) || date;
        const updated_at = normalizeDateStr(data.updated_at || data.updated || data.last_updated) || null;

        const readingTime = estimateReadingTime(cleanBody);
        const author = data.author || 'Punyapal Shah';
        const author_url = data.author_url || 'https://x.com/MrPunyapal';

        tips.push({
            slug,
            title,
            summary,
            body: cleanBody,
            category,
            subcategory,
            tags,
            date,
            created_at,
            updated_at,
            readingTime,
            author,
            author_url,
            relPath
        });
    }

    // Sort tips by effective date descending
    tips.sort((a, b) => {
        const dateA = new Date(getTipEffectiveDate(a));
        const dateB = new Date(getTipEffectiveDate(b));
        return dateB - dateA;
    });

    // Populate category & subcategory aggregation maps
    categoriesMap.All = tips.length;
    for (const tip of tips) {
        categoriesMap[tip.category] = (categoriesMap[tip.category] || 0) + 1;

        if (tip.subcategory) {
            if (!subcategoriesMap[tip.subcategory]) {
                subcategoriesMap[tip.subcategory] = {
                    count: 0,
                    categories: new Set()
                };
            }
            subcategoriesMap[tip.subcategory].count++;
            subcategoriesMap[tip.subcategory].categories.add(tip.category);
        }
    }

    console.log(`📊 Processed ${tips.length} tips across ${Object.keys(categoriesMap).length - 1} categories.`);

    // 1. Generate Tips Hub Listing Page (tips.html & tips/index.html)
    console.log('📄 Generating Tips Hub (tips.html)...');
    generateTipsHubPage(tips, categoriesMap, subcategoriesMap, rootDir);

    // 2. Generate Individual Tip Pages (tips/<slug>.html)
    console.log('📑 Generating Individual Tip Pages (tips/<slug>.html)...');
    for (const tip of tips) {
        generateSingleTipPage(tip, tips, rootDir);
    }

    // Clean up any deleted/stale tip pages
    const validSlugs = new Set(tips.map(t => t.slug));
    cleanupStaleTipPages(validSlugs);

    // 3. Generate Search Index (public/tips-search-index.json)
    console.log('🔍 Generating Tips Search Index (public/tips-search-index.json)...');
    const searchIndex = tips.map(tip => ({
        slug: tip.slug,
        title: tip.title,
        category: tip.category,
        subcategory: tip.subcategory,
        summary: tip.summary,
        tags: tip.tags,
        date: getTipEffectiveDate(tip),
        readingTime: tip.readingTime
    }));
    const searchIndexJson = JSON.stringify(searchIndex, null, 2);
    writeFileIfChanged(path.resolve(publicDir, 'tips-search-index.json'), searchIndexJson);

    // 4. Generate RSS 2.0 Feed (public/tips/feed.xml)
    console.log('📡 Generating Tips RSS Feed (public/tips/feed.xml)...');
    generateTipsRssFeed(tips, rootDir);

    // 5. Generate XML Sitemap (public/sitemap.xml)
    console.log('🗺️  Generating XML Sitemap (public/sitemap.xml)...');
    generateSitemap(tips, rootDir);

    console.log('✅ Tips build completed successfully!');
}

// Execute directly if run via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    buildTips().catch(err => {
        console.error('❌ Error building tips:', err);
        process.exit(1);
    });
}
