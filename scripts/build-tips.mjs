import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const tipsContentDir = fs.existsSync(path.resolve(rootDir, 'content', 'tips', 'content'))
    ? path.resolve(rootDir, 'content', 'tips', 'content')
    : path.resolve(rootDir, 'content', 'tips');
const tipsOutDir = path.resolve(rootDir, 'tips');
const publicDir = path.resolve(rootDir, 'public');

// Format date helper: "2026-07-20" -> "Jul 20, 2026" (UTC safe)
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).trim().split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts.map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.toLocaleDateString('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatRssDate(dateStr) {
    if (!dateStr) return new Date().toUTCString();
    const parts = String(dateStr).trim().split('-');
    if (parts.length !== 3) return new Date().toUTCString();
    const [y, m, d] = parts.map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return date.toUTCString();
}

// Slugify helper
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Extract plain text summary from markdown for SEO description
function extractSummary(markdownContent, manualSummary) {
    if (manualSummary && manualSummary.trim()) {
        return manualSummary.trim();
    }
    const cleanText = markdownContent
        .replace(/```[\s\S]*?```/g, '') // remove code blocks
        .replace(/^#+\s+.*/gm, '')       // remove headings
        .replace(/>\s*/g, '')            // remove blockquotes
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove links, keep text
        .replace(/[*_`]/g, '')           // remove formatting
        .replace(/\n+/g, ' ')
        .trim();

    if (cleanText.length <= 160) return cleanText;
    return cleanText.substring(0, 157).trim() + '...';
}

// Category color styling helper (WCAG AA compliant matching opensource.html & projects.html)
function getCategoryBadge(category) {
    switch (category) {
        case 'Laravel':
            return {
                bg: 'bg-red-50 dark:bg-red-950/50',
                text: 'text-red-700 dark:text-red-300',
                border: 'border-red-100 dark:border-red-900/60',
            };
        case 'Pest PHP':
        case 'Pest':
            return {
                bg: 'bg-purple-50 dark:bg-purple-950/50',
                text: 'text-purple-700 dark:text-purple-300',
                border: 'border-purple-100 dark:border-purple-900/60',
            };
        case 'PHP':
            return {
                bg: 'bg-indigo-50 dark:bg-indigo-950/50',
                text: 'text-indigo-700 dark:text-indigo-300',
                border: 'border-indigo-100 dark:border-indigo-900/60',
            };
        case 'JavaScript':
        case 'JS':
            return {
                bg: 'bg-amber-50 dark:bg-amber-950/50',
                text: 'text-amber-800 dark:text-amber-300',
                border: 'border-amber-100 dark:border-amber-900/60',
            };
        case 'TypeScript':
        case 'TS':
            return {
                bg: 'bg-blue-50 dark:bg-blue-950/50',
                text: 'text-blue-700 dark:text-blue-300',
                border: 'border-blue-100 dark:border-blue-900/60',
            };
        case 'Git':
        case 'DevOps':
            return {
                bg: 'bg-emerald-50 dark:bg-emerald-950/50',
                text: 'text-emerald-700 dark:text-emerald-300',
                border: 'border-emerald-100 dark:border-emerald-900/60',
            };
        case 'Livewire':
            return {
                bg: 'bg-pink-50 dark:bg-pink-950/50',
                text: 'text-pink-700 dark:text-pink-300',
                border: 'border-pink-100 dark:border-pink-900/60',
            };
        case 'CSS':
            return {
                bg: 'bg-sky-50 dark:bg-sky-950/50',
                text: 'text-sky-700 dark:text-sky-300',
                border: 'border-sky-100 dark:border-sky-900/60',
            };
        case 'MySQL':
            return {
                bg: 'bg-blue-50 dark:bg-blue-950/50',
                text: 'text-blue-700 dark:text-blue-300',
                border: 'border-blue-100 dark:border-blue-900/60',
            };
        default:
            return {
                bg: 'bg-slate-100 dark:bg-slate-800',
                text: 'text-slate-700 dark:text-slate-300',
                border: 'border-slate-200 dark:border-slate-700',
            };
    }
}

// Escape HTML entities helper
function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Write file only when content changes to keep builds idempotent
function writeFileIfChanged(filePath, content) {
    if (fs.existsSync(filePath)) {
        const existing = fs.readFileSync(filePath, 'utf8');
        if (existing === content) {
            return false;
        }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

// Recursive scanner for tips content
function scanMarkdownFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results = results.concat(scanMarkdownFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name.toLowerCase() !== 'readme.md') {
            results.push(fullPath);
        }
    }
    return results;
}

// Create configured marked instance with Mac dots & syntax highlighting
function setupMarkedRenderer() {
    const renderer = new Renderer();

    renderer.code = function({ text, lang }) {
        const validLang = lang && hljs.getLanguage(lang) ? lang : null;
        let highlighted = '';
        if (validLang) {
            try {
                highlighted = hljs.highlight(text, { language: validLang, ignoreIllegals: true }).value;
            } catch (e) {
                highlighted = escapeHtml(text);
            }
        } else {
            try {
                highlighted = hljs.highlightAuto(text).value;
            } catch (e) {
                highlighted = escapeHtml(text);
            }
        }
        const languageDisplay = lang || 'code';

        return `
<div class="code-block-wrapper my-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 overflow-hidden text-xs sm:text-sm font-mono shadow-sm relative group">
    <div class="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs">
        <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" aria-hidden="true"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" aria-hidden="true"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" aria-hidden="true"></span>
            <span class="font-semibold uppercase tracking-wider text-[11px] text-slate-300 ml-2">${escapeHtml(languageDisplay)}</span>
        </div>
        <button type="button" class="copy-code-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs cursor-pointer" data-code="${escapeHtml(text)}" aria-label="Copy code to clipboard">
            <svg class="w-3.5 h-3.5" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <span class="copy-label">Copy</span>
        </button>
    </div>
    <pre class="p-4 overflow-x-auto leading-relaxed"><code class="hljs ${validLang ? 'language-' + escapeHtml(validLang) : ''}">${highlighted}</code></pre>
</div>`;
    };

    marked.use({ renderer });
}

// Icon sprite SVG for standalone and embedded symbols
const iconSprite = `
    <!-- Icon sprite -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden" aria-hidden="true">
        <defs>
            <symbol id="i-heart" viewBox="0 0 512 512"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></symbol>
            <symbol id="i-github" viewBox="0 0 496 512"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></symbol>
            <symbol id="i-calendar" viewBox="0 0 448 512"><path d="M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm64 80v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm128 0v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H336zM64 400v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H208zm112 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H336c-8.8 0-16 7.2-16 16z"/></symbol>
            <symbol id="i-x-twitter" viewBox="0 0 512 512"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></symbol>
            <symbol id="i-arrow-left" viewBox="0 0 448 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></symbol>
            <symbol id="i-share" viewBox="0 0 512 512"><path d="M307 34.8c-11.5 5.1-19 16.6-19 29.2v64H176C78.8 128 0 206.8 0 304C0 417.3 81.5 467.9 100.2 478.1c2.5 1.4 5.3 1.9 8.1 1.9c10.9 0 19.7-8.9 19.7-19.7c0-7.5-4.3-14.4-9.8-19.5C108.8 431.9 96 414.4 96 384c0-53 43-96 96-96h96v64c0 12.6 7.5 24.1 19 29.2s25 2.6 34-6.4l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-9-9-22.5-11.5-34-6.4z"/></symbol>
            <symbol id="i-tag" viewBox="0 0 512 512"><path d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.824 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64a48 48 0 1 0 0 96 48 48 0 1 0 0-96z"/></symbol>
        </defs>
    </svg>`;

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

    const tipsFeedDir = path.resolve(publicDir, 'tips');
    if (!fs.existsSync(tipsFeedDir)) {
        fs.mkdirSync(tipsFeedDir, { recursive: true });
    }

    const markdownFiles = scanMarkdownFiles(tipsContentDir);
    console.log(`📖 Found ${markdownFiles.length} tip markdown files.`);

    setupMarkedRenderer();
    const tips = [];

    for (const filePath of markdownFiles) {
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(rawContent);
        const fileSlug = path.basename(filePath, '.md');
        const relPath = path.relative(path.resolve(rootDir, 'content', 'tips'), filePath).replace(/\\/g, '/');

        let title = data.title;
        let cleanBody = content;
        const h1Match = content.match(/^#\s+(.+)$/m);
        if (h1Match) {
            if (!title) title = h1Match[1].trim();
            cleanBody = cleanBody.replace(h1Match[0], '').trim();
        }
        if (!title) {
            title = fileSlug.replace(/-/g, ' ');
        }

        const slug = data.slug || fileSlug || slugify(title);

        let summary = data.summary;
        const quoteMatch = cleanBody.match(/^>\s*(.+)$/m);
        if (quoteMatch) {
            if (!summary) summary = quoteMatch[1].replace(/[`*_[\]]/g, '').trim();
            cleanBody = cleanBody.replace(quoteMatch[0], '').trim();
        }
        if (!summary) {
            summary = extractSummary(cleanBody);
        }

        const category = data.category || 'Laravel';
        const subcategory = data.subcategory || '';
        const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? String(data.tags).split(',').map(s => s.trim()) : [category]);
        const date = data.date ? String(data.date).trim() : '2026-07-01';
        const tweet_url = data.tweet_url || 'https://x.com/MrPunyapal';
        const author = data.author || 'Punyapal Shah';

        const htmlContent = marked.parse(cleanBody);

        tips.push({
            slug,
            title,
            category,
            subcategory,
            tags,
            date,
            formattedDate: formatDate(date),
            summary,
            tweet_url,
            author,
            authorUrl: data.author_url || 'https://x.com/MrPunyapal',
            relPath,
            rawMarkdown: cleanBody,
            htmlContent,
        });
    }

    // Sort by date descending (newest first), then by title
    tips.sort((a, b) => {
        if (b.date !== a.date) {
            return (b.date || '').localeCompare(a.date || '');
        }
        return a.title.localeCompare(b.title);
    });

    // Generate categories list with counts
    const categoriesMap = { 'All': tips.length };
    tips.forEach(tip => {
        categoriesMap[tip.category] = (categoriesMap[tip.category] || 0) + 1;
    });

    const categoryList = Object.keys(categoriesMap);

    // 1. Generate tips.html and tips/index.html (Hub archive)
    generateTipsHubPage(tips, categoryList, categoriesMap);

    // 2. Generate individual tip pages in tips/${slug}.html
    for (const tip of tips) {
        generateSingleTipPage(tip, tips);
    }

    // 3. Generate public search index
    const searchIndex = tips.map(t => ({
        slug: t.slug,
        title: t.title,
        category: t.category,
        subcategory: t.subcategory,
        tags: t.tags,
        date: t.date,
        summary: t.summary,
    }));
    const searchIndexFile = path.join(publicDir, 'tips-search-index.json');
    writeFileIfChanged(searchIndexFile, JSON.stringify(searchIndex, null, 2));

    // 4. Generate RSS feed
    const rssXml = generateRssFeed(tips);
    const rssFile = path.resolve(tipsFeedDir, 'feed.xml');
    writeFileIfChanged(rssFile, rssXml);

    // 5. Update Sitemap
    updateSitemap(tips);

    console.log(`✅ Tips build complete: generated tips.html, ${tips.length} individual pages, RSS feed, and search index.`);
}

