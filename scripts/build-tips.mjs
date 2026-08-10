import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { renderSiteHeader } from './site-header.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const tipsContentDir = fs.existsSync(path.resolve(rootDir, 'content', 'tips', 'content'))
    ? path.resolve(rootDir, 'content', 'tips', 'content')
    : path.resolve(rootDir, 'content', 'tips');
const tipsOutDir = path.resolve(rootDir, 'tips');
const publicDir = path.resolve(rootDir, 'public');

// Format date helper: "2026-07-20" -> "Jul 20, 2026"
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format RFC 822 / RFC 1123 date helper for RSS feed
function toRfc822Date(dateStr) {
    if (!dateStr) return new Date().toUTCString();
    const str = String(dateStr).trim();
    const isoStr = str.includes('T') ? str : `${str}T00:00:00Z`;
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) {
        const fallbackDate = new Date(str);
        return isNaN(fallbackDate.getTime()) ? new Date().toUTCString() : fallbackDate.toUTCString();
    }
    return date.toUTCString();
}

// Safely wrap text in XML CDATA block
function wrapCdata(text) {
    if (text === null || text === undefined) return '<![CDATA[]]>';
    return `<![CDATA[${String(text).replace(/\]\]>/g, ']]>]]&gt;<![CDATA[')}]]>`;
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
        .replace(/\s+/g, ' ')
        .trim();

    if (cleanText.length <= 160) return cleanText;
    return cleanText.substring(0, 157).trim() + '...';
}

// Category color styling helper (Exact WCAG AA compliant palettes matching opensource.html & projects.html)
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
        case 'Filament':
        case 'FilamentPHP':
            return {
                bg: 'bg-amber-50 dark:bg-amber-950/50',
                text: 'text-amber-700 dark:text-amber-300',
                border: 'border-amber-100 dark:border-amber-900/60',
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
        case 'Security':
            return {
                bg: 'bg-emerald-50 dark:bg-emerald-950/50',
                text: 'text-emerald-700 dark:text-emerald-300',
                border: 'border-emerald-100 dark:border-emerald-900/60',
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

// Custom renderer for marked
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }) {
    const language = lang || 'php';
    let highlightedCode = '';

    if (language && hljs.getLanguage(language)) {
        try {
            highlightedCode = hljs.highlight(text, { language }).value;
        } catch (e) {
            highlightedCode = escapeHtml(text);
        }
    } else {
        try {
            highlightedCode = hljs.highlightAuto(text).value;
        } catch (e) {
            highlightedCode = escapeHtml(text);
        }
    }

    return `
<div class="code-block-wrapper my-6 rounded-2xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-[#24292e] dark:text-[#c9d1d9] overflow-hidden text-xs sm:text-sm font-mono shadow-sm relative group">
    <div class="flex items-center justify-between px-4 py-3 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] select-none">
        <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-[#d0d7de] dark:bg-[#30363d] inline-block" aria-hidden="true"></span>
            <span class="w-3 h-3 rounded-full bg-[#d0d7de] dark:bg-[#30363d] inline-block" aria-hidden="true"></span>
            <span class="w-3 h-3 rounded-full bg-[#d0d7de] dark:bg-[#30363d] inline-block" aria-hidden="true"></span>
        </div>
        <button type="button" class="copy-code-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] hover:bg-[#f3f4f6] dark:hover:bg-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:text-[#24292e] dark:hover:text-[#c9d1d9] transition-colors text-xs font-medium cursor-pointer" data-code="${escapeHtml(text)}" aria-label="Copy code to clipboard">
            <svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <span class="copy-label">Copy</span>
        </button>
    </div>
    <pre class="p-5 sm:p-6 overflow-x-auto leading-relaxed bg-white dark:bg-[#0d1117]"><code class="hljs language-${escapeHtml(language)}">${highlightedCode}</code></pre>
</div>`;
};

renderer.heading = function({ text, depth }) {
    const headingLevel = Math.min(depth + 1, 6);
    const classes = {
        2: 'text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4 tracking-tight',
        3: 'text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight',
        4: 'text-base sm:text-lg font-semibold text-slate-900 dark:text-white mt-4 mb-2',
    }[headingLevel] || 'text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2';

    return `<h${headingLevel} class="${classes}">${text}</h${headingLevel}>`;
};

renderer.blockquote = function({ text }) {
    return `<blockquote class="p-4 sm:p-5 my-5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border-l-4 border-red-500 text-slate-700 dark:text-slate-300 text-sm sm:text-base font-mono leading-relaxed">${text}</blockquote>`;
};

renderer.paragraph = function({ text }) {
    return `<p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed my-3">${text}</p>`;
};

renderer.list = function(token) {
    const ordered = token.ordered;
    const body = token.items
        ? token.items.map(item => this.listitem(item)).join('')
        : (token.body || '');
    const tag = ordered ? 'ol' : 'ul';
    const listClasses = ordered
        ? 'list-decimal list-inside my-4 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 pl-2'
        : 'list-disc list-inside my-4 space-y-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 pl-2';
    return `<${tag} class="${listClasses}">${body}</${tag}>`;
};

renderer.listitem = function(item) {
    const raw = typeof item === 'object' ? (item.text || item.raw || '') : item;
    const content = marked.parseInline(raw);
    return `<li class="leading-relaxed"><span class="align-middle">${content}</span></li>`;
};

