import fs from 'node:fs';
import { marked, Marked } from 'marked';
import hljs from 'highlight.js';

// Normalize date value (handling strings and Date objects from gray-matter)
export function normalizeDateStr(val) {
    if (!val) return null;
    if (val instanceof Date) {
        return val.toISOString().split('T')[0];
    }
    return String(val).trim();
}

// Centralized effective date helper: effectiveDate = updated_at ?? created_at
export function getTipEffectiveDate(tipOrDate, fallbackDate = '') {
    if (!tipOrDate) return normalizeDateStr(fallbackDate) || '';
    if (typeof tipOrDate === 'object' && !(tipOrDate instanceof Date)) {
        const updated = tipOrDate.updated_at || tipOrDate.updated || tipOrDate.last_updated;
        const created = tipOrDate.created_at || tipOrDate.date;
        return normalizeDateStr(updated) || normalizeDateStr(created) || normalizeDateStr(fallbackDate) || '';
    }
    return normalizeDateStr(tipOrDate) || normalizeDateStr(fallbackDate) || '';
}

// Format date helper: "2026-07-20" -> "Jul 20, 2026"
export function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
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

// Estimate reading time in minutes (minimum 1)
export function estimateReadingTime(markdownText) {
    if (!markdownText) return 1;
    const cleanText = markdownText
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`.*?`/g, ' ')
        .replace(/#+/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[^\w\s]/g, ' ');
    const words = cleanText.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 180));
}

// Extract summary: explicit from frontmatter or first 160 characters of clean text
export function extractSummary(markdownBody, explicitSummary) {
    if (explicitSummary && String(explicitSummary).trim()) {
        return String(explicitSummary).trim();
    }
    const clean = (markdownBody || '')
        .replace(/^>.*$/gm, '')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`.*?`/g, '')
        .replace(/#+\s+.*$/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!clean) return '';
    return clean.length > 160 ? clean.slice(0, 157).trim() + '...' : clean;
}

// Escape HTML entities
export function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Escape JSON string for inline JSON-LD script tags
export function escapeJsonStr(text) {
    if (text === null || text === undefined) return '';
    return JSON.stringify(String(text)).slice(1, -1);
}

// Format category string
export function formatCategory(cat) {
    if (!cat) return 'Laravel';
    const c = String(cat).trim();
    const map = {
        'laravel': 'Laravel',
        'php': 'PHP',
        'pest': 'Pest PHP',
        'pest-php': 'Pest PHP',
        'css': 'CSS',
        'git': 'Git',
        'livewire': 'Livewire',
        'mysql': 'MySQL',
        'filament': 'Filament',
        'tailwind-css': 'Tailwind CSS',
        'tailwind': 'Tailwind CSS',
    };
    return map[c.toLowerCase()] || (c.charAt(0).toUpperCase() + c.slice(1));
}

// Format subcategory string
export function formatSubcategory(subcat) {
    if (!subcat) return null;
    const s = String(subcat).trim();
    const map = {
        'eloquent': 'Eloquent',
        'architecture': 'Architecture',
        'workflow': 'Workflow',
        'github-actions': 'GitHub Actions',
        'http-api': 'HTTP & API',
        'utilities': 'Utilities',
        'validation': 'Validation',
        'queue': 'Queue',
        'testing': 'Testing',
        'tooling': 'Tooling',
        'styling': 'Styling',
        'performance': 'Performance',
        'cache': 'Cache',
        'database': 'Database',
        'components': 'Components',
        'queries': 'Queries',
        'plugins': 'Plugins',
        'basics': 'Basics',
        'configuration': 'Configuration',
        'collections': 'Collections',
        'events': 'Events',
    };
    return map[s.toLowerCase()] || (s.charAt(0).toUpperCase() + s.slice(1));
}