function generateTipsHubPage(tips, categoryList, categoriesMap) {
    const tipsCardsHtml = tips.map((tip) => {
        const badge = getCategoryBadge(tip.category);
        const tagsHtml = tip.tags.map(tag => 
            `<span class="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded ${badge.bg} ${badge.text} border ${badge.border}">#${escapeHtml(tag)}</span>`
        ).join(' ');

        return `
            <div class="tip-card group relative p-6 sm:p-8 bg-white dark:bg-slate-900/60 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-300 flex flex-col justify-between"
                data-category="${escapeHtml(tip.category)}"
                data-tags="${escapeHtml(tip.tags.join(' ').toLowerCase())}"
                data-title="${escapeHtml(tip.title.toLowerCase())}"
                data-summary="${escapeHtml(tip.summary.toLowerCase())}">
                
                <!-- 4-Corner Crosshair SVG Markers (Site Signature Aesthetic) -->
                <div class="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10" aria-hidden="true">
                    <svg aria-hidden="true" class="w-full h-full" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block" aria-hidden="true">
                    <svg aria-hidden="true" class="w-full h-full" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div class="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10" aria-hidden="true">
                    <svg aria-hidden="true" class="w-full h-full" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div class="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block" aria-hidden="true">
                    <svg aria-hidden="true" class="w-full h-full" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>

                <div>
                    <!-- Header Meta: Category & Date -->
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}">
                            ${escapeHtml(tip.category)}
                        </span>
                        <time datetime="${escapeHtml(tip.date)}" class="text-xs font-mono text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
                            <svg class="icon text-xs opacity-70" width="12" height="12" viewBox="0 0 448 512" aria-hidden="true"><use href="#i-calendar"/></svg>
                            ${formatDate(tip.date)}
                        </time>
                    </div>

                    <!-- Title -->
                    <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors mb-2.5 leading-snug">
                        <a href="/tips/${tip.slug}" class="focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
                            ${escapeHtml(tip.title)}
                        </a>
                    </h3>

                    <!-- Summary -->
                    <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        ${escapeHtml(tip.summary)}
                    </p>
                </div>

                <!-- Footer: Tags & Action Links -->
                <div class="pt-4 mt-auto">
                    <div class="flex flex-wrap gap-1.5 mb-4">
                        ${tagsHtml}
                    </div>
                    <div class="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                        ${tip.tweet_url ? `
                        <a href="${escapeHtml(tip.tweet_url)}" target="_blank" rel="noopener noreferrer" aria-label="View on X: ${escapeHtml(tip.title)}" class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                            <svg class="icon" width="12" height="12" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-x-twitter"/></svg>
                            <span>X Post</span>
                        </a>` : '<div></div>'}
                        <a href="/tips/${tip.slug}" class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors" aria-label="Read full tip: ${escapeHtml(tip.title)}">
                            <span>Read Tip</span>
                            <svg class="w-3 h-3" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </a>
                    </div>
                </div>
            </div>`;
    }).join('\n');

    const filterPillsHtml = categoryList.map(cat => {
        const count = categoriesMap[cat];
        const isAll = cat === 'All';
        const activeClass = isAll
            ? 'active-filter bg-red-600 text-white border-red-600 shadow-sm'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700';

        return `
            <button type="button" class="filter-btn px-3 py-1.5 rounded text-xs font-medium border transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeClass}" data-filter="${escapeHtml(cat)}">
                <span>${escapeHtml(cat)}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded ${isAll ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}">${count}</span>
            </button>`;
    }).join('\n');

    const hubHtml = `<!DOCTYPE html>
<html lang="en" class="overflow-x-hidden">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Developer Tips & Snippets | Punyapal Shah</title>

    <!-- Browser and Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#FF2D20">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="Permissions-Policy" content="interest-cohort=()">

    <!-- Primary Meta Tags -->
    <meta name="description"
        content="Curated engineering tips, testing techniques, and idiomatic snippets for Laravel, Pest PHP, PHP, JavaScript, TypeScript, and Git by Punyapal Shah.">
    <meta name="author" content="Punyapal Shah">
    <link rel="canonical" href="https://mrpunyapal.dev/tips">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://mrpunyapal.dev/tips">
    <meta property="og:title" content="Developer Tips & Snippets | Punyapal Shah">
    <meta property="og:description"
        content="Curated engineering tips, testing techniques, and idiomatic snippets for Laravel, Pest PHP, PHP, JavaScript, TypeScript, and Git by Punyapal Shah.">
    <meta property="og:image" content="https://mrpunyapal.dev/master-og-image.png">
    <meta property="og:image:secure_url" content="https://mrpunyapal.dev/master-og-image.png">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Punyapal Shah - Developer Tips & Snippets">
    <meta property="og:site_name" content="Punyapal Shah">
    <meta property="og:locale" content="en_US">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@MrPunyapal">
    <meta name="twitter:creator" content="@MrPunyapal">
    <meta name="twitter:url" content="https://mrpunyapal.dev/tips">
    <meta name="twitter:title" content="Developer Tips & Snippets | Punyapal Shah">
    <meta name="twitter:description"
        content="Curated engineering tips, testing techniques, and idiomatic snippets for Laravel, Pest PHP, PHP, JavaScript, TypeScript, and Git by Punyapal Shah.">
    <meta name="twitter:image" content="https://mrpunyapal.dev/master-og-image.png">
    <meta name="twitter:image:src" content="https://mrpunyapal.dev/master-og-image.png">
    <meta name="twitter:image:alt" content="Punyapal Shah - Developer Tips & Snippets">

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": "https://mrpunyapal.dev/tips#webpage",
                "url": "https://mrpunyapal.dev/tips",
                "name": "Developer Tips & Snippets | Punyapal Shah",
                "description": "Curated engineering tips, testing techniques, and idiomatic snippets for Laravel, Pest PHP, PHP, JavaScript, TypeScript, and Git by Punyapal Shah.",
                "inLanguage": "en",
                "isPartOf": {
                    "@id": "https://mrpunyapal.dev/#website"
                },
                "about": {
                    "@id": "https://mrpunyapal.dev/#person"
                },
                "mainEntity": {
                    "@id": "https://mrpunyapal.dev/tips#collection"
                }
            },
            {
                "@type": "ItemList",
                "@id": "https://mrpunyapal.dev/tips#collection",
                "name": "Curated Developer Tips & Snippets",
                "itemListElement": [
                    ${tips.map((t, idx) => `{
                        "@type": "ListItem",
                        "position": ${idx + 1},
                        "url": "https://mrpunyapal.dev/tips/${t.slug}",
                        "name": "${escapeHtml(t.title)}"
                    }`).join(',\n                    ')}
                ]
            }
        ]
    }
    </script>

    <!-- Favicon and Icons -->
    <link rel="icon" href="/favicon.png" type="image/png" sizes="128x128">
    <link rel="apple-touch-icon" href="/favicon.png">
    <meta name="msapplication-TileColor" content="#FF2D20">

    <link rel="stylesheet" href="/src/tailwind.css">
    <link rel="stylesheet" href="/src/app.css">
    <script type="module" src="/src/main.js"></script>
    <script>
        (function() {
            const saved = localStorage.getItem('theme');
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (saved === 'dark' || (!saved && systemDark)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        })();
    </script>
</head>

<body class="font-sans m-0 p-0 min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed relative overflow-x-hidden antialiased transition-colors duration-200">
    ${iconSprite}

    <!-- Main Content Frame -->
    <main class="min-h-screen flex flex-col items-center px-3 sm:px-6 pt-1 sm:pt-2 pb-8 sm:pb-12 gap-8">
        <div class="w-full max-w-6xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10">

            <!-- Tech Markers: Corners -->
            <div class="tech-marker -top-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -top-[4px] -right-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

            <!-- Global Infinite Lines -->
            <div class="tech-line-h top-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-top left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-top right-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-bottom left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-bottom right-[-1px]" aria-hidden="true"></div>

            <!-- Card Header: Top Nav Bar -->
            <site-header active="tips"></site-header>

            <!-- Hero Section -->
            <section class="border-b border-slate-200 dark:border-slate-800 relative">
                <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

                <div class="p-4 sm:p-12">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Curated Knowledge Base</span>
                    </div>
                    <h1 class="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
                        Developer Tips & Snippets
                    </h1>
                    <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mb-6">
                        Bite-sized engineering patterns, performance techniques, and idiomatic snippets curated from <a href="https://x.com/MrPunyapal" target="_blank" rel="noopener noreferrer" class="text-red-600 dark:text-red-400 hover:underline font-semibold">@MrPunyapal on X</a>.
                    </p>

                    <!-- Search & Filters -->
                    <div class="mt-6 space-y-4 max-w-3xl">
                        <!-- Live Search Input -->
                        <div class="relative">
                            <label for="tip-search" class="sr-only">Search tips</label>
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <svg class="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <input type="search" id="tip-search" placeholder="Filter by keyword (e.g. sole, TIA, prohibitable, database)..." class="w-full pl-10 pr-4 py-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all">
                        </div>

                        <!-- Category Filters -->
                        <div class="flex flex-wrap items-center gap-2 pt-1" id="category-filters" role="group" aria-label="Filter tips by technology category">
                            ${filterPillsHtml}
                        </div>
                    </div>
                </div>
            </section>

            <!-- Tips Grid Section -->
            <section class="relative">
                <div id="tips-container" class="grid grid-cols-1 md:grid-cols-2 border-l border-slate-200 dark:border-slate-800">
                    ${tipsCardsHtml}
                </div>

                <!-- Empty State (hidden by default) -->
                <div id="empty-state" class="hidden p-12 text-center border-t border-slate-200 dark:border-slate-800">
                    <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-1">No matching tips found</h3>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">Try adjusting your search terms or selecting another category.</p>
                    <button type="button" id="reset-filters-btn" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors cursor-pointer">
                        Reset Search & Filters
                    </button>
                </div>
            </section>

        </div>

        <!-- Footer -->
        <div class="w-full max-w-5xl py-6 text-center mt-[-1px] z-10 print:hidden">
            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                // Got a tip or want to contribute?
                <a href="https://github.com/MrPunyapal/tips" target="_blank" rel="noopener noreferrer"
                    class="text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold ml-1">
                    github.com/MrPunyapal/tips
                </a>
            </p>
        </div>
    </main>

    <!-- Client-side Interactive Filter & Search Script -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const searchInput = document.getElementById('tip-search');
            const filterButtons = document.querySelectorAll('.filter-btn');
            const cards = document.querySelectorAll('.tip-card');
            const emptyState = document.getElementById('empty-state');
            const resetBtn = document.getElementById('reset-filters-btn');
            let activeCategory = 'All';

            function filterCards() {
                const query = searchInput.value.toLowerCase().trim();
                let visibleCount = 0;

                cards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    const tags = card.getAttribute('data-tags');
                    const title = card.getAttribute('data-title');
                    const summary = card.getAttribute('data-summary');

                    const matchesCategory = (activeCategory === 'All' || category === activeCategory);
                    const matchesQuery = !query || 
                        title.includes(query) || 
                        summary.includes(query) || 
                        tags.includes(query) || 
                        category.toLowerCase().includes(query);

                    if (matchesCategory && matchesQuery) {
                        card.style.display = 'flex';
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                if (visibleCount === 0) {
                    emptyState.classList.remove('hidden');
                } else {
                    emptyState.classList.add('hidden');
                }
            }

            filterButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    activeCategory = btn.getAttribute('data-filter');
                    
                    filterButtons.forEach(b => {
                        b.classList.remove('active-filter', 'bg-red-600', 'text-white', 'border-red-600', 'shadow-sm');
                        b.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                        const badge = b.querySelector('span:last-child');
                        if (badge) {
                            badge.classList.remove('bg-white/20', 'text-white');
                            badge.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-500', 'dark:text-slate-400');
                        }
                    });

                    btn.classList.add('active-filter', 'bg-red-600', 'text-white', 'border-red-600', 'shadow-sm');
                    btn.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                    const badge = btn.querySelector('span:last-child');
                    if (badge) {
                        badge.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-500', 'dark:text-slate-400');
                        badge.classList.add('bg-white/20', 'text-white');
                    }

                    filterCards();
                });
            });

            if (searchInput) {
                searchInput.addEventListener('input', filterCards);
            }

            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    const allBtn = document.querySelector('[data-filter="All"]');
                    if (allBtn) allBtn.click();
                });
            }

            // Keyboard shortcut '/' to search
            document.addEventListener('keydown', (e) => {
                if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                    e.preventDefault();
                    searchInput.focus();
                } else if (e.key === 'Escape' && document.activeElement === searchInput) {
                    searchInput.value = '';
                    filterCards();
                    searchInput.blur();
                }
            });

            // Copy code buttons logic
            document.querySelectorAll('.copy-code-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const code = btn.getAttribute('data-code');
                    if (!code) return;
                    try {
                        await navigator.clipboard.writeText(code);
                        const label = btn.querySelector('.copy-label');
                        if (label) label.textContent = 'Copied!';
                        btn.classList.add('bg-emerald-700', 'text-white');
                        setTimeout(() => {
                            if (label) label.textContent = 'Copy';
                            btn.classList.remove('bg-emerald-700', 'text-white');
                        }, 2000);
                    } catch (e) {
                        console.error('Failed to copy code', e);
                    }
                });
            });
        });
    </script>
</body>
</html>`;

    const rootHubFile = path.join(rootDir, 'tips.html');
    writeFileIfChanged(rootHubFile, hubHtml);

    // Also write tips/index.html so /tips/ works cleanly
    const subHubFile = path.join(tipsOutDir, 'index.html');
    writeFileIfChanged(subHubFile, hubHtml);
}