renderer.link = function({ href, text }) {
    const isExternal = href.startsWith('http') || href.startsWith('//');
    const rel = isExternal ? ' rel="noopener noreferrer"' : '';
    const target = isExternal ? ' target="_blank"' : '';
    return `<a href="${escapeHtml(href)}"${target}${rel} class="text-red-600 dark:text-red-400 hover:underline font-semibold">${text}</a>`;
};

marked.use({ renderer });

// Critical Grid & Marker Styles exactly matching index.html
const criticalGridStyles = `
    <style>
        @keyframes fade-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Technical Grid Markers */
        .tech-marker {
            position: absolute;
            width: 7px;
            height: 7px;
            background-color: white;
            border: 1px solid #cbd5e1;
            border-radius: 50%;
            z-index: 50;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
        }

        .dark .tech-marker {
            background-color: #0f172a;
            border-color: #334155;
            box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.5);
        }

        /* Infinite Grid Lines */
        .tech-line-h {
            position: absolute;
            height: 1px;
            background-color: #e2e8f0;
            z-index: 0;
            pointer-events: none;
            width: 300vw;
            left: 50%;
            transform: translateX(-50%);
        }

        .dark .tech-line-h {
            background-color: #1e293b;
        }

        .tech-line-v-top {
            position: absolute;
            width: 1px;
            background-color: #e2e8f0;
            z-index: 0;
            pointer-events: none;
            bottom: 100%;
            height: 100vh;
        }

        .dark .tech-line-v-top {
            background-color: #1e293b;
        }

        .tech-line-v-bottom {
            position: absolute;
            width: 1px;
            background: linear-gradient(to bottom, #e2e8f0, transparent);
            z-index: 0;
            pointer-events: none;
            top: 100%;
            height: 120px;
        }

        .dark .tech-line-v-bottom {
            background: linear-gradient(to bottom, #1e293b, transparent);
        }

        /* Official GitHub Light Theme */
        .hljs {
            color: #24292e;
            background: transparent;
        }
        .hljs-doctag,
        .hljs-keyword,
        .hljs-meta .hljs-keyword,
        .hljs-template-tag,
        .hljs-template-variable,
        .hljs-type,
        .hljs-variable.language_ {
            color: #d73a49;
            font-weight: 600;
        }
        .hljs-title,
        .hljs-title.class_,
        .hljs-title.class_.inherited__,
        .hljs-title.function_ {
            color: #6f42c1;
            font-weight: 600;
        }
        .hljs-attr,
        .hljs-attribute,
        .hljs-literal,
        .hljs-meta,
        .hljs-number,
        .hljs-operator,
        .hljs-variable,
        .hljs-selector-attr,
        .hljs-selector-class,
        .hljs-selector-id {
            color: #005cc5;
        }
        .hljs-regexp,
        .hljs-string,
        .hljs-meta .hljs-string {
            color: #032f62;
        }
        .hljs-built_in,
        .hljs-symbol {
            color: #e36209;
        }
        .hljs-comment,
        .hljs-code,
        .hljs-formula {
            color: #6a737d;
            font-style: italic;
        }
        .hljs-name,
        .hljs-quote,
        .hljs-selector-tag,
        .hljs-selector-pseudo {
            color: #22863a;
        }
        .hljs-subst {
            color: #24292e;
        }
        .hljs-section {
            color: #005cc5;
            font-weight: bold;
        }
        .hljs-bullet {
            color: #735c0f;
        }
        .hljs-emphasis {
            color: #24292e;
            font-style: italic;
        }
        .hljs-strong {
            color: #24292e;
            font-weight: bold;
        }
        .hljs-link {
            text-decoration: underline;
        }

        /* Official GitHub Dark Theme */
        .dark .hljs {
            color: #c9d1d9;
            background: transparent;
        }
        .dark .hljs-doctag,
        .dark .hljs-keyword,
        .dark .hljs-meta .hljs-keyword,
        .dark .hljs-template-tag,
        .dark .hljs-template-variable,
        .dark .hljs-type,
        .dark .hljs-variable.language_ {
            color: #ff7b72;
            font-weight: 600;
        }
        .dark .hljs-title,
        .dark .hljs-title.class_,
        .dark .hljs-title.class_.inherited__,
        .dark .hljs-title.function_ {
            color: #d2a8ff;
            font-weight: 600;
        }
        .dark .hljs-attr,
        .dark .hljs-attribute,
        .dark .hljs-literal,
        .dark .hljs-meta,
        .dark .hljs-number,
        .dark .hljs-operator,
        .dark .hljs-variable,
        .dark .hljs-selector-attr,
        .dark .hljs-selector-class,
        .dark .hljs-selector-id {
            color: #79c0ff;
        }
        .dark .hljs-regexp,
        .dark .hljs-string,
        .dark .hljs-meta .hljs-string {
            color: #a5d6ff;
        }
        .dark .hljs-built_in,
        .dark .hljs-symbol {
            color: #ffa657;
        }
        .dark .hljs-comment,
        .dark .hljs-code,
        .dark .hljs-formula {
            color: #8b949e;
            font-style: italic;
        }
        .dark .hljs-name,
        .dark .hljs-quote,
        .dark .hljs-selector-tag,
        .dark .hljs-selector-pseudo {
            color: #7ee787;
        }
        .dark .hljs-subst {
            color: #c9d1d9;
        }
        .dark .hljs-section {
            color: #1f6feb;
            font-weight: bold;
        }
        .dark .hljs-bullet {
            color: #f2cc60;
        }
        .dark .hljs-emphasis {
            color: #c9d1d9;
            font-style: italic;
        }
        .dark .hljs-strong {
            color: #c9d1d9;
            font-weight: bold;
        }
        .dark .hljs-link {
            text-decoration: underline;
        }
    </style>`;

