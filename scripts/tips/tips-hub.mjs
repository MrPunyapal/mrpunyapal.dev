import fs from 'node:fs';
import path from 'node:path';
import { renderSiteHeader } from '../site-header.mjs';
import { escapeHtml, escapeJsonStr, formatDate, getTipEffectiveDate, getCategoryBadge, writeFileIfChanged } from './tips-helpers.mjs';

export function generateTipsHubPage(tips, categoriesMap, subcategoriesMap, rootDir) {
    const tipsOutPath = path.resolve(rootDir, 'tips.html');
    const tipsIndexOutPath = path.resolve(rootDir, 'tips', 'index.html');

    const totalTipsCount = tips.length;
    const categoryNames = Object.keys(categoriesMap).sort((a, b) => {
        if (a === 'All') return -1;
        if (b === 'All') return 1;
        return a.localeCompare(b);
    });

    const subcategoryNames = Object.keys(subcategoriesMap).sort();

    // Critical Grid and Card CSS
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

    // Embedded SVG Sprite
    const iconSprite = `
    <svg xmlns="http://www.w3.org/2000/svg" style="display:none;" aria-hidden="true">
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

    // Generate Card HTML for each Tip
    const tipsCardsHtml = tips.map(tip => {
        const effectiveDate = getTipEffectiveDate(tip);
        const badge = getCategoryBadge(tip.category);
        const searchCorpus = `${tip.title} ${tip.category} ${tip.subcategory || ''} ${(tip.tags || []).join(' ')} ${tip.summary}`.toLowerCase();

        return `
                <article class="tip-card group relative p-6 sm:p-8 bg-white dark:bg-slate-900/60 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-300 flex flex-col justify-between"
                    data-category="${escapeHtml(tip.category)}"
                    data-subcategory="${escapeHtml(tip.subcategory || '')}"
                    data-search="${escapeHtml(searchCorpus)}">

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
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}">
                                ${escapeHtml(tip.category)}
                            </span>
                            ${tip.subcategory ? `
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                                ${escapeHtml(tip.subcategory)}
                            </span>
                            ` : ''}
                        </div>

                        <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug mb-2.5 tracking-tight">
                            <a href="/tips/${tip.slug}" class="after:absolute after:inset-0 focus:outline-none">
                                ${escapeHtml(tip.title)}
                            </a>
                        </h2>

                        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                            ${escapeHtml(tip.summary)}
                        </p>
                    </div>

                    <div class="mt-5 flex items-center justify-between relative z-10">
                        <time datetime="${escapeHtml(effectiveDate)}" class="text-xs font-mono text-slate-500 dark:text-slate-400">
                            ${formatDate(effectiveDate)} • ${tip.readingTime} min read
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
        "@type": "CollectionPage",
        "name": "Laravel Tips | Punyapal Shah",
        "description": "Bite-sized engineering patterns, performance techniques, and idiomatic snippets across Laravel, PHP, and Pest.",
        "url": "https://mrpunyapal.dev/tips",
        "author": {
            "@type": "Person",
            "name": "Punyapal Shah",
            "url": "https://mrpunyapal.dev"
        },
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": tips.map((tip, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "url": `https://mrpunyapal.dev/tips/${tip.slug}`,
                "name": tip.title
            }))
        }
    };

    const hubHtml = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laravel Tips | Punyapal Shah</title>
    <meta name="description" content="Practical engineering tips for Laravel developers and the wider PHP ecosystem. Curated by Punyapal Shah.">
    <meta name="author" content="Punyapal Shah">
    <link rel="canonical" href="https://mrpunyapal.dev/tips">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://mrpunyapal.dev/tips">
    <meta property="og:title" content="Laravel Tips | Punyapal Shah">
    <meta property="og:description" content="Practical engineering tips for Laravel developers and the wider PHP ecosystem. Curated by Punyapal Shah.">
    <meta property="og:image" content="https://mrpunyapal.dev/og/tips.png">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="https://mrpunyapal.dev/tips">
    <meta name="twitter:title" content="Laravel Tips | Punyapal Shah">
    <meta name="twitter:description" content="Practical engineering tips for Laravel developers and the wider PHP ecosystem. Curated by Punyapal Shah.">
    <meta name="twitter:image" content="https://mrpunyapal.dev/og/tips.png">

    <!-- RSS Feed -->
    <link rel="alternate" type="application/rss+xml" title="Laravel Tips - Punyapal Shah" href="https://mrpunyapal.dev/tips/feed.xml">

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

            <!-- Header Section -->
            <div class="p-6 sm:p-12 border-b border-slate-200 dark:border-slate-800 relative">
                <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

                <div class="animate-fade-up">
                    <div class="flex items-center justify-between gap-4 mb-3 flex-wrap sm:flex-nowrap">
                        <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Laravel Tips
                        </h1>
                        <div class="flex items-center gap-2">
                            <button id="random-tip-btn" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs font-mono group cursor-pointer" aria-label="Open a random developer tip" title="View a random tip">
                                <svg class="w-3.5 h-3.5 text-red-500 group-hover:rotate-180 transition-transform duration-500" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h7l-4 4m0 0l4 4M7 8h13M20 20h-7l4-4m0 0l-4-4m4 4H4" />
                                </svg>
                                <span>Random</span>
                            </button>
                            <a href="/tips/feed.xml" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs font-mono group" aria-label="RSS Feed for Laravel Tips" title="Subscribe via RSS">
                                <svg class="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20 5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18zM4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
                                </svg>
                                <span class="hidden sm:inline">RSS Feed</span>
                                <span class="sm:hidden">RSS</span>
                            </a>
                        </div>
                    </div>
                    <p class="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mt-2 leading-relaxed">
                        Practical engineering tips for Laravel developers and the wider PHP ecosystem.
                    </p>
                    <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Got a tip in mind? <a href="https://github.com/MrPunyapal/tips" target="_blank" rel="noopener noreferrer" class="font-bold underline text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors">Contributions are always welcome</a>.
                    </p>
                </div>

                <!-- Search & Filters Row -->
                <div class="mt-8 max-w-3xl">
                    <div class="flex items-center gap-3">
                        <div class="relative flex-1">
                            <label for="tip-search" class="sr-only">Search tips</label>
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <svg class="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <input type="search" id="tip-search" placeholder="Search by keyword (e.g. sole, TIA, database, enum)..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-mono">
                        </div>

                        <button type="button" id="toggle-filter-btn" aria-expanded="false" aria-controls="filter-drawer-panel" class="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shadow-xs group">
                            <svg class="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                            <span>Filters</span>
                            <span id="active-filter-badge" class="hidden text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-600 text-white font-bold">1</span>
                        </button>
                    </div>

                    <div id="results-count" class="hidden text-xs font-mono text-slate-500 dark:text-slate-400 mt-3"></div>
                </div>
            </div>

            <!-- Slide-over Filter Sidebar Drawer -->
            <div id="filter-drawer-backdrop" class="hidden fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs z-50 transition-opacity duration-300 opacity-0 pointer-events-none" aria-hidden="true"></div>

            <aside id="filter-drawer-panel" role="dialog" aria-modal="true" aria-label="Filters sidebar" class="hidden fixed top-0 bottom-0 right-0 h-dvh max-h-dvh w-full max-w-full sm:max-w-md md:max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 transform translate-x-full transition-transform duration-300 flex flex-col overflow-hidden">
                <!-- Drawer Header -->
                <div class="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-red-500" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                        </svg>
                        <h2 class="text-base font-bold text-slate-900 dark:text-white">Filter Tips</h2>
                    </div>
                    <button type="button" id="close-filter-drawer-btn" class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" aria-label="Close filter drawer">
                        <svg class="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Drawer Content (Scrollable) -->
                <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    <!-- Categories -->
                    <div>
                        <h3 class="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-3">
                            Category
                        </h3>
                        <div class="flex flex-wrap gap-1.5">
                            ${categoryNames.map(cat => {
                                const count = categoriesMap[cat] || 0;
                                const isAll = cat === 'All';
                                return `
                                <button type="button" data-filter="${escapeHtml(cat)}" class="category-filter-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${isAll ? 'active-filter bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}">
                                    <span>${escapeHtml(cat)}</span>
                                    <span class="text-[10px] font-mono px-1.5 py-0.2 rounded ${isAll ? 'bg-white text-red-700 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}">${count}</span>
                                </button>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Subcategories -->
                    <div id="subcategory-filter-section">
                        <h3 class="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-3">
                            Subcategory / Topic
                        </h3>
                        <div class="flex flex-wrap gap-1.5">
                            <button type="button" data-subcat="All" class="subcategory-filter-btn active-subcat inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer bg-red-600 text-white border-red-600 shadow-xs">
                                <span>All Topics</span>
                            </button>
                            ${subcategoryNames.map(subcat => {
                                const count = subcategoriesMap[subcat] ? subcategoriesMap[subcat].count : 0;
                                const cats = subcategoriesMap[subcat] ? Array.from(subcategoriesMap[subcat].categories).join(',') : '';
                                return `
                                <button type="button" data-subcat="${escapeHtml(subcat)}" data-categories="${escapeHtml(cats)}" class="subcategory-filter-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700">
                                    <span>${escapeHtml(subcat)}</span>
                                    <span class="text-[10px] font-mono text-slate-400">(${count})</span>
                                </button>`;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Drawer Footer Actions -->
                <div class="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-3">
                    <button type="button" id="drawer-reset-btn" class="text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-semibold cursor-pointer">
                        Reset All Filters
                    </button>
                    <button type="button" id="drawer-apply-btn" class="px-4 py-2 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
                        View Results
                    </button>
                </div>
            </aside>

            <!-- Tips Grid Section (Signature 2-Column Crosshair Grid) -->
            <section class="border-b border-slate-200 dark:border-slate-800 relative">
                <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

                <div id="tips-container" class="grid grid-cols-1 md:grid-cols-2 border-t border-l border-slate-200 dark:border-slate-800">
                    ${tipsCardsHtml}
                </div>

                <!-- Empty State (hidden by default) -->
                <div id="empty-state" class="hidden p-12 text-center border-t border-slate-200 dark:border-slate-800">
                    <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h2 class="text-base font-semibold text-slate-900 dark:text-white mb-1">No matching tips found</h2>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">Try adjusting your search query or choosing another category/topic filter.</p>
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
        const ALL_TIP_SLUGS = ${JSON.stringify(tips.map(t => t.slug))};
        document.addEventListener('DOMContentLoaded', () => {
            const randomTipBtn = document.getElementById('random-tip-btn');
            if (randomTipBtn && ALL_TIP_SLUGS.length > 0) {
                randomTipBtn.addEventListener('click', () => {
                    const randomIndex = Math.floor(Math.random() * ALL_TIP_SLUGS.length);
                    window.location.href = '/tips/' + ALL_TIP_SLUGS[randomIndex];
                });
            }

            const searchInput = document.getElementById('tip-search');
            const toggleFilterBtn = document.getElementById('toggle-filter-btn');
            const closeFilterDrawerBtn = document.getElementById('close-filter-drawer-btn');
            const drawerApplyBtn = document.getElementById('drawer-apply-btn');
            const drawerResetBtn = document.getElementById('drawer-reset-btn');
            const resetFiltersBtn = document.getElementById('reset-filters-btn');
            const filterDrawerBackdrop = document.getElementById('filter-drawer-backdrop');
            const filterDrawerPanel = document.getElementById('filter-drawer-panel');
            const activeFilterBadge = document.getElementById('active-filter-badge');
            const resultsCount = document.getElementById('results-count');
            const emptyState = document.getElementById('empty-state');
            const cards = document.querySelectorAll('.tip-card');
            const categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
            const subcategoryFilterBtns = document.querySelectorAll('.subcategory-filter-btn');

            let activeCategory = 'All';
            let activeSubcategory = 'All';
            let searchQuery = '';

            // Open/Close Filter Drawer
            function openDrawer() {
                if (!filterDrawerPanel || !filterDrawerBackdrop) return;
                filterDrawerBackdrop.classList.remove('hidden');
                filterDrawerPanel.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                requestAnimationFrame(() => {
                    filterDrawerBackdrop.classList.remove('opacity-0', 'pointer-events-none');
                    filterDrawerBackdrop.classList.add('opacity-100');
                    filterDrawerPanel.classList.remove('translate-x-full');
                    filterDrawerPanel.classList.add('translate-x-0');
                });
                if (toggleFilterBtn) toggleFilterBtn.setAttribute('aria-expanded', 'true');
            }

            function closeDrawer() {
                if (!filterDrawerPanel || !filterDrawerBackdrop) return;
                filterDrawerBackdrop.classList.remove('opacity-100');
                filterDrawerBackdrop.classList.add('opacity-0', 'pointer-events-none');
                filterDrawerPanel.classList.remove('translate-x-0');
                filterDrawerPanel.classList.add('translate-x-full');
                document.body.style.overflow = '';
                setTimeout(() => {
                    filterDrawerBackdrop.classList.add('hidden');
                    filterDrawerPanel.classList.add('hidden');
                }, 300);
                if (toggleFilterBtn) toggleFilterBtn.setAttribute('aria-expanded', 'false');
            }

            if (toggleFilterBtn) toggleFilterBtn.addEventListener('click', openDrawer);
            if (closeFilterDrawerBtn) closeFilterDrawerBtn.addEventListener('click', closeDrawer);
            if (drawerApplyBtn) drawerApplyBtn.addEventListener('click', closeDrawer);
            if (filterDrawerBackdrop) filterDrawerBackdrop.addEventListener('click', closeDrawer);

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && filterDrawerPanel && !filterDrawerPanel.classList.contains('hidden')) {
                    closeDrawer();
                }
            });

            function updateFilterBadge() {
                let count = 0;
                if (activeCategory !== 'All') count++;
                if (activeSubcategory !== 'All') count++;
                if (searchQuery.trim().length > 0) count++;

                if (activeFilterBadge) {
                    if (count > 0) {
                        activeFilterBadge.textContent = String(count);
                        activeFilterBadge.classList.remove('hidden');
                    } else {
                        activeFilterBadge.classList.add('hidden');
                    }
                }
            }

            function filterCards() {
                const q = searchQuery.toLowerCase().trim();
                let visibleCount = 0;

                cards.forEach(card => {
                    const cardCat = card.getAttribute('data-category');
                    const cardSubcat = card.getAttribute('data-subcategory');
                    const cardSearch = card.getAttribute('data-search') || '';

                    const matchesCategory = (activeCategory === 'All' || cardCat.toLowerCase() === activeCategory.toLowerCase());
                    const matchesSubcat = (activeSubcategory === 'All' || cardSubcat.toLowerCase() === activeSubcategory.toLowerCase());
                    const matchesQuery = !q || cardSearch.includes(q);

                    if (matchesCategory && matchesSubcat && matchesQuery) {
                        card.style.display = 'flex';
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                if (resultsCount) {
                    if (q || activeCategory !== 'All' || activeSubcategory !== 'All') {
                        resultsCount.textContent = 'Showing ' + visibleCount + ' of ' + cards.length + ' tips';
                        resultsCount.classList.remove('hidden');
                    } else {
                        resultsCount.textContent = '';
                        resultsCount.classList.add('hidden');
                    }
                }

                if (emptyState) {
                    if (visibleCount === 0) {
                        emptyState.classList.remove('hidden');
                    } else {
                        emptyState.classList.add('hidden');
                    }
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
                                badge.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-500', 'dark:text-slate-400');
                                badge.classList.remove('bg-white', 'text-red-700', 'font-bold');
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

            function resetAllFilters() {
                searchQuery = '';
                activeCategory = 'All';
                activeSubcategory = 'All';
                if (searchInput) searchInput.value = '';

                categoryFilterBtns.forEach(b => {
                    const isAll = b.getAttribute('data-filter') === 'All';
                    if (isAll) {
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
                            badge.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-500', 'dark:text-slate-400');
                            badge.classList.remove('bg-white', 'text-red-700', 'font-bold');
                        }
                    }
                });

                updateSubcategoryVisibility();
                filterCards();
            }

            if (drawerResetBtn) drawerResetBtn.addEventListener('click', resetAllFilters);
            if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAllFilters);

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value;
                    filterCards();
                });
            }

            // Sync URL params on load
            const urlParams = new URLSearchParams(window.location.search);
            const queryParam = urlParams.get('q') || urlParams.get('search') || urlParams.get('tag');
            const categoryParam = urlParams.get('category');
            const subcatParam = urlParams.get('subcat') || urlParams.get('subcategory');

            if (queryParam) {
                searchQuery = queryParam;
                if (searchInput) searchInput.value = queryParam;
            }

            if (categoryParam) {
                const targetBtn = Array.from(categoryFilterBtns).find(b => b.getAttribute('data-filter').toLowerCase() === categoryParam.toLowerCase());
                if (targetBtn) targetBtn.click();
            }

            if (subcatParam) {
                const targetSubcatBtn = Array.from(subcategoryFilterBtns).find(b => b.getAttribute('data-subcat').toLowerCase() === subcatParam.toLowerCase());
                if (targetSubcatBtn) targetSubcatBtn.click();
            }

            if (queryParam || categoryParam || subcatParam) {
                filterCards();
            }
        });
    </script>
</body>
</html>`;

    writeFileIfChanged(tipsOutPath, hubHtml);
    writeFileIfChanged(tipsIndexOutPath, hubHtml);
}
