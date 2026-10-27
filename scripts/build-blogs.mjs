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
} from './content-helpers.mjs';

import { generateBlogHubPage } from './blogs/blog-hub.mjs';
import { generateSingleBlogPage } from './blogs/blog-single.mjs';
import { generateBlogRssFeed } from './blogs/blog-rss.mjs';
import { generateBlogSitemap } from './blogs/blog-sitemap.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const blogsContentDir = path.resolve(rootDir, 'content', 'blogs');
const blogsOutDir = path.resolve(rootDir, 'blog');
const publicDir = path.resolve(rootDir, 'public');

/**
 * Scan directory recursively for all markdown blog files
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
            if (entry.name.toLowerCase() === 'readme.md') continue;
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Clean up stale generated blog HTML pages
 */
function cleanupStaleBlogPages(validSlugs) {
    if (!fs.existsSync(blogsOutDir)) return;

    const files = fs.readdirSync(blogsOutDir);
    let deletedCount = 0;
    for (const file of files) {
        if (!file.endsWith('.html') || file === 'index.html') continue;
        const slug = file.replace(/\.html$/, '');
        if (!validSlugs.has(slug)) {
            fs.unlinkSync(path.join(blogsOutDir, file));
            deletedCount++;
        }
    }
    if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} stale blog HTML files.`);
    }
}

/**
 * Master build function for Blog section
 */
export async function buildBlogs() {
    console.log('Starting Blog build...');

    if (!fs.existsSync(blogsContentDir)) {
        console.error(`Blog content directory not found: ${blogsContentDir}`);
        return;
    }

    if (!fs.existsSync(blogsOutDir)) {
        fs.mkdirSync(blogsOutDir, { recursive: true });
    }

    const blogFeedDir = path.resolve(publicDir, 'blog');
    if (!fs.existsSync(blogFeedDir)) {
        fs.mkdirSync(blogFeedDir, { recursive: true });
    }

    const markdownFiles = scanMarkdownFiles(blogsContentDir);
    console.log(`Found ${markdownFiles.length} blog markdown files in ${blogsContentDir}`);

    const posts = [];
    const categoriesMap = { All: 0 };
    const subcategoriesMap = {};

    for (const filePath of markdownFiles) {
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(rawContent);

        const fileSlug = path.basename(filePath, '.md');
        const relPath = path.relative(blogsContentDir, filePath).replace(/\\/g, '/');
        const parts = relPath.split('/');

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

        // Extract summary: from frontmatter or leading blockquote
        let summary = data.summary;
        const leadingQuoteMatch = cleanBody.match(/^\s*>([\s\S]*?)(?:\n\s*\n|$)/);
        if (leadingQuoteMatch) {
            if (!summary) {
                const quoteText = leadingQuoteMatch[1]
                    .split('\n')
                    .map(line => line.replace(/^\s*>\s?/, '').trim())
                    .join(' ')
                    .trim();
                summary = quoteText
                    .replace(/`/g, '')
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                    .replace(/\*\*([^*]+)\*\*/g, '$1')
                    .replace(/\*([^*]+)\*/g, '$1')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
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

        // Tags resolution
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

        posts.push({
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

    // Sort posts by effective date descending
    posts.sort((a, b) => {
        const dateA = new Date(getTipEffectiveDate(a));
        const dateB = new Date(getTipEffectiveDate(b));
        return dateB - dateA;
    });

    // Populate category & subcategory aggregation maps
    categoriesMap.All = posts.length;
    for (const post of posts) {
        categoriesMap[post.category] = (categoriesMap[post.category] || 0) + 1;

        if (post.subcategory) {
            if (!subcategoriesMap[post.subcategory]) {
                subcategoriesMap[post.subcategory] = {
                    count: 0,
                    categories: new Set()
                };
            }
            subcategoriesMap[post.subcategory].count++;
            subcategoriesMap[post.subcategory].categories.add(post.category);
        }
    }

    console.log(`Processed ${posts.length} blog posts across ${Object.keys(categoriesMap).length - 1} categories.`);

    // 1. Generate Blog Hub Listing Page (blog.html & blog/index.html)
    console.log('Generating Blog Hub (blog.html)...');
    generateBlogHubPage(posts, categoriesMap, subcategoriesMap, rootDir);

    // 2. Generate Individual Blog Pages (blog/<slug>.html)
    console.log('Generating Individual Blog Pages (blog/<slug>.html)...');
    for (const post of posts) {
        generateSingleBlogPage(post, posts, rootDir);
    }

    // Clean up any deleted/stale blog pages
    const validSlugs = new Set(posts.map(p => p.slug));
    cleanupStaleBlogPages(validSlugs);

    // 3. Generate Search Index (public/blog-search-index.json)
    console.log('Generating Blog Search Index (public/blog-search-index.json)...');
    const searchIndex = posts.map(post => ({
        slug: post.slug,
        title: post.title,
        category: post.category,
        subcategory: post.subcategory,
        summary: post.summary,
        tags: post.tags,
        date: getTipEffectiveDate(post),
        readingTime: post.readingTime
    }));
    const searchIndexJson = JSON.stringify(searchIndex, null, 2);
    writeFileIfChanged(path.resolve(publicDir, 'blog-search-index.json'), searchIndexJson);

    // 4. Generate RSS 2.0 Feed (public/blog/feed.xml)
    console.log('Generating Blog RSS Feed (public/blog/feed.xml)...');
    generateBlogRssFeed(posts, rootDir);

    // 5. Generate XML Sitemap (public/sitemap.xml)
    console.log('Generating XML Sitemap (public/sitemap.xml)...');
    generateBlogSitemap(posts, rootDir);

    console.log('Blog build completed successfully!');
}

// Execute directly if run via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    buildBlogs().catch(err => {
        console.error('Error building blog:', err);
        process.exit(1);
    });
}