// Icon sprite SVG
const iconSprite = `
    <!-- Icon sprite: Font Awesome Free 6.4.2 icons -->
    <svg xmlns="http://www.w3.org/2000/svg" class="hidden" aria-hidden="true">
        <defs>
            <symbol id="i-heart" viewBox="0 0 512 512"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></symbol>
            <symbol id="i-github" viewBox="0 0 496 512"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></symbol>
            <symbol id="i-calendar" viewBox="0 0 448 512"><path d="M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm64 80v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm128 0v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H336zM64 400v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H208zm112 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H336c-8.8 0-16 7.2-16 16z"/></symbol>
            <symbol id="i-x-twitter" viewBox="0 0 512 512"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></symbol>
            <symbol id="i-arrow-left" viewBox="0 0 448 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></symbol>
            <symbol id="i-share" viewBox="0 0 512 512"><path d="M307 34.8c-11.5 5.1-19 16.6-19 29.2v64H176C78.8 128 0 206.8 0 304C0 417.3 81.5 467.9 100.2 478.1c2.5 1.4 5.3 1.9 8.1 1.9c10.9 0 19.7-8.9 19.7-19.7c0-7.5-4.3-14.4-9.8-19.5C108.8 431.9 96 414.4 96 384c0-53 43-96 96-96h96v64c0 12.6 7.5 24.1 19 29.2s25 2.6 34-6.4l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-9-9-22.5-11.5-34-6.4z"/></symbol>
            <symbol id="i-tag" viewBox="0 0 512 512"><path d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.824 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64a48 48 0 1 0 0 96 48 48 0 1 0 0-96z"/></symbol>
            <symbol id="i-user" viewBox="0 0 448 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></symbol>
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
        const date = data.date || '2026-07-01';
        const updated = data.updated || data.last_updated || data.updated_at || null;
        const tweet_url = data.tweet_url || null;
        const author = data.author || 'Punyapal Shah';
        const author_url = data.author_url || (author === 'Punyapal Shah' ? 'https://x.com/MrPunyapal' : null);
        const og_image = data.og_image || data.image || `https://mrpunyapal.dev/og/tips/${slug}.png`;

        const htmlContent = marked.parse(cleanBody);

        tips.push({
            slug,
            title,
            category,
            subcategory,
            tags,
            date,
            updated,
            summary,
            tweet_url,
            author,
            author_url,
            og_image,
            rawMarkdown: cleanBody,
            htmlContent,
        });
    }

    // Sort by date descending
    tips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generate categories list with counts
    const categoriesMap = { 'All': tips.length };
    tips.forEach(tip => {
        categoriesMap[tip.category] = (categoriesMap[tip.category] || 0) + 1;
    });

    const categoryList = Object.keys(categoriesMap);

    // 1. Generate tips.html (Hub archive)
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
        author: t.author,
        author_url: t.author_url,
    }));
    fs.writeFileSync(path.join(publicDir, 'tips-search-index.json'), JSON.stringify(searchIndex, null, 2));

    // 4. Automatically generate/synchronize public/sitemap.xml
    generateSitemap(tips);

    // 5. Generate RSS 2.0 Feed at public/tips/feed.xml and tips/feed.xml
    generateRssFeed(tips);

    console.log(`✅ Tips build complete: generated tips.html, ${tips.length} individual pages, search index, RSS feed (tips/feed.xml), and sitemap.xml.`);
}