function generateSingleTipPage(tip, allTips) {
    const badge = getCategoryBadge(tip.category);
    const relatedTips = allTips
        .filter(t => t.slug !== tip.slug && (t.category === tip.category || t.tags.some(tag => tip.tags.includes(tag))))
        .slice(0, 2);

    const relatedHtml = relatedTips.length > 0 ? `
        <div class="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h2 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Related Tips</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${relatedTips.map(r => {
                    const rBadge = getCategoryBadge(r.category);
                    return `
                    <a href="/tips/${r.slug}" class="group p-5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800/60 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex flex-col justify-between">
                        <div>
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${rBadge.bg} ${rBadge.text} ${rBadge.border} mb-2">${escapeHtml(r.category)}</span>
                            <h3 class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug mb-2">${escapeHtml(r.title)}</h3>
                        </div>
                        <span class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-2 inline-flex items-center gap-1.5">
                            <svg class="icon text-xs opacity-70" width="12" height="12" viewBox="0 0 448 512" aria-hidden="true"><use href="#i-calendar"/></svg>
                            ${formatDate(r.date)}
                        </span>
                    </a>`;
                }).join('')}
            </div>
        </div>
    ` : '';

    const ogImage = fs.existsSync(path.resolve(publicDir, 'og', 'tips', `${tip.slug}.png`))
        ? `https://mrpunyapal.dev/og/tips/${tip.slug}.png`
        : `https://mrpunyapal.dev/master-og-image.png`;

    const singleTipHtml = `<!DOCTYPE html>
<html lang="en" class="overflow-x-hidden">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(tip.title)} | Tips | Punyapal Shah</title>

    <!-- Browser and Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#FF2D20">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="Permissions-Policy" content="interest-cohort=()">

    <!-- Primary SEO Meta Tags -->
    <meta name="description" content="${escapeHtml(tip.summary)}">
    <meta name="author" content="${escapeHtml(tip.author)}">
    <link rel="canonical" href="https://mrpunyapal.dev/tips/${tip.slug}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://mrpunyapal.dev/tips/${tip.slug}">
    <meta property="og:title" content="${escapeHtml(tip.title)} | Punyapal Shah">
    <meta property="og:description" content="${escapeHtml(tip.summary)}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:secure_url" content="${ogImage}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Punyapal Shah">
    <meta property="og:locale" content="en_US">
    <meta property="article:published_time" content="${escapeHtml(tip.date)}">
    <meta property="article:author" content="https://mrpunyapal.dev/#person">
    <meta property="article:section" content="${escapeHtml(tip.category)}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@MrPunyapal">
    <meta name="twitter:creator" content="@MrPunyapal">
    <meta name="twitter:url" content="https://mrpunyapal.dev/tips/${tip.slug}">
    <meta name="twitter:title" content="${escapeHtml(tip.title)} | Punyapal Shah">
    <meta name="twitter:description" content="${escapeHtml(tip.summary)}">
    <meta name="twitter:image" content="${ogImage}">

    <!-- Structured Data (JSON-LD TechArticle & Breadcrumbs) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TechArticle",
                "@id": "https://mrpunyapal.dev/tips/${tip.slug}#article",
                "headline": "${escapeHtml(tip.title)}",
                "description": "${escapeHtml(tip.summary)}",
                "datePublished": "${escapeHtml(tip.date)}",
                "inLanguage": "en",
                "mainEntityOfPage": "https://mrpunyapal.dev/tips/${tip.slug}",
                "author": {
                    "@id": "https://mrpunyapal.dev/#person"
                },
                "publisher": {
                    "@id": "https://mrpunyapal.dev/#person"
                },
                "articleSection": "${escapeHtml(tip.category)}"
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://mrpunyapal.dev/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Tips",
                        "item": "https://mrpunyapal.dev/tips"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": "${escapeHtml(tip.title)}",
                        "item": "https://mrpunyapal.dev/tips/${tip.slug}"
                    }
                ]
            }
        ]
    }
    </script>

    <!-- Favicon and Icons -->
    <link rel="icon" href="/favicon.png" type="image/png" sizes="128x128">
    <link rel="apple-touch-icon" href="/favicon.png">
    <meta name="msapplication-TileColor" content="#FF2D20">

    <link rel="stylesheet" href="/src/tailwind.css">
    <link rel="stylesheet" href="/src/app.css">
    <script type="module" src="/src/main.js"></script>
    <script>
        (function() {
            const saved = localStorage.getItem('theme');
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (saved === 'dark' || (!saved && systemDark)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        })();
    </script>
</head>

<body class="font-sans m-0 p-0 min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed relative overflow-x-hidden antialiased transition-colors duration-200">
    ${iconSprite}

    <!-- Main Content Frame -->
    <main class="min-h-screen flex flex-col items-center px-3 sm:px-6 pt-1 sm:pt-2 pb-8 sm:pb-12 gap-8">
        <div class="w-full max-w-4xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10">

            <!-- Tech Markers: Corners -->
            <div class="tech-marker -top-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -top-[4px] -right-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

            <!-- Global Infinite Lines -->
            <div class="tech-line-h top-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-top left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-top right-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-bottom left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-bottom right-[-1px]" aria-hidden="true"></div>

            <!-- Card Header: Top Nav Bar -->
            <site-header active="tips"></site-header>

            <!-- Tip Article Header & Content -->
            <article class="p-6 sm:p-10">
                <!-- Breadcrumbs & Category Badge -->
                <div class="flex items-center justify-between gap-4 mb-6">
                    <a href="/tips" class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">
                        <svg class="icon text-xs" width="12" height="12" viewBox="0 0 448 512" aria-hidden="true"><use href="#i-arrow-left"/></svg>
                        <span>Back to All Tips</span>
                    </a>

                    <div class="flex items-center gap-2">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}">
                            ${escapeHtml(tip.category)}
                        </span>
                    </div>
                </div>

                <!-- Title & Meta -->
                <header class="mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
                        ${escapeHtml(tip.title)}
                    </h1>

                    <div class="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                        <time datetime="${escapeHtml(tip.date)}" class="inline-flex items-center gap-1.5">
                            <svg class="icon text-xs opacity-70" width="12" height="12" viewBox="0 0 448 512" aria-hidden="true"><use href="#i-calendar"/></svg>
                            ${formatDate(tip.date)}
                        </time>
                        <span>&bull;</span>
                        <span>Author: ${escapeHtml(tip.author)}</span>
                    </div>

                    ${tip.summary ? `
                    <blockquote class="p-4 my-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border-l-4 border-red-500 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed italic">
                        ${escapeHtml(tip.summary)}
                    </blockquote>` : ''}
                </header>

                <!-- Article Body -->
                <div class="tip-content prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                    ${tip.htmlContent}
                </div>

                <!-- Tags -->
                <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 inline-flex items-center gap-1">
                        <svg class="icon text-xs" width="12" height="12" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-tag"/></svg>
                        Tags:
                    </span>
                    ${tip.tags.map(t => `<span class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${badge.bg} ${badge.text} border ${badge.border}">#${escapeHtml(t)}</span>`).join(' ')}
                </div>

                <!-- Action Share Bar -->
                <div class="mt-8 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div class="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Found this useful? Share or view the original post:
                    </div>
                    <div class="flex items-center gap-2.5">
                        ${tip.tweet_url ? `
                        <a href="${escapeHtml(tip.tweet_url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity text-xs font-semibold" aria-label="View original tip on X">
                            <svg class="icon text-xs" width="12" height="12" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-x-twitter"/></svg>
                            <span>View on X</span>
                        </a>` : ''}
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(tip.title + ' by @MrPunyapal')}&url=${encodeURIComponent('https://mrpunyapal.dev/tips/' + tip.slug)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-semibold" aria-label="Share this tip on X">
                            <svg class="icon text-xs" width="12" height="12" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-share"/></svg>
                            <span>Share</span>
                        </a>
                        <button type="button" id="share-link-btn" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs font-semibold cursor-pointer" aria-label="Copy page link">
                            <span id="share-link-text">Copy Link</span>
                        </button>
                    </div>
                </div>

                <!-- Related Tips -->
                ${relatedHtml}
            </article>
        </div>

        <!-- Footer -->
        <div class="w-full max-w-4xl py-6 text-center mt-[-1px] z-10 print:hidden">
            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                // Found an issue or want to contribute a tip?
                <a href="https://github.com/MrPunyapal/tips" target="_blank" rel="noopener noreferrer"
                    class="text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold ml-1">
                    github.com/MrPunyapal/tips
                </a>
            </p>
        </div>
    </main>

    <!-- Copy Link & Code helper script -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const shareBtn = document.getElementById('share-link-btn');
            const shareText = document.getElementById('share-link-text');
            if (shareBtn && shareText) {
                shareBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(window.location.href);
                        shareText.textContent = 'Copied!';
                        setTimeout(() => { shareText.textContent = 'Copy Link'; }, 2000);
                    } catch(e) {
                        console.error('Failed to copy link', e);
                    }
                });
            }

            document.querySelectorAll('.copy-code-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const code = btn.getAttribute('data-code');
                    if (!code) return;
                    try {
                        await navigator.clipboard.writeText(code);
                        const label = btn.querySelector('.copy-label');
                        if (label) label.textContent = 'Copied!';
                        btn.classList.add('bg-emerald-700', 'text-white');
                        setTimeout(() => {
                            if (label) label.textContent = 'Copy';
                            btn.classList.remove('bg-emerald-700', 'text-white');
                        }, 2000);
                    } catch (e) {
                        console.error('Failed to copy code', e);
                    }
                });
            });
        });
    </script>
