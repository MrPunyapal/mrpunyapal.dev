import { marked } from 'marked';
import hljs from 'highlight.js';

// Format date helper: "2026-07-20" -> "Jul 20, 2026"
export function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format RFC 822 / RFC 1123 date helper for RSS feed
export function toRfc822Date(dateStr) {
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
export function wrapCdata(text) {
    if (text === null || text === undefined) return '<![CDATA[]]>';
    return `<![CDATA[${String(text).replace(/\]\]>/g, ']]>]]&gt;<![CDATA[')}]]>`;
}

// Slugify helper
export function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Extract plain text summary from markdown for SEO description
export function extractSummary(markdownContent, manualSummary) {
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
export function getCategoryBadge(category) {
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
export function escapeHtml(text) {
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
export { marked };

// Critical Grid & Marker Styles exactly matching index.html
export const criticalGridStyles = `
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
export const iconSprite = `
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