function generateSitemap(tips) {
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

function generateRssFeed(tips) {
    const publicTipsDir = path.join(publicDir, 'tips');
    if (!fs.existsSync(publicTipsDir)) {
        fs.mkdirSync(publicTipsDir, { recursive: true });
    }
    if (!fs.existsSync(tipsOutDir)) {
        fs.mkdirSync(tipsOutDir, { recursive: true });
    }

    const latestTipDate = tips.length > 0 ? tips[0].date : new Date().toISOString();
    const lastBuildDate = new Date().toUTCString();
    const feedPubDate = toRfc822Date(latestTipDate);

    const itemsXml = tips.map(tip => {
        const canonicalUrl = `https://mrpunyapal.dev/tips/${tip.slug}`;

        // Deduplicate categories, subcategory, and tags
        const categorySet = new Set();
        if (tip.category) categorySet.add(tip.category);
        if (tip.subcategory) categorySet.add(tip.subcategory);
        if (Array.isArray(tip.tags)) {
            tip.tags.forEach(t => categorySet.add(t));
        }
        const categoriesXml = Array.from(categorySet)
            .map(cat => `      <category>${wrapCdata(cat)}</category>`)
            .join('\n');

        const updatedXml = tip.updated
            ? `\n      <atom:updated>${toRfc822Date(tip.updated)}</atom:updated>`
            : '';

        return `    <item>
      <title>${wrapCdata(tip.title)}</title>
      <link>${canonicalUrl}</link>
      <guid isPermaLink="true">${canonicalUrl}</guid>
      <description>${wrapCdata(tip.summary)}</description>
      <content:encoded>${wrapCdata(tip.htmlContent)}</content:encoded>
      <pubDate>${toRfc822Date(tip.date)}</pubDate>${updatedXml}
      <dc:creator>${wrapCdata(tip.author)}</dc:creator>
${categoriesXml}
    </item>`;
    }).join('\n');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/" 
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Punyapal Shah's Tips</title>
    <link>https://mrpunyapal.dev/tips</link>
    <description>Curated engineering tips, testing techniques, and idiomatic snippets for Laravel, Pest PHP, PHP, JavaScript, TypeScript, and Git by Punyapal Shah.</description>
    <language>en-us</language>
    <copyright>Copyright (c) Punyapal Shah</copyright>
    <pubDate>${feedPubDate}</pubDate>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="https://mrpunyapal.dev/tips/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>
`;

    const cleanXml = rssXml.replace(/\r\n/g, '\n');
    fs.writeFileSync(path.join(publicTipsDir, 'feed.xml'), cleanXml, 'utf-8');
    fs.writeFileSync(path.join(tipsOutDir, 'feed.xml'), cleanXml, 'utf-8');
}

function generateTipsHubPage(tips, categoryList, categoriesMap) {
    const tipsCardsHtml = tips.map((tip, idx) => {
        const badge = getCategoryBadge(tip.category);

        return `
            <div class="tip-card group relative p-6 bg-white dark:bg-slate-900/60 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-300 flex flex-col justify-between"
                data-category="${escapeHtml(tip.category)}"
                data-subcategory="${escapeHtml((tip.subcategory || '').toLowerCase())}"
                data-tags="${escapeHtml(tip.tags.join(' ').toLowerCase())}"
                data-title="${escapeHtml(tip.title.toLowerCase())}"
                data-summary="${escapeHtml(tip.summary.toLowerCase())}">
                
                <!-- 4-Corner Crosshair SVG Markers -->
                <div class="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10">
                    <svg aria-hidden="true" class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block">
                    <svg aria-hidden="true" class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div class="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10">
                    <svg aria-hidden="true" class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div class="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block">
                    <svg aria-hidden="true" class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>

                <div>
                    <div class="flex items-center gap-1.5 mb-2.5 flex-wrap">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}">
                            ${escapeHtml(tip.category)}
                        </span>
                        ${tip.subcategory ? `
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800">
                                ${escapeHtml(tip.subcategory)}
                            </span>
                        ` : ''}
                    </div>
                    <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug mb-2 tracking-tight">
                        <a href="/tips/${tip.slug}">
                            ${escapeHtml(tip.title)}
                        </a>
                    </h3>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        ${escapeHtml(tip.summary)}
                    </p>
                </div>

                <div class="pt-4 mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
                    <time datetime="${escapeHtml(tip.date)}" class="text-xs font-mono text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                        ${formatDate(tip.date)}
                    </time>
                    <a href="/tips/${tip.slug}" class="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 hover:text-red-700 transition-colors inline-flex items-center gap-1" aria-label="Read tip: ${escapeHtml(tip.title)}">
                        <span>READ</span>
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </a>
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
                <span class="text-[10px] px-1.5 py-0.2 rounded font-mono ${isAll ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}">${count}</span>
            </button>`;
    }).join('\n');

    const hubHtml = `<!DOCTYPE html>
<html lang="en" class="overflow-x-hidden">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tips | Punyapal Shah</title>

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
    <link rel="alternate" type="application/rss+xml" title="Punyapal Shah's Tips" href="https://mrpunyapal.dev/tips/feed.xml">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://mrpunyapal.dev/tips">
    <meta property="og:title" content="Tips | Punyapal Shah">
    <meta property="og:description"
        content="Curated engineering tips, testing techniques, and idiomatic snippets for Laravel, Pest PHP, PHP, JavaScript, TypeScript, and Git by Punyapal Shah.">
    <meta property="og:image" content="https://mrpunyapal.dev/og/tips.png">
    <meta property="og:image:secure_url" content="https://mrpunyapal.dev/og/tips.png">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Punyapal Shah - Tips">
    <meta property="og:site_name" content="Punyapal Shah">
    <meta property="og:locale" content="en_US">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@MrPunyapal">
    <meta name="twitter:creator" content="@MrPunyapal">
    <meta name="twitter:url" content="https://mrpunyapal.dev/tips">
    <meta name="twitter:title" content="Tips | Punyapal Shah">
    <meta name="twitter:description"
        content="Curated engineering tips, testing techniques, and idiomatic snippets for Laravel, Pest PHP, PHP, JavaScript, TypeScript, and Git by Punyapal Shah.">
    <meta name="twitter:image" content="https://mrpunyapal.dev/og/tips.png">
    <meta name="twitter:image:src" content="https://mrpunyapal.dev/og/tips.png">
    <meta name="twitter:image:alt" content="Punyapal Shah - Tips">

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": "https://mrpunyapal.dev/tips#webpage",
                "url": "https://mrpunyapal.dev/tips",
                "name": "Tips | Punyapal Shah",
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

    ${criticalGridStyles}

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
            <div class="tech-marker -top-[4px] -left-[4px]"></div>
            <div class="tech-marker -top-[4px] -right-[4px]"></div>
            <div class="tech-marker -bottom-[4px] -left-[4px]"></div>
            <div class="tech-marker -bottom-[4px] -right-[4px]"></div>

            <!-- Global Infinite Extensions -->
            <div class="tech-line-h top-[-1px]"></div>
            <div class="tech-line-h bottom-[-1px]"></div>

            <div class="tech-line-v-top left-[-1px]"></div>
            <div class="tech-line-v-top right-[-1px]"></div>

            <div class="tech-line-v-bottom left-[-1px]"></div>
            <div class="tech-line-v-bottom right-[-1px]"></div>

            <!-- Card Header: Top Nav Bar -->
            ${renderSiteHeader('tips')}

            <!-- Header Section -->
            <div class="p-6 sm:p-12 border-b border-slate-200 dark:border-slate-800 relative">
                <div class="tech-line-h bottom-[-1px]"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]"></div>

                <div class="animate-fade-up">
                    <div class="flex items-center justify-between gap-4 mb-4">
                        <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Tips
                        </h1>
                        <a href="/tips/feed.xml" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs font-mono group" aria-label="RSS Feed for Punyapal Shah's Tips">
                            <svg class="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20 5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18zM4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
                            </svg>
                            <span>RSS Feed</span>
                        </a>
                    </div>
                    <p class="text-lg text-red-600 dark:text-red-400 max-w-2xl font-mono">
                        Bite-sized engineering patterns, performance techniques, and idiomatic snippets.
                    </p>
                </div>

                <!-- Search & Filters -->
                <div class="mt-8 space-y-4 max-w-3xl">
                    <!-- Live Search Input + Filter Drawer Button -->
                    <div class="flex items-center gap-2.5">
                        <div class="relative flex-1">
                            <label for="tip-search" class="sr-only">Search tips</label>
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <input type="search" id="tip-search" placeholder="Search by keyword (e.g. sole, TIA, database, enum)..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-mono">
                        </div>

                        <button type="button" id="toggle-filter-btn" aria-expanded="false" aria-controls="filter-drawer-panel" class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shadow-xs group">
                            <svg class="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                            <span>Filters</span>
                            <span id="active-filter-badge" class="hidden text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-600 text-white font-bold">1</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Slide-over Filter Sidebar Drawer -->
            <div id="filter-drawer-backdrop" class="hidden fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs z-50 transition-opacity duration-300 opacity-0 pointer-events-none" aria-hidden="true"></div>

            <aside id="filter-drawer-panel" role="dialog" aria-modal="true" aria-label="Filters sidebar" class="hidden fixed top-0 bottom-0 right-0 h-screen h-dvh max-h-screen max-h-dvh w-full max-w-full sm:max-w-md md:max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col overflow-hidden">
                <!-- Drawer Header -->
                <div class="shrink-0 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div class="flex items-center gap-2.5">
                        <div class="p-1.5 rounded bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                        </div>
                        <h2 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">Filter Tips</h2>
                    </div>
                    <button type="button" id="close-filter-drawer-btn" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" aria-label="Close filters drawer">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <!-- Drawer Content -->
                <div class="flex-1 min-h-0 p-5 overflow-y-auto space-y-6 text-xs text-slate-900 dark:text-white">
                    <!-- Categories -->
                    <div>
                        <h3 class="text-xs font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Category</h3>
                        <div class="flex flex-wrap gap-2" id="sidebar-category-filters">
                            ${filterPillsHtml}
                        </div>
                    </div>

                    <!-- Subcategories -->
                    <div>
                        <h3 class="text-xs font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Subcategory</h3>
                        <div class="flex flex-wrap gap-1.5" id="sidebar-subcategory-filters">
                            <button type="button" class="subcat-filter-btn px-2.5 py-1 rounded text-[11px] font-mono font-medium border transition-all cursor-pointer active-subcat bg-red-600 text-white border-red-600 shadow-xs" data-subcat="All">
                                All
                            </button>
                            ${(() => {
                                const subcatMap = {};
                                tips.forEach(t => {
                                    if (!t.subcategory) return;
                                    if (!subcatMap[t.subcategory]) subcatMap[t.subcategory] = new Set();
                                    subcatMap[t.subcategory].add(t.category);
                                });
                                return Object.keys(subcatMap).sort().map(subcat => {
                                    const cats = Array.from(subcatMap[subcat]).join(',');
                                    return `
                                        <button type="button" class="subcat-filter-btn px-2.5 py-1 rounded text-[11px] font-mono font-medium border bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer whitespace-nowrap" data-subcat="${escapeHtml(subcat)}" data-categories="${escapeHtml(cats)}">
                                            ${escapeHtml(subcat)}
                                        </button>`;
                                }).join('');
                            })()}
                        </div>
                    </div>
                </div>

                <!-- Drawer Footer -->
                <div class="shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 backdrop-blur-xs">
                    <button type="button" id="sidebar-reset-btn" class="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                        Reset Filters
                    </button>
                    <button type="button" id="sidebar-apply-btn" class="px-4 py-2 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-xs">
                        Done
                    </button>
                </div>
            </aside>

            <!-- Tips Grid Section (Signature 2-Column Crosshair Grid) -->
            <section class="border-b border-slate-200 dark:border-slate-800 relative">
                <div class="tech-line-h bottom-[-1px]"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]"></div>

                <div id="tips-container" class="grid grid-cols-1 md:grid-cols-2 border-l border-slate-200 dark:border-slate-800">
                    ${tipsCardsHtml}
                </div>

                <!-- Empty State (hidden by default) -->
                <div id="empty-state" class="hidden p-12 text-center border-t border-slate-200 dark:border-slate-800">
                    <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-base font-semibold text-slate-900 dark:text-white mb-1">No matching tips found</h3>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">Try adjusting your search query or choosing another category/subcategory filter.</p>
                    <button type="button" id="reset-filters-btn" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer">
                        Reset Filters
                    </button>
                </div>
            </section>

        </div>

        <!-- Footer -->
        <div class="w-full max-w-5xl py-6 text-center mt-[-1px] print:hidden">
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
            const categoryFilterBtns = document.querySelectorAll('.filter-btn');
            const subcategoryFilterBtns = document.querySelectorAll('.subcat-filter-btn');
            const cards = document.querySelectorAll('.tip-card');
            const emptyState = document.getElementById('empty-state');
            const resetBtn = document.getElementById('reset-filters-btn');
            const sidebarResetBtn = document.getElementById('sidebar-reset-btn');

            // Drawer elements
            const toggleFilterBtn = document.getElementById('toggle-filter-btn');
            const closeFilterBtn = document.getElementById('close-filter-drawer-btn');
            const applyFilterBtn = document.getElementById('sidebar-apply-btn');
            const drawerBackdrop = document.getElementById('filter-drawer-backdrop');
            const drawerPanel = document.getElementById('filter-drawer-panel');
            const activeFilterBadge = document.getElementById('active-filter-badge');

            let activeCategory = 'All';
            let activeSubcategory = 'All';

            function openDrawer() {
                drawerBackdrop.classList.remove('hidden');
                drawerPanel.classList.remove('hidden');
                // Force browser reflow to trigger CSS transition smoothly
                void drawerPanel.offsetWidth;
                drawerBackdrop.classList.remove('opacity-0', 'pointer-events-none');
                drawerPanel.classList.remove('translate-x-full');
                if (toggleFilterBtn) toggleFilterBtn.setAttribute('aria-expanded', 'true');
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';
            }

            function closeDrawer() {
                drawerBackdrop.classList.add('opacity-0', 'pointer-events-none');
                drawerPanel.classList.add('translate-x-full');
                if (toggleFilterBtn) toggleFilterBtn.setAttribute('aria-expanded', 'false');
                document.documentElement.style.overflow = '';
                document.body.style.overflow = '';
                setTimeout(() => {
                    if (drawerPanel.classList.contains('translate-x-full')) {
                        drawerBackdrop.classList.add('hidden');
                        drawerPanel.classList.add('hidden');
                    }
                }, 300);
            }

            if (toggleFilterBtn) toggleFilterBtn.addEventListener('click', openDrawer);
            if (closeFilterBtn) closeFilterBtn.addEventListener('click', closeDrawer);
            if (applyFilterBtn) applyFilterBtn.addEventListener('click', closeDrawer);
            if (drawerBackdrop) {
                drawerBackdrop.addEventListener('click', closeDrawer);
                drawerBackdrop.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
                drawerBackdrop.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !drawerPanel.classList.contains('translate-x-full')) {
                    closeDrawer();
                }
            });

            function updateFilterBadge() {
                let count = 0;
                if (activeCategory !== 'All') count++;
                if (activeSubcategory !== 'All') count++;

                if (count > 0 && activeFilterBadge) {
                    activeFilterBadge.textContent = count;
                    activeFilterBadge.classList.remove('hidden');
                } else if (activeFilterBadge) {
                    activeFilterBadge.classList.add('hidden');
                }
            }

            function filterCards() {
                const query = searchInput.value.toLowerCase().trim();
                let visibleCount = 0;

                cards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    const subcategory = card.getAttribute('data-subcategory') || '';
                    const tags = card.getAttribute('data-tags');
                    const title = card.getAttribute('data-title');
                    const summary = card.getAttribute('data-summary');

                    const matchesCategory = (activeCategory === 'All' || category === activeCategory);
                    const matchesSubcategory = (activeSubcategory === 'All' || subcategory.toLowerCase() === activeSubcategory.toLowerCase());

                    const matchesQuery = !query || 
                        title.includes(query) || 
                        summary.includes(query) || 
                        tags.includes(query) || 
                        category.toLowerCase().includes(query) ||
                        subcategory.includes(query);

                    if (matchesCategory && matchesSubcategory && matchesQuery) {
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

                updateFilterBadge();
            }

            function updateSubcategoryVisibility() {
                let currentSubcatValid = (activeSubcategory === 'All');

                subcategoryFilterBtns.forEach(btn => {
                    const subcat = btn.getAttribute('data-subcat');
                    if (subcat === 'All') {
                        btn.style.display = 'inline-flex';
                        return;
                    }
                    const cats = (btn.getAttribute('data-categories') || '').split(',');
                    if (activeCategory === 'All' || cats.includes(activeCategory)) {
                        btn.style.display = 'inline-flex';
                        if (subcat.toLowerCase() === activeSubcategory.toLowerCase()) {
                            currentSubcatValid = true;
                        }
                    } else {
                        btn.style.display = 'none';
                    }
                });

                if (!currentSubcatValid) {
                    activeSubcategory = 'All';
                    subcategoryFilterBtns.forEach(b => {
                        if (b.getAttribute('data-subcat') === 'All') {
                            b.classList.add('active-subcat', 'bg-red-600', 'text-white', 'border-red-600', 'shadow-xs');
                            b.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                        } else {
                            b.classList.remove('active-subcat', 'bg-red-600', 'text-white', 'border-red-600', 'shadow-xs');
                            b.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                        }
                    });
                }
            }

            categoryFilterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    activeCategory = btn.getAttribute('data-filter');
                    
                    categoryFilterBtns.forEach(b => {
                        if (b.getAttribute('data-filter') === activeCategory) {
                            b.classList.add('active-filter', 'bg-red-600', 'text-white', 'border-red-600', 'shadow-sm');
                            b.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                            const badge = b.querySelector('span:last-child');
                            if (badge) {
                                badge.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-500', 'dark:text-slate-400');
                                badge.classList.add('bg-white', 'text-red-700', 'font-bold');
                            }
                        } else {
                            b.classList.remove('active-filter', 'bg-red-600', 'text-white', 'border-red-600', 'shadow-sm');
                            b.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                            const badge = b.querySelector('span:last-child');
                            if (badge) {
                                badge.classList.remove('bg-white', 'text-red-700', 'font-bold');
                                badge.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-500', 'dark:text-slate-400');
                            }
                        }
                    });

                    updateSubcategoryVisibility();
                    filterCards();
                });
            });

            subcategoryFilterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    activeSubcategory = btn.getAttribute('data-subcat');

                    subcategoryFilterBtns.forEach(b => {
                        if (b.getAttribute('data-subcat') === activeSubcategory) {
                            b.classList.add('active-subcat', 'bg-red-600', 'text-white', 'border-red-600', 'shadow-xs');
                            b.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                        } else {
                            b.classList.remove('active-subcat', 'bg-red-600', 'text-white', 'border-red-600', 'shadow-xs');
                            b.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                        }
                    });

                    filterCards();
                });
            });

            if (searchInput) {
                searchInput.addEventListener('input', filterCards);
            }

            function resetAllFilters() {
                searchInput.value = '';
                activeSubcategory = 'All';

                const allCatBtn = document.querySelector('[data-filter="All"]');
                if (allCatBtn) allCatBtn.click();

                const allSubcatBtn = document.querySelector('[data-subcat="All"]');
                if (allSubcatBtn) allSubcatBtn.click();
            }

            if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
            if (sidebarResetBtn) sidebarResetBtn.addEventListener('click', resetAllFilters);

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

    fs.writeFileSync(path.join(rootDir, 'tips.html'), hubHtml.replace(/\r\n/g, '\n'), 'utf-8');
}