// Get category badge color scheme
export function getCategoryBadge(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('laravel')) {
        return {
            bg: 'bg-red-50 dark:bg-red-950/40',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-200 dark:border-red-900/50',
        };
    }
    if (cat === 'php') {
        return {
            bg: 'bg-indigo-50 dark:bg-indigo-950/40',
            text: 'text-indigo-600 dark:text-indigo-400',
            border: 'border-indigo-200 dark:border-indigo-900/50',
        };
    }
    if (cat.includes('pest')) {
        return {
            bg: 'bg-pink-50 dark:bg-pink-950/40',
            text: 'text-pink-600 dark:text-pink-400',
            border: 'border-pink-200 dark:border-pink-900/50',
        };
    }
    if (cat.includes('livewire')) {
        return {
            bg: 'bg-pink-50 dark:bg-pink-950/40',
            text: 'text-pink-600 dark:text-pink-400',
            border: 'border-pink-200 dark:border-pink-900/50',
        };
    }
    if (cat.includes('git')) {
        return {
            bg: 'bg-emerald-50 dark:bg-emerald-950/40',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-900/50',
        };
    }
    if (cat.includes('css') || cat.includes('tailwind')) {
        return {
            bg: 'bg-cyan-50 dark:bg-cyan-950/40',
            text: 'text-cyan-600 dark:text-cyan-400',
            border: 'border-cyan-200 dark:border-cyan-900/50',
        };
    }
    if (cat.includes('mysql') || cat.includes('database')) {
        return {
            bg: 'bg-blue-50 dark:bg-blue-950/40',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-900/50',
        };
    }
    if (cat.includes('filament')) {
        return {
            bg: 'bg-amber-50 dark:bg-amber-950/40',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-900/50',
        };
    }
    return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
    };
}

// Custom renderer for marked
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }) {
    const language = lang || 'php';
    let highlightedCode = '';

    if (language && hljs.getLanguage(language)) {
        try {
            highlightedCode = hljs.highlight(text, { language }).value;
        } catch {
            highlightedCode = escapeHtml(text);
        }
    } else {
        try {
            highlightedCode = hljs.highlightAuto(text).value;
        } catch {
            highlightedCode = escapeHtml(text);
        }
    }

    return `
<div class="code-block-wrapper my-6 rounded-2xl border border-[#d0d7de] dark:border-[#262626] bg-white dark:bg-[#121212] text-[#24292e] dark:text-[#c9d1d9] overflow-hidden text-xs sm:text-sm font-mono shadow-sm relative group">
    <div class="flex items-center justify-between px-4 py-3 bg-[#f6f8fa] dark:bg-[#181818] border-b border-[#d0d7de] dark:border-[#262626] select-none">
        <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-[#d0d7de] dark:bg-[#262626] inline-block" aria-hidden="true"></span>
            <span class="w-3 h-3 rounded-full bg-[#d0d7de] dark:bg-[#262626] inline-block" aria-hidden="true"></span>
            <span class="w-3 h-3 rounded-full bg-[#d0d7de] dark:bg-[#262626] inline-block" aria-hidden="true"></span>
        </div>
        <button type="button" class="copy-code-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#d0d7de] dark:border-[#262626] bg-white dark:bg-[#1c1c1c] hover:bg-[#f3f4f6] dark:hover:bg-[#262626] text-[#57606a] dark:text-[#8b949e] hover:text-[#24292e] dark:hover:text-[#c9d1d9] transition-colors text-xs font-medium cursor-pointer" data-code="${escapeHtml(text)}" aria-label="Copy code to clipboard">
            <svg class="w-3.5 h-3.5 opacity-70" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <span class="copy-label">Copy</span>
        </button>
    </div>
    <pre class="p-5 sm:p-6 overflow-x-auto leading-relaxed bg-white dark:bg-[#121212]"><code class="hljs language-${escapeHtml(language)}">${highlightedCode}</code></pre>
</div>`;
};

