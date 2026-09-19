import fs from 'node:fs';
import path from 'node:path';
import { renderSiteHeader } from '../site-header.mjs';
import {
    escapeHtml,
    escapeJsonStr,
    formatDate,
    getTipEffectiveDate,
    getCategoryBadge,
    marked,
    writeFileIfChanged
} from './tips-helpers.mjs';

/**
 * Generate a single tip HTML page matching media_1789829314742.jpg
 */
export function generateSingleTipPage(tip, allTips, rootDir) {
    const tipsOutDir = path.resolve(rootDir, 'tips');
    const tipOutPath = path.join(tipsOutDir, `${tip.slug}.html`);

    const effectiveDate = getTipEffectiveDate(tip);
    const badge = getCategoryBadge(tip.category);

    // Filter and score related tips
    const relatedTips = allTips
        .filter(t => t.slug !== tip.slug)
        .map(t => {
            let score = 0;
            if (t.category === tip.category) score += 3;
            if (t.subcategory && tip.subcategory && t.subcategory === tip.subcategory) score += 4;
            const sharedTags = (t.tags || []).filter(tag => (tip.tags || []).includes(tag));
            score += sharedTags.length * 2;
            return { tip: t, score };
        })
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(getTipEffectiveDate(b.tip)) - new Date(getTipEffectiveDate(a.tip));
        })
        .slice(0, 2)
        .map(item => item.tip);

    // Fallback to latest tips if no related ones found
    if (relatedTips.length === 0) {
        relatedTips.push(...allTips.filter(t => t.slug !== tip.slug).slice(0, 2));
    }

    // Render markdown content
    // Note: tip.body contains the full markdown (with top H1 stripped)
    const hasLeadingQuote = /^\s*>/m.test(tip.body || '');
    const renderedBody = marked.parse(tip.body || '');

    // Critical Grid and Card CSS (matching hub page and site standards)
    const criticalStyles = `
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
            background: linear-gradient(to bottom, #e2e8f0, transparent);
            z-index: 0;
            pointer-events: none;
            top: 100%;
            height: 120px;
        }
    </style>`;

    // Related tips cards HTML (2-column crosshair grid matching hub)
    const relatedCardsHtml = relatedTips.map(r => {
        const rEffectiveDate = getTipEffectiveDate(r);
        const rBadge = getCategoryBadge(r.category);
        return `
        <article class="tip-card group relative p-6 sm:p-8 bg-white dark:bg-slate-900/60 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-300 flex flex-col justify-between">
            <!-- Signature Corner Crosshairs -->
            <div class="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10" aria-hidden="true">
                <svg aria-hidden="true" class="w-full h-full" width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
            <div class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block" aria-hidden="true">
                <svg aria-hidden="true" class="w-full h-full" width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
            <div class="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10" aria-hidden="true">
                <svg aria-hidden="true" class="w-full h-full" width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>
            <div class="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block" aria-hidden="true">
                <svg aria-hidden="true" class="w-full h-full" width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></svg>
            </div>

            <div>
                <div class="flex items-center gap-2 mb-3 flex-wrap">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${rBadge.bg} ${rBadge.text} ${rBadge.border}">
                        ${escapeHtml(r.category)}
                    </span>
                    ${r.subcategory ? `
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                        ${escapeHtml(r.subcategory)}
                    </span>
                    ` : ''}
                </div>

                <h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug mb-2.5 tracking-tight">
                    <a href="/tips/${r.slug}" class="after:absolute after:inset-0 focus:outline-none">
                        ${escapeHtml(r.title)}
                    </a>
                </h3>

                <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    ${escapeHtml(r.summary)}
                </p>
            </div>

            <div class="mt-5 flex items-center justify-between relative z-10">
                <time datetime="${escapeHtml(rEffectiveDate)}" class="text-xs font-mono text-slate-500 dark:text-slate-400">
                    ${formatDate(rEffectiveDate)} • ${r.readingTime} min read
                </time>
                <span class="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 group-hover:text-red-700 transition-colors inline-flex items-center gap-1 font-mono">
                    <span>READ</span>
                    <span class="group-hover:translate-x-0.5 transition-transform">&gt;</span>
                </span>
            </div>
        </article>`;
    }).join('\n');

    // JSON-LD Structured Data
    const jsonLdData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TechArticle",
                "@id": `https://mrpunyapal.dev/tips/${tip.slug}#article`,
                "isPartOf": {
                    "@type": "WebPage",
                    "@id": `https://mrpunyapal.dev/tips/${tip.slug}`
                },
                "headline": tip.title,
                "description": tip.summary,
                "image": `https://mrpunyapal.dev/og/tips/${tip.slug}.png`,
                "url": `https://mrpunyapal.dev/tips/${tip.slug}`,
                "datePublished": tip.created_at || tip.date || effectiveDate,
                "dateModified": effectiveDate,
                "inLanguage": "en",
                "author": {
                    "@type": "Person",
                    "name": "Punyapal Shah",
                    "url": "https://mrpunyapal.dev"
                },
                "publisher": {
                    "@type": "Person",
                    "name": "Punyapal Shah",
                    "url": "https://mrpunyapal.dev"
                },
                "keywords": tip.tags || []
            },
            {
                "@type": "BreadcrumbList",
                "@id": `https://mrpunyapal.dev/tips/${tip.slug}#breadcrumb`,
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://mrpunyapal.dev"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Laravel Tips",
                        "item": "https://mrpunyapal.dev/tips"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": tip.title,
                        "item": `https://mrpunyapal.dev/tips/${tip.slug}`
                    }
                ]
            }
        ]
    };

    const shareUrl = `https://mrpunyapal.dev/tips/${tip.slug}`;
    const shareText = `${tip.title} by @MrPunyapal`;
    const xShareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

    const githubEditUrl = tip.relPath
        ? `https://github.com/MrPunyapal/tips/blob/main/${tip.relPath}`
        : `https://github.com/MrPunyapal/tips`;

    const singleTipHtml = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(tip.title)} - ${escapeHtml(tip.category)} | Punyapal Shah</title>
    <meta name="description" content="${escapeHtml(tip.summary)}">
    <meta name="author" content="${escapeHtml(tip.author || 'Punyapal Shah')}">
    <link rel="canonical" href="https://mrpunyapal.dev/tips/${tip.slug}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://mrpunyapal.dev/tips/${tip.slug}">
    <meta property="og:title" content="${escapeHtml(tip.title)} - ${escapeHtml(tip.category)} | Punyapal Shah">
    <meta property="og:description" content="${escapeHtml(tip.summary)}">
    <meta property="og:image" content="https://mrpunyapal.dev/og/tips/${tip.slug}.png">
    <meta property="og:site_name" content="Punyapal Shah">
    <meta property="article:published_time" content="${escapeHtml(tip.created_at || tip.date || effectiveDate)}">
    <meta property="article:modified_time" content="${escapeHtml(effectiveDate)}">
    <meta property="article:author" content="https://mrpunyapal.dev">
    <meta property="article:section" content="${escapeHtml(tip.category)}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(tip.title)} - ${escapeHtml(tip.category)} | Punyapal Shah">
    <meta name="twitter:description" content="${escapeHtml(tip.summary)}">
    <meta name="twitter:image" content="https://mrpunyapal.dev/og/tips/${tip.slug}.png">
    <!-- Browser and Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=optional">

    <!-- Favicon & Stylesheet -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="stylesheet" href="/src/tailwind.css">
    <link rel="stylesheet" href="/src/app.css">
    <script type="module" src="/src/main.js"></script>
    ${criticalStyles}

    <!-- Structured Data (JSON-LD) -->
    <script type="application/ld+json">
    ${JSON.stringify(jsonLdData, null, 2)}
    </script>

    <!-- Theme Initialization -->
    <script>
        (function() {
            var savedTheme = localStorage.getItem('theme');
            var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        })();
    </script>