function generateSingleTipPage(tip, allTips) {
    const badge = getCategoryBadge(tip.category);
    const relatedTips = allTips
        .filter(t => t.slug !== tip.slug && (t.category === tip.category || t.tags.some(tag => tip.tags.includes(tag))))
        .slice(0, 2);

    const relatedHtml = relatedTips.length > 0 ? `
        <div class="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h2 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Related Tips</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 border-t border-l border-slate-200 dark:border-slate-800">
                ${relatedTips.map(r => `
                <a href="/tips/${r.slug}" class="group relative p-5 bg-white dark:bg-slate-900/60 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-300 flex items-center justify-between gap-3">
                    <!-- Corner Crosshairs -->
                    <div class="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10">
                        <svg aria-hidden="true" class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                    </div>
                    <div class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden sm:block">
                        <svg aria-hidden="true" class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                    </div>
                    <div class="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10">
                        <svg aria-hidden="true" class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                    </div>
                    <div class="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden sm:block">
                        <svg aria-hidden="true" class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                    </div>

                    <h3 class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug tracking-tight">
                        ${escapeHtml(r.title)}
                    </h3>
                    <span class="text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
                </a>`).join('')}
            </div>
        </div>
    ` : '';

    const authorHtml = tip.author_url
        ? `<a href="${escapeHtml(tip.author_url)}" target="_blank" rel="noopener noreferrer" class="hover:text-red-600 dark:hover:text-red-400 transition-colors font-semibold">${escapeHtml(tip.author)}</a>`
        : `<span class="font-semibold">${escapeHtml(tip.author)}</span>`;

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
    <link rel="alternate" type="application/rss+xml" title="Punyapal Shah's Tips" href="https://mrpunyapal.dev/tips/feed.xml">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://mrpunyapal.dev/tips/${tip.slug}">
    <meta property="og:title" content="${escapeHtml(tip.title)} | Punyapal Shah">
    <meta property="og:description" content="${escapeHtml(tip.summary)}">
    <meta property="og:image" content="${escapeHtml(tip.og_image)}">
    <meta property="og:image:secure_url" content="${escapeHtml(tip.og_image)}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escapeHtml(tip.title)} - Punyapal Shah">
    <meta property="og:site_name" content="Punyapal Shah">
    <meta property="og:locale" content="en_US">
    <meta property="article:published_time" content="${escapeHtml(tip.date)}">
    <meta property="article:author" content="${escapeHtml(tip.author_url || 'https://mrpunyapal.dev/#person')}">
    <meta property="article:section" content="${escapeHtml(tip.category)}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@MrPunyapal">
    <meta name="twitter:creator" content="@MrPunyapal">
    <meta name="twitter:url" content="https://mrpunyapal.dev/tips/${tip.slug}">
    <meta name="twitter:title" content="${escapeHtml(tip.title)} | Punyapal Shah">
    <meta name="twitter:description" content="${escapeHtml(tip.summary)}">
    <meta name="twitter:image" content="${escapeHtml(tip.og_image)}">
    <meta name="twitter:image:alt" content="${escapeHtml(tip.title)} - Punyapal Shah">

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
                    "@type": "Person",
                    "name": "${escapeHtml(tip.author)}"${tip.author_url ? `,\n                    "url": "${escapeHtml(tip.author_url)}"` : ''}
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

    ${criticalGridStyles}

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
            <div class="tech-marker -top-[4px] -left-[4px]"></div>
            <div class="tech-marker -top-[4px] -right-[4px]"></div>
            <div class="tech-marker -bottom-[4px] -left-[4px]"></div>
            <div class="tech-marker -bottom-[4px] -right-[4px]"></div>

            <!-- Global Infinite Extensions -->
            <div class="tech-line-h top-[-1px]"></div>
            <div class="tech-line-h bottom-[-1px]"></div>

            <div class="tech-line-v-top left-[-1px]"></div>
            <div class="tech-line-v-top right-[-1px]"></div>

            <div class="tech-line-v-bottom left-[-1px]"></div>
            <div class="tech-line-v-bottom right-[-1px]"></div>

            <!-- Card Header: Top Nav Bar -->
            ${renderSiteHeader('tips')}

            <!-- Tip Article Header Section -->
            <div class="p-6 sm:p-12 border-b border-slate-200 dark:border-slate-800 relative">
                <div class="tech-line-h bottom-[-1px]"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]"></div>

                <!-- Breadcrumbs & Category Badge -->
                <div class="flex items-center justify-between gap-4 mb-6">
                    <a href="/tips" class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">
                        <svg class="icon text-xs" viewBox="0 0 448 512" aria-hidden="true"><use href="#i-arrow-left"/></svg>
                        <span>Back to All Tips</span>
                    </a>

                    <div class="inline-flex items-center gap-1.5 flex-wrap">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}">
                            ${escapeHtml(tip.category)}
                        </span>
                        ${tip.subcategory ? `
                            <span class="text-slate-400 dark:text-slate-600 text-xs font-mono select-none" aria-hidden="true">/</span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800">
                                ${escapeHtml(tip.subcategory)}
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Title & Meta -->
                <div class="animate-fade-up">
                    <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug mb-3">
                        ${escapeHtml(tip.title)}
                    </h1>

                    <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                        <span class="inline-flex items-center gap-1.5">
                            <svg class="icon text-xs opacity-70" viewBox="0 0 448 512" aria-hidden="true"><use href="#i-user"/></svg>
                            ${authorHtml}
                        </span>
                        <span class="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>
                        <time datetime="${escapeHtml(tip.date)}" class="inline-flex items-center gap-1.5">
                            <svg class="icon text-xs opacity-70" viewBox="0 0 448 512" aria-hidden="true"><use href="#i-calendar"/></svg>
                            ${formatDate(tip.date)}
                        </time>
                    </div>
                </div>
            </div>

            <!-- Tip Article Content Body -->
            <article class="p-6 sm:p-12 relative border-b border-slate-200 dark:border-slate-800">
                <div class="tech-line-h bottom-[-1px]"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]"></div>

                <!-- Main Tip Content -->
                <div class="tip-content max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                    ${tip.htmlContent}
                </div>

                <!-- Tag Cloud & Inline Share Actions -->
                <div class="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 inline-flex items-center gap-1.5 font-mono">
                            <svg class="icon text-xs" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-tag"/></svg>
                            Tags:
                        </span>
                        ${tip.tags.map(t => `<span class="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded ${badge.bg} ${badge.text} border ${badge.border}">#${escapeHtml(t)}</span>`).join(' ')}
                    </div>

                    <div class="flex items-center gap-2">
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(tip.title + ' by @MrPunyapal')}&url=${encodeURIComponent('https://mrpunyapal.dev/tips/' + tip.slug)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-[11px] font-bold uppercase tracking-wider" aria-label="Share this tip on X">
                            <svg class="icon text-[11px]" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-x-twitter"/></svg>
                            <span>Share on X</span>
                        </a>
                        <button type="button" id="share-link-btn" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-[11px] font-bold uppercase tracking-wider cursor-pointer" aria-label="Copy page link">
                            <svg class="icon text-[11px]" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-share"/></svg>
                            <span id="share-link-text">Copy Link</span>
                        </button>
                    </div>
                </div>

                <!-- Related Tips -->
                ${relatedHtml}
            </article>
        </div>

        <!-- Footer -->
        <div class="w-full max-w-5xl py-6 text-center mt-[-1px] z-10 print:hidden">
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

    fs.writeFileSync(path.join(tipsOutDir, `${tip.slug}.html`), singleTipHtml.replace(/\r\n/g, '\n'), 'utf-8');
}

// Run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    buildTips();
}
