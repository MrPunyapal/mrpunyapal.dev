import fs from 'node:fs';
import path from 'node:path';
import { renderSiteHeader } from '../site-header.mjs';
import { getCategoryBadge, escapeHtml, escapeJsonStr, criticalGridStyles, iconSprite, formatDate, getTipEffectiveDate } from './tips-helpers.mjs';

function getShareByline(author, authorUrl) {
    if (!author) return 'by @MrPunyapal';

    const normalizedAuthor = author.trim().toLowerCase();
    const isPunyapal = normalizedAuthor.includes('punyapal') || 
                       (authorUrl && authorUrl.toLowerCase().includes('mrpunyapal'));

    if (isPunyapal) {
        return 'by @MrPunyapal';
    }

    if (authorUrl) {
        try {
            const url = new URL(authorUrl);
            const host = url.hostname.toLowerCase();
            if (host === 'x.com' || host === 'www.x.com' || host === 'twitter.com' || host === 'www.twitter.com') {
                const pathSegments = url.pathname.split('/').filter(Boolean);
                if (pathSegments.length > 0) {
                    const handle = pathSegments[0].replace(/^@/, '');
                    if (handle) {
                        return `by @${handle}`;
                    }
                }
            }
        } catch (e) {
            // Fallback to author name if URL parsing fails
        }
    }

    return `by ${author.trim()}`;
}

export function generateSingleTipPage(tip, allTips, tipsOutDir) {
    const badge = getCategoryBadge(tip.category);
    const otherTipSlugs = allTips.filter(t => t.slug !== tip.slug).map(t => t.slug);
    const relatedTips = allTips
        .filter(t => t.slug !== tip.slug && (t.category === tip.category || t.tags.some(tag => tip.tags.includes(tag))))
        .slice(0, 2);

    const created_at = tip.created_at || tip.date || '2026-07-01';
    const updated_at = tip.updated_at || null;
    const effectiveDate = tip.effectiveDate || getTipEffectiveDate(tip);

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

    const shareByline = getShareByline(tip.author, tip.author_url);
    const tweetText = `${tip.title} ${shareByline}`;

    const categorySuffix = tip.category === 'Laravel'
        ? 'Laravel & PHP Tip'
        : tip.category === 'Pest PHP'
            ? 'Pest PHP & PHP Tip'
            : `${tip.category} Tip`;

    const singleTipHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(tip.title)} - ${escapeHtml(categorySuffix)} | Punyapal Shah</title>

    <!-- Browser and Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#FF2D20">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="Permissions-Policy" content="interest-cohort=()">

    <!-- Primary SEO Meta Tags -->
    <meta name="description" content="${escapeHtml(tip.summary)}">
    <meta name="author" content="${escapeHtml(tip.author)}">
    <link rel="canonical" href="https://mrpunyapal.dev/tips/${tip.slug}">
    <link rel="alternate" type="application/rss+xml" title="Laravel Tips | Punyapal Shah" href="https://mrpunyapal.dev/tips/feed.xml">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://mrpunyapal.dev/tips/${tip.slug}">
    <meta property="og:title" content="${escapeHtml(tip.title)} - ${escapeHtml(categorySuffix)} | Punyapal Shah">
    <meta property="og:description" content="${escapeHtml(tip.summary)}">
    <meta property="og:image" content="${escapeHtml(tip.og_image)}">
    <meta property="og:image:secure_url" content="${escapeHtml(tip.og_image)}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escapeHtml(tip.title)} - Punyapal Shah">
    <meta property="og:site_name" content="Punyapal Shah">
    <meta property="og:locale" content="en_US">
    <meta property="article:published_time" content="${escapeHtml(created_at)}">
${updated_at ? `    <meta property="article:modified_time" content="${escapeHtml(updated_at)}">\n` : ''}    <meta property="article:author" content="${escapeHtml(tip.author_url || 'https://mrpunyapal.dev/#person')}">
    <meta property="article:section" content="${escapeHtml(tip.category)}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@MrPunyapal">
    <meta name="twitter:creator" content="@MrPunyapal">
    <meta name="twitter:url" content="https://mrpunyapal.dev/tips/${tip.slug}">
    <meta name="twitter:title" content="${escapeHtml(tip.title)} - ${escapeHtml(categorySuffix)} | Punyapal Shah">
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
                "headline": "${escapeJsonStr(tip.title)}",
                "description": "${escapeJsonStr(tip.summary)}",
                "datePublished": "${escapeJsonStr(created_at)}",
                ${updated_at ? `"dateModified": "${escapeJsonStr(updated_at)}",\n                ` : ''}"inLanguage": "en",
                "mainEntityOfPage": "https://mrpunyapal.dev/tips/${tip.slug}",
                "keywords": "${escapeJsonStr([tip.category, 'PHP tips', 'Laravel tips', ...(tip.tags || [])].join(', '))}",
                "author": {
                    "@type": "Person",
                    "name": "${escapeJsonStr(tip.author)}"${tip.author_url ? `,\n                    "url": "${escapeJsonStr(tip.author_url)}"` : ''}
                },
                "publisher": {
                    "@id": "https://mrpunyapal.dev/#person"
                },
                "articleSection": "${escapeJsonStr(tip.category)}"
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
                        "name": "${escapeJsonStr(tip.title)}",
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

<body class="font-sans m-0 p-0 min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed relative antialiased transition-colors duration-200">
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
                    <a href="/tips" class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1" title="Back to All Tips" aria-label="Back to All Tips">
                        <svg class="icon text-xs" viewBox="0 0 448 512" aria-hidden="true"><use href="#i-arrow-left"/></svg>
                        <span class="hidden sm:inline">Back</span>
                    </a>

                    <div class="inline-flex items-center gap-1.5 flex-wrap">
                        <button id="random-tip-btn" type="button" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs font-mono group cursor-pointer" title="Open another random developer tip" aria-label="Open another random developer tip">
                            <svg class="w-3.5 h-3.5 text-red-500 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h7l-4 4m0 0l4 4M7 8h13M20 20h-7l4-4m0 0l-4-4m4 4H4" />
                            </svg>
                            <span>Random</span>
                        </button>
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
                        <time datetime="${escapeHtml(effectiveDate)}" class="inline-flex items-center gap-1.5">
                            <svg class="icon text-xs opacity-70" viewBox="0 0 448 512" aria-hidden="true"><use href="#i-calendar"/></svg>
                            ${updated_at ? `Updated ${formatDate(updated_at)}` : formatDate(created_at)}
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
                        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent('https://mrpunyapal.dev/tips/' + tip.slug)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-[11px] font-bold uppercase tracking-wider" aria-label="Share this tip on X">
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
        const OTHER_TIP_SLUGS = ${JSON.stringify(otherTipSlugs)};
        document.addEventListener('DOMContentLoaded', () => {
            const randomTipBtn = document.getElementById('random-tip-btn');
            if (randomTipBtn && OTHER_TIP_SLUGS.length > 0) {
                randomTipBtn.addEventListener('click', () => {
                    const randomIndex = Math.floor(Math.random() * OTHER_TIP_SLUGS.length);
                    const randomSlug = OTHER_TIP_SLUGS[randomIndex];
                    window.location.href = '/tips/' + randomSlug;
                });
            }
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
