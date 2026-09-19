import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { Marked } from 'marked';
import hljs from 'highlight.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const tipsContentDir = path.resolve(rootDir, 'content', 'tips', 'content');
const tipsOutputDir = path.resolve(rootDir, 'tips');
const publicDir = path.resolve(rootDir, 'public');

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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

function getReadingTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min read`;
}

function getCategoryBadge(category) {
  const cat = (category || 'Laravel').toLowerCase();
  switch (cat) {
    case 'laravel':
      return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60';
    case 'php':
      return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60';
    case 'git':
      return 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60';
    case 'livewire':
      return 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-900/60';
    case 'css':
      return 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/60';
    case 'testing':
    case 'pest php':
    case 'pest':
      return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/60';
    case 'mysql':
      return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

function createMarkedParser() {
  return new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      code({ text, lang }) {
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

        const langDisplay = validLang || lang || 'code';

        return `<div class="code-block-wrapper my-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-hidden">
  <div class="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-xs font-mono text-slate-500 dark:text-slate-400">
    <span class="font-semibold uppercase tracking-wider">${escapeHtml(langDisplay)}</span>
    <button type="button" class="copy-code-btn px-2.5 py-1 text-xs font-medium rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer" aria-label="Copy code to clipboard">
      <svg class="copy-icon" width="12" height="12" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M384 336H192c-8.8 0-16-7.2-16-16V64c0-8.8 7.2-16 16-16l140.1 0L384 99.9V320c0 8.8-7.2 16-16 16zM192 0C156.7 0 128 28.7 128 64V320c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-17-6.7-33.3-18.7-45.3L381.3 18.7C369.3 6.7 353 0 336 0H192zM64 128c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H256c35.3 0 64-28.7 64-64V416H272v32c0 8.8-7.2 16-16 16H64c-8.8 0-16-7.2-16-16V192c0-8.8 7.2-16 16-16h32V128H64z"/></svg>
      <span class="copy-text">Copy</span>
    </button>
  </div>
  <div class="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
    <pre><code class="hljs ${validLang ? 'language-' + validLang : ''}">${highlighted}</code></pre>
  </div>
</div>`;
      },
      table({ header, rows }) {
        return `<div class="overflow-x-auto my-6 border border-slate-200 dark:border-slate-800 rounded-lg"><table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm text-left"><thead class="bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white">${header}</thead><tbody class="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60">${rows}</tbody></table></div>`;
      }
    }
  });
}