</body>
</html>`;

    const singleTipFile = path.join(tipsOutDir, `${tip.slug}.html`);
    writeFileIfChanged(singleTipFile, singleTipHtml);
}

function generateRssFeed(tips) {
    const latestDate = tips.length > 0 ? formatRssDate(tips[0].date) : new Date(0).toUTCString();
    const itemsHtml = tips.map(tip => `        <item>
            <title>${escapeHtml(tip.title)}</title>
            <link>https://mrpunyapal.dev/tips/${tip.slug}</link>
            <guid>https://mrpunyapal.dev/tips/${tip.slug}</guid>
            <pubDate>${formatRssDate(tip.date)}</pubDate>
            <description>${escapeHtml(tip.summary)}</description>
            <category>${escapeHtml(tip.category)}</category>
        </item>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Developer Tips &amp; Snippets - Punyapal Shah</title>
        <link>https://mrpunyapal.dev/tips</link>
        <description>Bite-sized engineering patterns, performance techniques, and idiomatic snippets curated from @MrPunyapal on X.</description>
        <language>en-us</language>
        <lastBuildDate>${latestDate}</lastBuildDate>
        <atom:link href="https://mrpunyapal.dev/tips/feed.xml" rel="self" type="application/rss+xml"/>
${itemsHtml}
    </channel>