</head>

<body class="font-sans m-0 p-0 min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed relative overflow-x-hidden antialiased transition-colors duration-200">

    <!-- Main Content Frame -->
    <main class="min-h-screen flex flex-col items-center px-3 sm:px-6 pt-1 sm:pt-2 pb-8 sm:pb-12 gap-8">
        <div class="w-full max-w-6xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-10">

            <!-- Tech Markers: Corners -->
            <div class="tech-marker -top-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -top-[4px] -right-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
            <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

            <!-- Global Infinite Extensions -->
            <div class="tech-line-h top-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-top left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-top right-[-1px]" aria-hidden="true"></div>

            <div class="tech-line-v-bottom left-[-1px]" aria-hidden="true"></div>
            <div class="tech-line-v-bottom right-[-1px]" aria-hidden="true"></div>

            <!-- Card Header: Top Nav Bar -->
            ${renderSiteHeader('tips')}

            <!-- Header Section (Breadcrumb + Title + Metadata) -->
            <div class="p-6 sm:p-10 md:p-12 border-b border-slate-200 dark:border-slate-800 relative">
                <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

                <!-- Top Breadcrumbs / Action Bar -->
                <div class="flex items-center justify-between gap-4 flex-wrap select-none mb-6">
                    <a href="/tips" class="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors group">
                        <span class="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
                        <span>BACK</span>
                    </a>

                    <div class="flex items-center gap-2.5 flex-wrap">
                        <button type="button" id="random-tip-btn" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer" title="Jump to random tip">
                            <svg class="w-3.5 h-3.5 text-red-500" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h7l-4 4m0 0l4 4M7 8h13M20 20h-7l4-4m0 0l-4-4m4 4H4"/>
                            </svg>
                            <span>Random</span>
                        </button>

                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}">
                            ${escapeHtml(tip.category)}
                        </span>
                        ${tip.subcategory ? `
                        <span class="text-slate-300 dark:text-slate-700 font-mono text-xs">/</span>
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                            ${escapeHtml(tip.subcategory)}
                        </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Title -->
                <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
                    ${escapeHtml(tip.title)}
                </h1>

                <!-- Metadata Byline -->
                <div class="flex items-center justify-between gap-4 flex-wrap text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400">
                    <div class="flex items-center gap-2.5 flex-wrap">
                        <span class="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                            <svg class="w-3.5 h-3.5 text-slate-400" width="14" height="14" fill="currentColor" viewBox="0 0 448 512" aria-hidden="true"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>
                            <span>${escapeHtml(tip.author || 'Punyapal Shah')}</span>
                        </span>
                        <span>•</span>
                        <span class="inline-flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5 text-slate-400" width="14" height="14" fill="currentColor" viewBox="0 0 448 512" aria-hidden="true"><path d="M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm64 80v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm128 0v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H336zM64 400v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H208zm112 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H336c-8.8 0-16 7.2-16 16z"/></svg>
                            <time datetime="${escapeHtml(effectiveDate)}">${formatDate(effectiveDate)}</time>
                        </span>
                        <span>•</span>
                        <span class="inline-flex items-center gap-1.5">
                            <svg class="w-3.5 h-3.5 text-slate-400" width="14" height="14" fill="currentColor" viewBox="0 0 512 512" aria-hidden="true"><path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zm0 464a208 208 0 1 0 0-416 208 208 0 1 0 0 416zm-8-272V128c0-13.3 10.7-24 24-24s24 10.7 24 24v80h56c13.3 0 24 10.7 24 24s-10.7 24-24 24H264c-13.3 0-24-10.7-24-24z"/></svg>
                            <span>${tip.readingTime} min read</span>
                        </span>
                    </div>

                    <a href="${escapeHtml(githubEditUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <span>edit this tip</span>
                        <span>&rarr;</span>
                    </a>
                </div>
            </div>

            <!-- Tip Article Container -->
            <article class="p-6 sm:p-10 md:p-12">
                <!-- Fallback Summary Callout Box (only if tip body lacks a leading blockquote) -->
                ${!hasLeadingQuote && tip.summary ? `
                <blockquote class="mb-8 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-red-500 bg-slate-50/70 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 font-mono text-xs sm:text-sm leading-relaxed [&>p]:m-0">
                    <p>${escapeHtml(tip.summary)}</p>
                </blockquote>
                ` : ''}

                <!-- Tip Content Body -->
                <div class="tip-content max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base">
                    ${renderedBody}
                </div>

                <!-- Tags & Share Row -->
                <div class="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                    <!-- Tags (without '#' prefix) -->
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">Tags:</span>
                        ${(tip.tags || []).map(tag => `
                        <a href="/tips?q=${encodeURIComponent(tag)}" class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-600 transition-colors">
                            ${escapeHtml(tag)}
                        </a>
                        `).join('')}
                    </div>

                    <!-- Share Buttons -->
                    <div class="flex items-center gap-2">
                        <a href="${escapeHtml(xShareLink)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 text-xs font-mono font-medium transition-colors" aria-label="Share tip on X">
                            <svg class="w-3.5 h-3.5" width="14" height="14" fill="currentColor" viewBox="0 0 512 512" aria-hidden="true">
                                <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
                            </svg>
                            <span>Share on X</span>
                        </a>
                        <button type="button" id="copy-link-btn" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 text-xs font-mono font-medium transition-colors cursor-pointer" aria-label="Copy tip link">
                            <svg class="w-3.5 h-3.5" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                            </svg>
                            <span id="copy-link-label">Copy Link</span>
                        </button>
                    </div>
                </div>

                <!-- Related Tips Section (2-column Crosshair Grid) -->
                ${relatedTips.length > 0 ? `
                <div class="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Related Tips
                        </h2>
                        <a href="/tips" class="text-xs font-mono text-red-600 dark:text-red-400 hover:underline">
                            View all tips &rarr;
                        </a>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 border-t border-l border-slate-200 dark:border-slate-800 relative">
                        ${relatedCardsHtml}
                    </div>
                </div>
                ` : ''}
            </article>

        </div>

        <!-- Footer -->
        <div class="w-full max-w-6xl py-6 text-center mt-[-1px] z-10">
            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                // Got a tip in mind?
                <a href="https://github.com/MrPunyapal/tips" target="_blank" rel="noopener noreferrer" class="text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold ml-1">
                    Contributions are always welcome
                </a>
            </p>
        </div>
    </main>

    <!-- Client-side Interactive Script for Single Tip -->
    <script>
        const ALL_TIP_SLUGS = ${JSON.stringify(allTips.map(t => t.slug))};
        document.addEventListener('DOMContentLoaded', () => {
            // Random Tip Button
            const randomBtn = document.getElementById('random-tip-btn');
            if (randomBtn && ALL_TIP_SLUGS.length > 1) {
                randomBtn.addEventListener('click', () => {
                    const currentSlug = '${tip.slug}';
                    const pool = ALL_TIP_SLUGS.filter(s => s !== currentSlug);
                    const randomSlug = pool[Math.floor(Math.random() * pool.length)];
                    window.location.href = '/tips/' + randomSlug;
                });
            }

            // Copy Tip Link Button
            const copyLinkBtn = document.getElementById('copy-link-btn');
            const copyLinkLabel = document.getElementById('copy-link-label');
            if (copyLinkBtn) {
                copyLinkBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(window.location.href);
                        if (copyLinkLabel) copyLinkLabel.textContent = 'Copied!';
                        copyLinkBtn.classList.add('border-emerald-500', 'text-emerald-600');
                        setTimeout(() => {
                            if (copyLinkLabel) copyLinkLabel.textContent = 'Copy Link';
                            copyLinkBtn.classList.remove('border-emerald-500', 'text-emerald-600');
                        }, 2000);
                    } catch (e) {
                        console.error('Failed to copy link', e);
                    }
                });
            }

            // Copy Code Snippet Buttons
            document.querySelectorAll('.copy-code-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const code = btn.getAttribute('data-code');
                    if (!code) return;
                    try {
                        await navigator.clipboard.writeText(code);
                        const label = btn.querySelector('.copy-label');
                        if (label) label.textContent = 'Copied!';
                        btn.classList.add('border-emerald-500', 'text-emerald-600');
                        setTimeout(() => {
                            if (label) label.textContent = 'Copy';
                            btn.classList.remove('border-emerald-500', 'text-emerald-600');
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

    writeFileIfChanged(tipOutPath, singleTipHtml);
}