function parseTip(filePath) {
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(rawContent);
  const slug = path.basename(filePath, '.md');
  const relPath = path.relative(path.resolve(rootDir, 'content', 'tips'), filePath).replace(/\\/g, '/');

  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;

  const quoteMatch = content.match(/^>\s*(.+)$/m);
  const description = quoteMatch
    ? quoteMatch[1].replace(/[`*_[\]]/g, '').trim()
    : 'Developer tip by Punyapal Shah.';

  let bodyMarkdown = content;
  if (titleMatch) {
    bodyMarkdown = bodyMarkdown.replace(titleMatch[0], '');
  }
  if (quoteMatch) {
    bodyMarkdown = bodyMarkdown.replace(quoteMatch[0], '');
  }

  const category = data.category || 'Laravel';
  const subcategory = data.subcategory || '';
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const date = data.date ? String(data.date).trim() : '';

  return {
    slug,
    title,
    description,
    category,
    subcategory,
    tags,
    date,
    formattedDate: formatDate(date),
    author: data.author || 'Punyapal Shah',
    authorUrl: data.author_url || 'https://x.com/MrPunyapal',
    relPath,
    bodyMarkdown: bodyMarkdown.trim(),
    readingTime: getReadingTime(content),
  };
}

function renderTipDetailPage(tip, prevTip, nextTip, marked) {
  const htmlContent = marked.parse(tip.bodyMarkdown);
  const categoryBadgeClass = getCategoryBadge(tip.category);
  const ogImage = `https://mrpunyapal.dev/og/tips/${tip.slug}.png`;
  const canonicalUrl = `https://mrpunyapal.dev/tips/${tip.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${canonicalUrl}#article`,
        "isPartOf": {
          "@id": "https://mrpunyapal.dev/#website"
        },
        "headline": tip.title,
        "description": tip.description,
        "url": canonicalUrl,
        "datePublished": tip.date,
        "dateModified": tip.date,
        "image": ogImage,
        "author": {
          "@id": "https://mrpunyapal.dev/#person"
        },
        "publisher": {
          "@id": "https://mrpunyapal.dev/#person"
        },
        "inLanguage": "en"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
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
            "name": tip.category,
            "item": "https://mrpunyapal.dev/tips"
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": tip.title,
            "item": canonicalUrl
          }
        ]
      }
    ]
  };

  const tagsHtml = tip.tags.map(tag =>
    `<span class="px-2 py-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded">${escapeHtml(tag)}</span>`
  ).join('\n                                ');

  const githubEditUrl = `https://github.com/MrPunyapal/tips/blob/main/${tip.relPath}`;

  const prevNavHtml = prevTip ? `
                    <a href="/tips/${prevTip.slug}" class="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group flex flex-col justify-between">
                        <span class="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
                            <svg class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" width="14" height="14" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg>
                            <span>Previous Tip</span>
                        </span>
                        <span class="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">${escapeHtml(prevTip.title)}</span>
                    </a>` : `<div></div>`;

  const nextNavHtml = nextTip ? `
                    <a href="/tips/${nextTip.slug}" class="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group flex flex-col justify-between text-right">
                        <span class="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1.5 mb-1.5">
                            <span>Next Tip</span>
                            <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" width="14" height="14" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg>
                        </span>
                        <span class="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">${escapeHtml(nextTip.title)}</span>
                    </a>` : `<div></div>`;

  return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(tip.title)} | Punyapal Shah</title>

    <!-- Browser and Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=optional">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#FF2D20">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="Permissions-Policy" content="interest-cohort=()">

    <!-- Primary Meta Tags -->
    <meta name="description" content="${escapeHtml(tip.description)}">
    <meta name="author" content="${escapeHtml(tip.author)}">
    <link rel="canonical" href="${canonicalUrl}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${escapeHtml(tip.title)} | Punyapal Shah">
    <meta property="og:description" content="${escapeHtml(tip.description)}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:secure_url" content="${ogImage}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escapeHtml(tip.title)}">
    <meta property="og:site_name" content="Punyapal Shah">
    <meta property="og:locale" content="en_US">
    <meta property="article:published_time" content="${tip.date}">
    <meta property="article:author" content="https://mrpunyapal.dev/#person">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@MrPunyapal">
    <meta name="twitter:creator" content="@MrPunyapal">
    <meta name="twitter:url" content="${canonicalUrl}">
    <meta name="twitter:title" content="${escapeHtml(tip.title)} | Punyapal Shah">
    <meta name="twitter:description" content="${escapeHtml(tip.description)}">
    <meta name="twitter:image" content="${ogImage}">
    <meta name="twitter:image:src" content="${ogImage}">
    <meta name="twitter:image:alt" content="${escapeHtml(tip.title)}">

    <!-- Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 4)}
    </script>

    <!-- Favicon and Icons -->
    <link rel="icon" href="/favicon.png" type="image/png" sizes="128x128">
    <link rel="apple-touch-icon" href="/favicon.png">
    <meta name="msapplication-TileColor" content="#FF2D20">

    <link rel="stylesheet" href="/src/tailwind.css">
    <link rel="stylesheet" href="/src/app.css">
    <script type="module" src="/src/main.js"></script>

    <style>
        body {
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }

        .dark body {
            background: #0a0a0a !important;
            color: #f4f4f5 !important;
        }

        html {
            scroll-behavior: smooth;
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

        .tech-line-v-top {
            position: absolute;
            width: 1px;
            background-color: #e2e8f0;
            z-index: 0;
            pointer-events: none;
            bottom: 100%;
            height: 100vh;
        }

        .tech-line-v-bottom {
            position: absolute;
            width: 1px;
            background-color: #e2e8f0;
            z-index: 0;
            pointer-events: none;
            top: 100%;
            height: 120px;
        }
    </style>
</head>

<body class="font-sans m-0 p-0 min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed relative antialiased transition-colors duration-200">

    <!-- Main Content Container -->
    <main class="min-h-screen flex flex-col items-center px-3 sm:px-6 pt-1 sm:pt-2 pb-8 sm:pb-12 gap-8">
        <div class="w-full max-w-4xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10">

            <!-- Tech Markers: Corners -->
            <div class="tech-marker -top-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -top-[4px] -right-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

            <!-- Global Extensions -->
            <div class="tech-line-h top-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-top left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-top right-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-bottom left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-bottom right-[-1px]" aria-hidden="true"></div>

            <!-- Card Header: Top Nav Bar -->
            <site-header active="tips"></site-header>

            <!-- Article Wrapper -->
            <article class="p-6 sm:p-12 relative">
                <!-- Breadcrumbs -->
                <nav class="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-6 flex-wrap" aria-label="Breadcrumbs">
                    <a href="/" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Home</a>
                    <span aria-hidden="true">/</span>
                    <a href="/tips" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">Tips</a>
                    <span aria-hidden="true">/</span>
                    <a href="/tips?category=${encodeURIComponent(tip.category.toLowerCase())}" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">${escapeHtml(tip.category)}</a>
                    <span aria-hidden="true">/</span>
                    <span class="text-slate-700 dark:text-slate-200 font-medium truncate max-w-xs">${escapeHtml(tip.title)}</span>
                </nav>

                <!-- Article Header Meta -->
                <div class="flex flex-wrap items-center gap-2.5 mb-4">
                    <span class="px-2.5 py-0.5 text-xs font-semibold rounded border ${categoryBadgeClass}">${escapeHtml(tip.category)}</span>
                    ${tip.subcategory ? `<span class="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">${escapeHtml(tip.subcategory)}</span>` : ''}
                    <span class="text-slate-300 dark:text-slate-700" aria-hidden="true">&bull;</span>
                    <time datetime="${tip.date}" class="text-xs font-mono text-slate-500 dark:text-slate-400">${escapeHtml(tip.formattedDate)}</time>
                    <span class="text-slate-300 dark:text-slate-700" aria-hidden="true">&bull;</span>
                    <span class="text-xs font-mono text-slate-500 dark:text-slate-400">${escapeHtml(tip.readingTime)}</span>
                </div>

                <!-- Main Title -->
                <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
                    ${escapeHtml(tip.title)}
                </h1>

                <!-- Lead Summary Quote -->
                <div class="p-4 sm:p-5 rounded-lg bg-red-50/50 dark:bg-red-950/20 border-l-4 border-red-500 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed my-6 font-medium">
                    ${escapeHtml(tip.description)}
                </div>

                <!-- Tip Body Content -->
                <div class="tip-content mt-6">
${htmlContent}
                </div>

                <!-- Tags Section -->
                <div class="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <span class="text-xs font-mono text-slate-500 dark:text-slate-400 mr-2">Tags:</span>
                    ${tagsHtml}
                </div>

                <!-- Actions Bar: Edit on GitHub & Back to Tips -->
                <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                    <a href="/tips" class="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <svg class="w-3.5 h-3.5" width="14" height="14" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg>
                        <span>Back to All Tips</span>
                    </a>

                    <a href="${githubEditUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <svg class="w-3.5 h-3.5" width="14" height="14" viewBox="0 0 496 512" fill="currentColor" aria-hidden="true"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>
                        <span>Edit on GitHub</span>
                    </a>
                </div>

                <!-- Author Card -->
                <div class="mt-8 p-5 sm:p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <img src="/profile-image-160.webp" alt="Punyapal Shah" width="56" height="56" class="w-14 h-14 rounded-full border-2 border-red-500/20 aspect-square object-cover flex-shrink-0" loading="lazy">
                    <div class="flex-1 min-w-0">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h2 class="text-base font-bold text-slate-900 dark:text-white">Punyapal Shah</h2>
                                <p class="text-xs font-mono text-slate-500 dark:text-slate-400">Laravel Engineer &amp; Open Source Maintainer (Pest &amp; Pinkary Core)</p>
                            </div>
                            <div class="flex items-center justify-center sm:justify-end gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                                <a href="https://x.com/MrPunyapal" target="_blank" rel="noopener noreferrer" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">@MrPunyapal</a>
                                <span aria-hidden="true">&bull;</span>
                                <a href="https://github.com/MrPunyapal" target="_blank" rel="noopener noreferrer" class="hover:text-red-600 dark:hover:text-red-400 transition-colors">GitHub</a>
                            </div>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                            Sharing practical engineering patterns, testing workflows, and developer productivity insights for Laravel and PHP.
                        </p>
                    </div>
                </div>

                <!-- Previous / Next Navigation -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    ${prevNavHtml}
                    ${nextNavHtml}
                </div>

            </article>

        </div>

        <!-- Footer -->
        <div class="w-full max-w-4xl py-6 text-center mt-[-1px] z-10">
            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                // Have a question or feedback on this tip?
                <a href="https://x.com/MrPunyapal" target="_blank" rel="noopener noreferrer" class="text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold ml-1">
                    @MrPunyapal
                </a>
            </p>
        </div>
    </main>

</body>

</html>`;
}

function renderTipsIndexPage(tips) {
  const categories = ['All'];
  const categoryCounts = { All: tips.length };

  tips.forEach(t => {
    const cat = t.category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    if (!categories.includes(cat)) {
      categories.push(cat);
    }
  });

  const categoryPillsHtml = categories.map((cat, idx) => {
    const isAll = idx === 0;
    const count = categoryCounts[cat] || 0;
    const activeClasses = isAll
      ? 'bg-red-500 text-white border-red-500 shadow-sm'
      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700';

    return `<button type="button" data-filter-cat="${escapeHtml(cat.toLowerCase())}" class="px-3 py-1.5 text-xs font-mono rounded-md border transition-all cursor-pointer ${activeClasses}">
        ${escapeHtml(cat)} (${count})
    </button>`;
  }).join('\n                    ');

  const tipCardsHtml = tips.map(tip => {
    const badgeClass = getCategoryBadge(tip.category);
    const tagsSearchStr = tip.tags.join(' ').toLowerCase();

    return `                    <!-- Tip Card: ${escapeHtml(tip.slug)} -->
                    <div data-tip-card
                         data-category="${escapeHtml(tip.category.toLowerCase())}"
                         data-tags="${escapeHtml(tagsSearchStr)}"
                         data-title="${escapeHtml(tip.title.toLowerCase())}"
                         data-description="${escapeHtml(tip.description.toLowerCase())}"
                         data-slug="${escapeHtml(tip.slug)}"
                         class="group relative p-4 sm:p-8 bg-white dark:bg-slate-900/60 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-300 flex flex-col justify-between">
                        
                        <!-- Technical Corner Markers -->
                        <div class="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10" aria-hidden="true">
                            <svg class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                        </div>
                        <div class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block" aria-hidden="true">
                            <svg class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                        </div>
                        <div class="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10" aria-hidden="true">
                            <svg class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                        </div>
                        <div class="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block" aria-hidden="true">
                            <svg class="w-full h-full" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
                        </div>

                        <div>
                            <!-- Header Row: Category Badge & Date -->
                            <div class="flex items-center justify-between gap-2 mb-3">
                                <div class="flex items-center gap-2">
                                    <span class="px-2 py-0.5 text-xs font-semibold rounded border ${badgeClass}">
                                        ${escapeHtml(tip.category)}
                                    </span>
                                    ${tip.subcategory ? `<span class="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">${escapeHtml(tip.subcategory)}</span>` : ''}
                                </div>
                                <time datetime="${tip.date}" class="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    ${escapeHtml(tip.formattedDate)}
                                </time>
                            </div>

                            <!-- Tip Title -->
                            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors mb-2 leading-snug">
                                <a href="/tips/${tip.slug}" class="hover:underline">
                                    ${escapeHtml(tip.title)}
                                </a>
                            </h3>

                            <!-- Tip Excerpt / Quote -->
                            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                                ${escapeHtml(tip.description)}
                            </p>
                        </div>

                        <!-- Footer Row: Tags and Read Link -->
                        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                            <div class="flex flex-wrap gap-1.5">
                                ${tip.tags.slice(0, 3).map(tag => `<span class="px-1.5 py-0.5 text-[11px] font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded">${escapeHtml(tag)}</span>`).join('')}
                            </div>
                            <a href="/tips/${tip.slug}" aria-label="Read tip: ${escapeHtml(tip.title)}" class="inline-flex items-center gap-1 text-xs font-mono font-medium text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform whitespace-nowrap">
                                <span>Read</span>
                                <svg class="w-3.5 h-3.5" width="14" height="14" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg>
                            </a>
                        </div>

                    </div>`;
  }).join('\n');

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://mrpunyapal.dev/tips#webpage",
        "url": "https://mrpunyapal.dev/tips",
        "name": "Laravel Tips | Punyapal Shah",
        "description": "Curated developer tips, architectural patterns, and testing techniques for Laravel, PHP, and modern web development.",
        "inLanguage": "en",
        "isPartOf": {
          "@id": "https://mrpunyapal.dev/#website"
        },
        "about": {
          "@id": "https://mrpunyapal.dev/#person"
        },
        "mainEntity": {
          "@type": "ItemList",
          "name": "Developer Tips Collection",
          "numberOfItems": tips.length,
          "itemListElement": tips.map((t, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "url": `https://mrpunyapal.dev/tips/${t.slug}`,
            "name": t.title
          }))
        }
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Tips | Punyapal Shah</title>

    <!-- Browser and Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=optional">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#FF2D20">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="Permissions-Policy" content="interest-cohort=()">

    <!-- Primary Meta Tags -->
    <meta name="description" content="Curated developer tips, architectural patterns, and testing techniques for Laravel, PHP, and modern web development.">
    <meta name="author" content="Punyapal Shah">
    <link rel="canonical" href="https://mrpunyapal.dev/tips">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://mrpunyapal.dev/tips">
    <meta property="og:title" content="Laravel Tips | Punyapal Shah">
    <meta property="og:description" content="Curated developer tips, architectural patterns, and testing techniques for Laravel, PHP, and modern web development.">
    <meta property="og:image" content="https://mrpunyapal.dev/og/master.png">
    <meta property="og:image:secure_url" content="https://mrpunyapal.dev/og/master.png">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Laravel Tips by Punyapal Shah">
    <meta property="og:site_name" content="Punyapal Shah">
    <meta property="og:locale" content="en_US">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@MrPunyapal">
    <meta name="twitter:creator" content="@MrPunyapal">
    <meta name="twitter:url" content="https://mrpunyapal.dev/tips">
    <meta name="twitter:title" content="Laravel Tips | Punyapal Shah">
    <meta name="twitter:description" content="Curated developer tips, architectural patterns, and testing techniques for Laravel, PHP, and modern web development.">
    <meta name="twitter:image" content="https://mrpunyapal.dev/og/master.png">
    <meta name="twitter:image:src" content="https://mrpunyapal.dev/og/master.png">
    <meta name="twitter:image:alt" content="Laravel Tips by Punyapal Shah">

    <!-- Structured Data -->
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 4)}
    </script>

    <!-- Favicon and Icons -->
    <link rel="icon" href="/favicon.png" type="image/png" sizes="128x128">
    <link rel="apple-touch-icon" href="/favicon.png">
    <meta name="msapplication-TileColor" content="#FF2D20">

    <link rel="stylesheet" href="/src/tailwind.css">
    <link rel="stylesheet" href="/src/app.css">
    <script type="module" src="/src/main.js"></script>

    <style>
        body {
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
        }

        .dark body {
            background: #0a0a0a !important;
            color: #f4f4f5 !important;
        }

        html {
            scroll-behavior: smooth;
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

        .tech-line-v-top {
            position: absolute;
            width: 1px;
            background-color: #e2e8f0;
            z-index: 0;
            pointer-events: none;
            bottom: 100%;
            height: 100vh;
        }

        .tech-line-v-bottom {
            position: absolute;
            width: 1px;
            background-color: #e2e8f0;
            z-index: 0;
            pointer-events: none;
            top: 100%;
            height: 120px;
        }
    </style>
</head>

<body class="font-sans m-0 p-0 min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed relative antialiased transition-colors duration-200">

    <!-- Main Content -->
    <main class="min-h-screen flex flex-col items-center px-3 sm:px-6 pt-1 sm:pt-2 pb-8 sm:pb-12 gap-8">
        <div class="w-full max-w-6xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10">

            <!-- Tech Markers: Corners -->
            <div class="tech-marker -top-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -top-[4px] -right-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

            <!-- Global Extensions -->
            <div class="tech-line-h top-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-top left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-top right-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-bottom left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-bottom right-[-1px]" aria-hidden="true"></div>

            <!-- Card Header: Top Nav Bar -->
            <site-header active="tips"></site-header>

            <!-- Header Section -->
            <div class="p-6 sm:p-12 border-b border-slate-200 dark:border-slate-800 relative">
                <!-- Horizontal Line Extension -->
                <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>

                <!-- Intersections -->
                <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

                <div>
                    <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                        Laravel Tips
                    </h1>
                    <p class="text-lg text-red-600 dark:text-red-400 max-w-2xl font-mono">
                        Architectural patterns, performance techniques, and testing strategies for Laravel and PHP.
                    </p>
                    <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mt-4">
                        A curated collection of production-tested developer tips, architectural insights, and practical techniques across the Laravel, PHP, Pest, and Git workflows. Every tip addresses concrete engineering problems, not documentation recaps.
                    </p>
                </div>

                <!-- Search and Filter Controls -->
                <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-4">
                    <!-- Search Input -->
                    <div class="relative w-full max-w-md">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400" aria-hidden="true">
                            <svg class="w-4 h-4" width="16" height="16" viewBox="0 0 512 512" fill="currentColor"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
                        </div>
                        <input type="search" id="tip-search-input" placeholder="Search 66 tips by keyword, topic, or tag... (Press '/' to focus)" class="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors" aria-label="Search tips">
                        <button type="button" id="tip-search-clear" class="hidden absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" aria-label="Clear search">
                            <svg class="w-4 h-4" width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
                        </button>
                    </div>

                    <!-- Category Filter Buttons and Counter -->
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Filter tips by category">
                            ${categoryPillsHtml}
                        </div>
                        <span id="tip-results-count" class="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            Showing ${tips.length} of ${tips.length} tips
                        </span>
                    </div>
                </div>

            </div>

            <!-- Tips Grid Section -->
            <section class="relative">
                <!-- Empty State (Hidden by default) -->
                <div id="tips-empty-state" class="hidden p-12 text-center">
                    <p class="text-base font-medium text-slate-700 dark:text-slate-300">No matching tips found.</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-2">Try adjusting your search keywords or switching category filters.</p>
                </div>

                <!-- Grid -->
                <div id="tips-grid" class="grid grid-cols-1 md:grid-cols-2 border-t border-l border-slate-200 dark:border-slate-800">
${tipCardsHtml}
                </div>
            </section>

        </div>

        <!-- Footer -->
        <div class="w-full max-w-5xl py-6 text-center mt-[-1px] z-10">
            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                // Want more tips? Follow on X
                <a href="https://x.com/MrPunyapal" target="_blank" rel="noopener noreferrer" class="text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold ml-1">
                    @MrPunyapal
                </a>
            </p>
        </div>
    </main>

    <!-- Client-side Interactive Filter & Search Script -->
    <script>
    (function() {
        const searchInput = document.getElementById('tip-search-input');
        const clearBtn = document.getElementById('tip-search-clear');
        const resultsCount = document.getElementById('tip-results-count');
        const cards = Array.from(document.querySelectorAll('[data-tip-card]'));
        const catButtons = Array.from(document.querySelectorAll('[data-filter-cat]'));
        const emptyState = document.getElementById('tips-empty-state');
        const grid = document.getElementById('tips-grid');
        let currentCategory = 'all';

        function filterTips() {
            const query = (searchInput.value || '').trim().toLowerCase();
            let visible = 0;

            cards.forEach(card => {
                const cat = card.dataset.category || '';
                const tags = card.dataset.tags || '';
                const title = card.dataset.title || '';
                const desc = card.dataset.description || '';

                const matchCat = currentCategory === 'all' || cat === currentCategory;
                const matchQuery = !query || title.includes(query) || tags.includes(query) || desc.includes(query) || cat.includes(query);

                if (matchCat && matchQuery) {
                    card.classList.remove('hidden');
                    visible++;
                } else {
                    card.classList.add('hidden');
                }
            });

            if (resultsCount) {
                resultsCount.textContent = 'Showing ' + visible + ' of ' + cards.length + ' tips';
            }
            if (emptyState) {
                if (visible === 0) {
                    emptyState.classList.remove('hidden');
                } else {
                    emptyState.classList.add('hidden');
                }
            }
            if (clearBtn) {
                if (query.length > 0) {
                    clearBtn.classList.remove('hidden');
                } else {
                    clearBtn.classList.add('hidden');
                }
            }
        }

        catButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                currentCategory = btn.dataset.filterCat.toLowerCase();
                catButtons.forEach(b => {
                    b.classList.remove('bg-red-500', 'text-white', 'border-red-500', 'shadow-sm');
                    b.classList.add('bg-slate-100', 'dark:bg-slate-800/80', 'text-slate-700', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-700');
                });
                btn.classList.remove('bg-slate-100', 'dark:bg-slate-800/80', 'text-slate-700', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-700');
                btn.classList.add('bg-red-500', 'text-white', 'border-red-500', 'shadow-sm');
                filterTips();
            });
        });

        if (searchInput) {
            searchInput.addEventListener('input', filterTips);
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                filterTips();
                searchInput.focus();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                searchInput.focus();
            } else if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.value = '';
                filterTips();
                searchInput.blur();
            }
        });

        const urlParams = new URLSearchParams(window.location.search);
        const paramCat = urlParams.get('category');
        const paramQ = urlParams.get('q');
        if (paramCat) {
            const targetBtn = catButtons.find(b => b.dataset.filterCat.toLowerCase() === paramCat.toLowerCase());
            if (targetBtn) targetBtn.click();
        }
        if (paramQ && searchInput) {
            searchInput.value = paramQ;
            filterTips();
        }
    })();
    </script>