</rss>
`;
}

function updateSitemap(tips) {
    const sitemapPath = path.resolve(publicDir, 'sitemap.xml');
    const baseUrls = [
        { loc: 'https://mrpunyapal.dev/', priority: '1.0', changefreq: 'weekly' },
        { loc: 'https://mrpunyapal.dev/services', priority: '0.8', changefreq: 'weekly' },
        { loc: 'https://mrpunyapal.dev/projects', priority: '0.8', changefreq: 'weekly' },
        { loc: 'https://mrpunyapal.dev/opensource', priority: '0.8', changefreq: 'weekly' },
        { loc: 'https://mrpunyapal.dev/tips', priority: '0.9', changefreq: 'weekly' },
        { loc: 'https://mrpunyapal.dev/resume', priority: '0.8', changefreq: 'weekly' },
        { loc: 'https://mrpunyapal.dev/talks', priority: '0.8', changefreq: 'weekly' },
        { loc: 'https://mrpunyapal.dev/laravelblr', priority: '0.8', changefreq: 'weekly' },
    ];

    const tipUrls = tips.map(tip => ({
        loc: `https://mrpunyapal.dev/tips/${tip.slug}`,
        priority: '0.7',
        changefreq: 'monthly',
    }));

    const allUrls = [...baseUrls, ...tipUrls];

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `    <url>
        <loc>${u.loc}</loc>
        <changefreq>${u.changefreq}</changefreq>
        <priority>${u.priority}</priority>
    </url>`).join('\n')}
</urlset>
`;

    writeFileIfChanged(sitemapPath, xmlContent);
}

// Run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    buildTips();
}