renderer.heading = function(token) {
    const headingLevel = Math.min(token.depth + 1, 6);
    const classes = {
        2: 'text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4 tracking-tight',
        3: 'text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight',
        4: 'text-base sm:text-lg font-semibold text-slate-900 dark:text-white mt-4 mb-2',
    }[headingLevel] || 'text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2';

    const content = token.tokens ? this.parser.parseInline(token.tokens) : (token.text || '');
    return `<h${headingLevel} class="${classes}">${content}</h${headingLevel}>`;
};

renderer.paragraph = function(token) {
    const content = token.tokens ? this.parser.parseInline(token.tokens) : (token.text || token);
    return `<p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed my-3">${content}</p>`;
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
    let content = '';
    if (item.tokens && item.tokens.length > 0) {
        if (item.loose || item.tokens.length > 1) {
            content = this.parser.parse(item.tokens);
        } else {
            content = this.parser.parseInline(item.tokens[0]?.tokens || item.tokens);
        }
    } else {
        content = item.text || item.raw || '';
    }
    return `<li class="leading-relaxed"><span class="align-middle">${content}</span></li>`;
};

renderer.blockquote = function(token) {
    const content = token.tokens ? this.parser.parse(token.tokens) : (token.text || token);
    return `<blockquote class="mb-8 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-red-500 bg-slate-50/70 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-mono text-xs sm:text-sm leading-relaxed [&>p]:m-0">${content}</blockquote>`;
};

renderer.link = function(token) {
    const href = token.href || '';
    const content = token.tokens ? this.parser.parseInline(token.tokens) : (token.text || '');
    const isExternal = href.startsWith('http') || href.startsWith('//');
    const rel = isExternal ? ' rel="noopener noreferrer"' : '';
    const target = isExternal ? ' target="_blank"' : '';
    return `<a href="${escapeHtml(href)}"${target}${rel} class="text-red-600 dark:text-red-400 hover:underline font-semibold">${content}</a>`;
};

renderer.codespan = function(token) {
    const text = typeof token === 'object' ? token.text : token;
    return `<code class="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 font-medium">${escapeHtml(text)}</code>`;
};

renderer.hr = function() {
    return `<hr class="my-8 border-slate-200 dark:border-slate-800">`;
};

renderer.table = function(token) {
    let t = '', n = '';
    for (let r = 0; r < token.header.length; r++) n += this.tablecell(token.header[r]);
    t += this.tablerow({ text: n });
    let i = '';
    for (let r = 0; r < token.rows.length; r++) {
        let o = token.rows[r];
        n = '';
        for (let s = 0; s < o.length; s++) n += this.tablecell(o[s]);
        i += this.tablerow({ text: n });
    }
    if (i) i = `<tbody>${i}</tbody>`;
    return `<div class="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-800"><table class="w-full text-left border-collapse">\n<thead>\n${t}</thead>\n${i}</table>\n</div>`;
};

marked.use({ renderer });
export { marked };

// Clean semantic HTML renderer for RSS feed (no Tailwind classes, no copy buttons, no hljs span tags)
const rssMarked = new Marked();
const rssRenderer = new rssMarked.Renderer();

rssRenderer.code = function({ text, lang }) {
    const language = lang || '';
    const langClass = language ? ` class="language-${escapeHtml(language)}"` : '';
    return `<pre><code${langClass}>${escapeHtml(text)}</code></pre>`;
};
rssMarked.use({ renderer: rssRenderer });

export function renderRssHtml(markdown) {
    return rssMarked.parse(markdown || '');
}

// Write file only when content has changed (preserves timestamps and caches)
export function writeFileIfChanged(filePath, newContent) {
    if (fs.existsSync(filePath)) {
        const existing = fs.readFileSync(filePath, 'utf-8');
        if (existing.replace(/\r\n/g, '\n') === newContent.replace(/\r\n/g, '\n')) {
            return false;
        }
    }
    fs.writeFileSync(filePath, newContent, 'utf-8');
    return true;
}