</body>

</html>`;
}

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

function generateRssFeed(tips) {
  const latestDate = tips.length > 0 ? formatRssDate(tips[0].date) : new Date(0).toUTCString();
  const itemsHtml = tips.map(tip => `        <item>
            <title>${escapeHtml(tip.title)}</title>
            <link>https://mrpunyapal.dev/tips/${tip.slug}</link>
            <guid>https://mrpunyapal.dev/tips/${tip.slug}</guid>
            <pubDate>${formatRssDate(tip.date)}</pubDate>
            <description>${escapeHtml(tip.description)}</description>
            <category>${escapeHtml(tip.category)}</category>
        </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>Laravel Tips - Punyapal Shah</title>
        <link>https://mrpunyapal.dev/tips</link>
        <description>Curated developer tips, architectural patterns, and testing techniques for Laravel, PHP, and modern web development.</description>
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

export function buildTips() {
  console.log('--- Starting Tips Generation ---');

  if (!fs.existsSync(tipsContentDir)) {
    console.error(`Tips content directory not found at: ${tipsContentDir}`);
    process.exit(1);
  }

  const markdownFiles = scanMarkdownFiles(tipsContentDir);
  console.log(`Found ${markdownFiles.length} curated markdown tips in submodule.`);

  if (markdownFiles.length === 0) {
    console.warn('Warning: No markdown files found in content/tips/content.');
    return;
  }

  const tips = markdownFiles.map(parseTip);

  // Sort descending by date (newest first), then by title
  tips.sort((a, b) => {
    if (b.date !== a.date) {
      return (b.date || '').localeCompare(a.date || '');
    }
    return a.title.localeCompare(b.title);
  });

  const marked = createMarkedParser();

  // Ensure output directories exist
  if (!fs.existsSync(tipsOutputDir)) {
    fs.mkdirSync(tipsOutputDir, { recursive: true });
  }

  const tipsFeedDir = path.resolve(publicDir, 'tips');
  if (!fs.existsSync(tipsFeedDir)) {
    fs.mkdirSync(tipsFeedDir, { recursive: true });
  }

  // 1. Generate tips.html in root
  const indexHtml = renderTipsIndexPage(tips);
  const rootIndexFile = path.resolve(rootDir, 'tips.html');
  writeFileIfChanged(rootIndexFile, indexHtml);
  console.log(`Generated: tips.html`);

  // Also write an identical tips/index.html so both /tips and /tips/ resolve cleanly in all servers
  const subIndexFile = path.resolve(tipsOutputDir, 'index.html');
  writeFileIfChanged(subIndexFile, indexHtml);
  console.log(`Generated: tips/index.html`);

  // 2. Generate each tip detail page tips/<slug>.html
  tips.forEach((tip, idx) => {
    const prevTip = idx < tips.length - 1 ? tips[idx + 1] : null;
    const nextTip = idx > 0 ? tips[idx - 1] : null;

    const detailHtml = renderTipDetailPage(tip, prevTip, nextTip, marked);
    const detailFile = path.resolve(tipsOutputDir, `${tip.slug}.html`);
    writeFileIfChanged(detailFile, detailHtml);
  });
  console.log(`Generated ${tips.length} individual tip detail pages in tips/*.html`);

  // 3. Generate public/tips-search-index.json
  const searchIndexData = tips.map(t => ({
    slug: t.slug,
    title: t.title,
    category: t.category,
    subcategory: t.subcategory,
    tags: t.tags,
    description: t.description,
    date: t.date,
  }));
  const searchIndexFile = path.resolve(publicDir, 'tips-search-index.json');
  writeFileIfChanged(searchIndexFile, JSON.stringify(searchIndexData, null, 2));
  console.log(`Generated: public/tips-search-index.json (${searchIndexData.length} records)`);

  // 4. Generate public/tips/feed.xml
  const rssXml = generateRssFeed(tips);
  const rssFile = path.resolve(tipsFeedDir, 'feed.xml');
  writeFileIfChanged(rssFile, rssXml);
  console.log(`Generated: public/tips/feed.xml`);

  // 5. Update public/sitemap.xml
  updateSitemap(tips);
  console.log(`Updated: public/sitemap.xml with /tips and all ${tips.length} tip URLs`);

  console.log('--- Tips Generation Complete ---');
}

// Run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildTips();
}
