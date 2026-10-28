import fs from 'node:fs';
import path from 'node:path';
import { renderSiteHeader } from '../site-header.mjs';
import { escapeHtml, escapeJsonStr, formatDate, getTipEffectiveDate, getCategoryBadge, writeFileIfChanged } from '../content-helpers.mjs';

export function generateBlogHubPage(posts, categoriesMap, subcategoriesMap, rootDir) {
    const blogOutPath = path.resolve(rootDir, 'blog.html');
    const blogIndexOutPath = path.resolve(rootDir, 'blog', 'index.html');

    const totalPostsCount = posts.length;
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

        #load-more-btn.hidden,
        #all-loaded-indicator.hidden,
        #lazy-loading-spinner.hidden {
            display: none !important;
        }
    </style>`;

    // Embedded SVG Sprite
    const iconSprite = `
    <svg xmlns="http://www.w3.org/2000/svg" style="display:none;" aria-hidden="true">
        <defs>
            <symbol id="i-crosshair" viewBox="0 0 12 12"><path d="M6 0V12M0 6H12" stroke="currentColor" stroke-width="1.5"/></symbol>
            <symbol id="i-heart" viewBox="0 0 512 512"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></symbol>
            <symbol id="i-github" viewBox="0 0 496 512"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></symbol>
            <symbol id="i-calendar" viewBox="0 0 448 512"><path d="M128 0c17.7 0 32 14.3 32 32V64H288V32c0-17.7 14.3-32 32-32s32 14.3 32 32V64h48c26.5 0 48 21.5 48 48v48H0V112C0 85.5 21.5 64 48 64H96V32c0-17.7 14.3-32 32-32zM0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192zm64 80v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm128 0v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H208c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V272c0-8.8-7.2-16-16-16H336zM64 400v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H208zm112 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V400c0-8.8-7.2-16-16-16H336c-8.8 0-16 7.2-16 16z"/></symbol>
        </defs>
    </svg>`;

    // Generate Card HTML for each Blog Post
    const INITIAL_VISIBLE_COUNT = 16;
    const blogCardsHtml = posts.map((post, idx) => {
        const effectiveDate = getTipEffectiveDate(post);
        const badge = getCategoryBadge(post.category);
        const searchCorpus = `${post.title} ${post.category} ${post.subcategory || ''} ${(post.tags || []).join(' ')} ${post.summary}`.toLowerCase();
        const isInitiallyHidden = idx >= INITIAL_VISIBLE_COUNT;

        return `
                <article class="blog-card group relative p-6 sm:p-8 bg-white dark:bg-slate-900/60 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-300 flex flex-col justify-between"
                    ${isInitiallyHidden ? 'style="display: none;"' : ''}
                    data-category="${escapeHtml(post.category)}"
                    data-subcategory="${escapeHtml(post.subcategory || '')}"
                    data-search="${escapeHtml(searchCorpus)}">

                    <!-- Signature Corner Crosshairs -->
                    <div class="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10" aria-hidden="true">
                        <svg aria-hidden="true" class="w-full h-full" width="16" height="16"><use href="#i-crosshair"/></svg>
                    </div>
                    <div class="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block" aria-hidden="true">
                        <svg aria-hidden="true" class="w-full h-full" width="16" height="16"><use href="#i-crosshair"/></svg>
                    </div>
                    <div class="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10" aria-hidden="true">
                        <svg aria-hidden="true" class="w-full h-full" width="16" height="16"><use href="#i-crosshair"/></svg>
                    </div>
                    <div class="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-4 h-4 text-slate-200 dark:text-slate-800 bg-white dark:bg-slate-900 z-10 hidden md:block" aria-hidden="true">
                        <svg aria-hidden="true" class="w-full h-full" width="16" height="16"><use href="#i-crosshair"/></svg>
                    </div>

                    <div>
                        <div class="flex items-center gap-2 mb-3 flex-wrap">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}">
                                ${escapeHtml(post.category)}
                            </span>
                            ${post.subcategory ? `
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                                ${escapeHtml(post.subcategory)}
                            </span>
                            ` : ''}
                        </div>

                        <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug mb-2.5 tracking-tight">
                            <a href="/blog/${post.slug}" class="after:absolute after:inset-0 focus:outline-none">
                                ${escapeHtml(post.title)}
                            </a>
                        </h2>

                        <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                            ${escapeHtml(post.summary)}
                        </p>
                    </div>

                    <div class="mt-5 flex items-center justify-between relative z-10">
                        <time datetime="${escapeHtml(effectiveDate)}" class="text-xs font-mono text-slate-500 dark:text-slate-400">
                            ${formatDate(effectiveDate)} • ${post.readingTime} min read
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
        "name": "Blog | Punyapal Shah",
        "description": "In-depth technical articles, tutorials, and engineering guides on Laravel, PHP, Git, and modern web development.",
        "url": "https://mrpunyapal.dev/blog",
        "author": {
            "@type": "Person",
            "name": "Punyapal Shah",
            "url": "https://mrpunyapal.dev"
        },
        "mainEntity": {
            "@type": "ItemList",
            "itemListElement": posts.map((post, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "url": `https://mrpunyapal.dev/blog/${post.slug}`,
                "name": post.title
            }))
        }
    };

    const hubHtml = `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog | Punyapal Shah</title>
    <meta name="description" content="In-depth articles, tutorials, and engineering guides for Laravel, PHP, Git, and modern web development by Punyapal Shah.">
    <meta name="author" content="Punyapal Shah">
    <link rel="canonical" href="https://mrpunyapal.dev/blog">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://mrpunyapal.dev/blog">
    <meta property="og:title" content="Blog | Punyapal Shah">
    <meta property="og:description" content="In-depth articles, tutorials, and engineering guides for Laravel, PHP, Git, and modern web development by Punyapal Shah.">
    <meta property="og:image" content="https://mrpunyapal.dev/og/blog.png">
    <meta property="og:site_name" content="Punyapal Shah">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Blog | Punyapal Shah">
    <meta name="twitter:description" content="In-depth articles, tutorials, and engineering guides for Laravel, PHP, Git, and modern web development by Punyapal Shah.">
    <meta name="twitter:image" content="https://mrpunyapal.dev/og/blog.png">

    <!-- RSS Feed Discovery -->
    <link rel="alternate" type="application/rss+xml" title="Blog RSS Feed" href="https://mrpunyapal.dev/blog/feed.xml">

    <!-- Browser and Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=optional">

    <!-- Favicon and Icons -->
    <link rel="icon" href="/favicon.png" type="image/png" sizes="128x128">
    <link rel="apple-touch-icon" href="/favicon.png">
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
    ${iconSprite}

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
            ${renderSiteHeader('blog')}

            <!-- Header Section -->
            <div class="p-6 sm:p-12 border-b border-slate-200 dark:border-slate-800 relative">
                <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

                <div class="animate-fade-up">
                    <div class="flex items-center justify-between gap-4 mb-3 flex-wrap sm:flex-nowrap">
                        <h1 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Blog
                        </h1>
                        <div class="flex items-center gap-2">
                            <button id="random-blog-btn" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs font-mono group cursor-pointer" aria-label="Open a random article" title="View a random article">
                                <svg class="w-3.5 h-3.5 text-red-500 group-hover:rotate-180 transition-transform duration-500" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h7l-4 4m0 0l4 4M7 8h13M20 20h-7l4-4m0 0l-4-4m4 4H4" />
                                </svg>
                                <span>Random</span>
                            </button>
                            <a href="/blog/feed.xml" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs font-mono group" aria-label="RSS Feed for Blog" title="Subscribe via RSS">
                                <svg class="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" width="14" height="14" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20 5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18zM4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
                                </svg>
                                <span class="hidden sm:inline">RSS Feed</span>
                                <span class="sm:hidden">RSS</span>
                            </a>
                        </div>
                    </div>
                    <p class="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mt-2 leading-relaxed">
                        In-depth articles, tutorials, and engineering guides for Laravel, PHP, Git, and modern web development.
                    </p>
                    <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Looking for concise snippets? <a href="/tips" class="font-bold underline text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors">Browse developer tips</a>.
                    </p>
                </div>

                <!-- Search & Filters Row -->
                <div class="mt-8 max-w-3xl">
                    <div class="flex items-center gap-3">
                        <div class="relative flex-1">
                            <label for="blog-search" class="sr-only">Search articles</label>
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <svg class="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <input type="search" id="blog-search" placeholder="Search by keyword (e.g. static analysis, architecture, git)..." class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-mono">
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
                        <h2 class="text-base font-bold text-slate-900 dark:text-white">Filter Articles</h2>
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
                            Topic
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

            <!-- Blog Grid Section (Signature 2-Column Crosshair Grid) -->
            <section class="border-b border-slate-200 dark:border-slate-800 relative">
                <div class="tech-line-h bottom-[-1px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -left-[4px]" aria-hidden="true"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]" aria-hidden="true"></div>

                <div id="blog-container" class="grid grid-cols-1 md:grid-cols-2 border-t border-l border-slate-200 dark:border-slate-800">
                    ${blogCardsHtml}
                </div>

                <!-- Lazy Loading Sentinel & Load More Controls -->
                <div id="blog-lazy-controls" class="p-6 sm:p-8 text-center border-t border-slate-200 dark:border-slate-800 relative bg-slate-50/50 dark:bg-slate-900/30">
                    <!-- Sentinel element for IntersectionObserver -->
                    <div id="scroll-sentinel" class="h-1 w-full" aria-hidden="true"></div>

                    <!-- Subtle Loading Spinner when scrolling or loading more -->
                    <div id="lazy-loading-spinner" class="hidden flex items-center justify-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400" style="display: none;">
                        <svg class="animate-spin h-4 w-4 text-red-600" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading more articles...</span>
                    </div>

                    <!-- Manual Load More button (works as fallback or explicit click) -->
                    <button type="button" id="load-more-btn" aria-label="Load more articles" class="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-mono font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2">
                        <span>Load More Articles</span>
                        <span id="load-more-count" class="text-[11px] text-slate-400 font-normal"></span>
                    </button>

                    <!-- End of results indicator -->
                    <div id="all-loaded-indicator" class="hidden text-xs font-mono text-slate-400 dark:text-slate-500" style="display: none;">
                        // All articles loaded (<span id="all-loaded-count">${totalPostsCount}</span> total)
                    </div>
                </div>

                <!-- Empty State (hidden by default) -->
                <div id="empty-state" class="hidden p-12 text-center border-t border-slate-200 dark:border-slate-800">
                    <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <svg class="w-6 h-6" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h2 class="text-base font-semibold text-slate-900 dark:text-white mb-1">No matching articles found</h2>
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
                // Got thoughts or a topic request?
                <a href="https://github.com/MrPunyapal/mrpunyapal.dev" target="_blank" rel="noopener noreferrer"
                    class="text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold ml-1">
                    Discussions and feedback welcome
                </a>
            </p>
        </div>
    </main>

    <!-- Client-side Interactive Filter & Search Script -->
    <script>
        const ALL_BLOG_SLUGS = ${JSON.stringify(posts.map(p => p.slug))};
        document.addEventListener('DOMContentLoaded', () => {
            const randomBlogBtn = document.getElementById('random-blog-btn');
            if (randomBlogBtn && ALL_BLOG_SLUGS.length > 0) {
                randomBlogBtn.addEventListener('click', () => {
                    const randomIndex = Math.floor(Math.random() * ALL_BLOG_SLUGS.length);
                    window.location.href = '/blog/' + ALL_BLOG_SLUGS[randomIndex];
                });
            }

            const searchInput = document.getElementById('blog-search');
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
            const cards = Array.from(document.querySelectorAll('.blog-card'));
            let matchingCards = [...cards];

            const categoryFilterBtns = document.querySelectorAll('.category-filter-btn');
            const subcategoryFilterBtns = document.querySelectorAll('.subcategory-filter-btn');

            const INITIAL_BATCH = 16;
            const BATCH_SIZE = 12;
            let currentLimit = INITIAL_BATCH;
            let isLoading = false;

            const loadMoreBtn = document.getElementById('load-more-btn');
            const loadMoreCount = document.getElementById('load-more-count');
            const loadingSpinner = document.getElementById('lazy-loading-spinner');
            const allLoadedIndicator = document.getElementById('all-loaded-indicator');
            const allLoadedCount = document.getElementById('all-loaded-count');
            const lazyControls = document.getElementById('blog-lazy-controls');
            const scrollSentinel = document.getElementById('scroll-sentinel');

            let activeCategory = 'All';
            let activeSubcategory = 'All';
            let searchQuery = '';

            function updateFilterBadge() {
                let activeCount = 0;
                if (activeCategory !== 'All') activeCount++;
                if (activeSubcategory !== 'All') activeCount++;
                if (searchQuery.trim().length > 0) activeCount++;

                if (activeFilterBadge) {
                    if (activeCount > 0) {
                        activeFilterBadge.textContent = activeCount;
                        activeFilterBadge.classList.remove('hidden');
                    } else {
                        activeFilterBadge.classList.add('hidden');
                    }
                }
            }

            function updateDisplay() {
                const totalMatching = matchingCards.length;
                const shownCount = Math.min(currentLimit, totalMatching);

                // Show matching cards up to currentLimit
                for (let i = 0; i < totalMatching; i++) {
                    if (i < currentLimit) {
                        matchingCards[i].style.display = 'flex';
                    } else {
                        matchingCards[i].style.display = 'none';
                    }
                }

                // Hide cards that do not match the current search or filters
                const matchingSet = new Set(matchingCards);
                for (let i = 0; i < cards.length; i++) {
                    if (!matchingSet.has(cards[i])) {
                        cards[i].style.display = 'none';
                    }
                }

                // Header Results Count
                if (resultsCount) {
                    if (searchQuery.trim().length > 0 || activeCategory !== 'All' || activeSubcategory !== 'All') {
                        resultsCount.textContent = 'Showing ' + shownCount + ' of ' + totalMatching + ' matching articles';
                        resultsCount.classList.remove('hidden');
                    } else {
                        resultsCount.textContent = '';
                        resultsCount.classList.add('hidden');
                    }
                }

                // Empty state and Lazy controls
                if (totalMatching === 0) {
                    if (emptyState) {
                        emptyState.classList.remove('hidden');
                        emptyState.style.display = 'block';
                    }
                    if (lazyControls) {
                        lazyControls.classList.add('hidden');
                        lazyControls.style.display = 'none';
                    }
                } else {
                    if (emptyState) {
                        emptyState.classList.add('hidden');
                        emptyState.style.display = 'none';
                    }
                    if (lazyControls) {
                        lazyControls.classList.remove('hidden');
                        lazyControls.style.display = 'block';
                    }

                    if (shownCount >= totalMatching) {
                        if (loadMoreBtn) {
                            loadMoreBtn.classList.add('hidden');
                            loadMoreBtn.style.display = 'none';
                        }
                        if (loadingSpinner) {
                            loadingSpinner.classList.add('hidden');
                            loadingSpinner.style.display = 'none';
                        }
                        if (allLoadedIndicator) {
                            allLoadedIndicator.classList.remove('hidden');
                            allLoadedIndicator.style.display = 'block';
                            if (allLoadedCount) allLoadedCount.textContent = String(totalMatching);
                        }
                    } else {
                        if (allLoadedIndicator) {
                            allLoadedIndicator.classList.add('hidden');
                            allLoadedIndicator.style.display = 'none';
                        }
                        if (loadingSpinner) {
                            loadingSpinner.classList.add('hidden');
                            loadingSpinner.style.display = 'none';
                        }
                        if (loadMoreBtn) {
                            loadMoreBtn.classList.remove('hidden');
                            loadMoreBtn.style.display = 'inline-flex';
                            const remaining = totalMatching - shownCount;
                            if (loadMoreCount) loadMoreCount.textContent = '(' + remaining + ' more)';
                        }
                    }
                }

                updateFilterBadge();
            }

            function filterCards() {
                const q = searchQuery.toLowerCase().trim();

                matchingCards = cards.filter(card => {
                    const cardCat = card.getAttribute('data-category') || '';
                    const cardSubcat = card.getAttribute('data-subcategory') || '';
                    const cardSearch = card.getAttribute('data-search') || '';

                    const matchesCategory = (activeCategory === 'All' || cardCat.toLowerCase() === activeCategory.toLowerCase());
                    const matchesSubcat = (activeSubcategory === 'All' || cardSubcat.toLowerCase() === activeSubcategory.toLowerCase());
                    const matchesQuery = !q || cardSearch.includes(q);

                    return matchesCategory && matchesSubcat && matchesQuery;
                });

                currentLimit = INITIAL_BATCH;
                updateDisplay();
            }

            function loadMore() {
                if (isLoading || currentLimit >= matchingCards.length) return;
                isLoading = true;

                if (loadingSpinner) {
                    loadingSpinner.classList.remove('hidden');
                    loadingSpinner.style.display = 'flex';
                }
                if (loadMoreBtn) {
                    loadMoreBtn.classList.add('hidden');
                    loadMoreBtn.style.display = 'none';
                }

                requestAnimationFrame(() => {
                    currentLimit += BATCH_SIZE;
                    updateDisplay();
                    isLoading = false;
                });
            }

            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', loadMore);
            }

            if ('IntersectionObserver' in window && scrollSentinel) {
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting && !isLoading && currentLimit < matchingCards.length) {
                        loadMore();
                    }
                }, {
                    rootMargin: '500px 0px',
                    threshold: 0.01
                });

                observer.observe(scrollSentinel);
            }

            function updateSubcategoryVisibility() {
                let currentSubcatValid = (activeSubcategory === 'All');

                subcategoryFilterBtns.forEach(btn => {
                    const subcat = btn.getAttribute('data-subcat');
                    if (subcat === 'All') return;

                    const catsAttr = btn.getAttribute('data-categories') || '';
                    const validCats = catsAttr.split(',').filter(Boolean);

                    if (activeCategory === 'All' || validCats.includes(activeCategory)) {
                        btn.style.display = 'inline-flex';
                        if (subcat === activeSubcategory) {
                            currentSubcatValid = true;
                        }
                    } else {
                        btn.style.display = 'none';
                    }
                });

                if (!currentSubcatValid) {
                    activeSubcategory = 'All';
                    subcategoryFilterBtns.forEach(btn => {
                        if (btn.getAttribute('data-subcat') === 'All') {
                            btn.classList.add('active-subcat', 'bg-red-600', 'text-white', 'border-red-600');
                            btn.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                        } else {
                            btn.classList.remove('active-subcat', 'bg-red-600', 'text-white', 'border-red-600');
                            btn.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-600', 'dark:text-slate-300', 'border-slate-200', 'dark:border-slate-800');
                        }
                    });
                }
            }

            function updateUrlParams() {
                const url = new URL(window.location);
                if (searchQuery.trim()) {
                    url.searchParams.set('q', searchQuery.trim());
                } else {
                    url.searchParams.delete('q');
                }

                if (activeCategory !== 'All') {
                    url.searchParams.set('category', activeCategory);
                } else {
                    url.searchParams.delete('category');
                }

                if (activeSubcategory !== 'All') {
                    url.searchParams.set('subcat', activeSubcategory);
                } else {
                    url.searchParams.delete('subcat');
                }

                window.history.replaceState({}, '', url.toString());
            }

            if (searchInput) {
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        searchQuery = e.target.value;
                        filterCards();
                        updateUrlParams();
                    }, 120);
                });
            }

            categoryFilterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const cat = btn.getAttribute('data-filter');
                    activeCategory = cat;

                    categoryFilterBtns.forEach(b => {
                        const isTarget = b === btn;
                        b.classList.toggle('active-filter', isTarget);
                        b.classList.toggle('bg-red-600', isTarget);
                        b.classList.toggle('text-white', isTarget);
                        b.classList.toggle('border-red-600', isTarget);
                        b.classList.toggle('shadow-sm', isTarget);
                        b.classList.toggle('bg-white', !isTarget);
                        b.classList.toggle('dark:bg-slate-900', !isTarget);
                        b.classList.toggle('text-slate-600', !isTarget);
                        b.classList.toggle('dark:text-slate-300', !isTarget);
                        b.classList.toggle('border-slate-200', !isTarget);
                        b.classList.toggle('dark:border-slate-800', !isTarget);

                        const badge = b.querySelector('span:last-child');
                        if (badge) {
                            if (isTarget) {
                                badge.className = 'text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-red-700 font-bold';
                            } else {
                                badge.className = 'text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
                            }
                        }
                    });

                    updateSubcategoryVisibility();
                    filterCards();
                    updateUrlParams();
                });
            });

            subcategoryFilterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const subcat = btn.getAttribute('data-subcat');
                    activeSubcategory = subcat;

                    subcategoryFilterBtns.forEach(b => {
                        const isTarget = b === btn;
                        b.classList.toggle('active-subcat', isTarget);
                        b.classList.toggle('bg-red-600', isTarget);
                        b.classList.toggle('text-white', isTarget);
                        b.classList.toggle('border-red-600', isTarget);
                        b.classList.toggle('shadow-xs', isTarget);
                        b.classList.toggle('bg-white', !isTarget);
                        b.classList.toggle('dark:bg-slate-900', !isTarget);
                        b.classList.toggle('text-slate-600', !isTarget);
                        b.classList.toggle('dark:text-slate-300', !isTarget);
                        b.classList.toggle('border-slate-200', !isTarget);
                        b.classList.toggle('dark:border-slate-800', !isTarget);
                    });

                    filterCards();
                    updateUrlParams();
                });
            });

            function openDrawer() {
                if (!filterDrawerPanel || !filterDrawerBackdrop) return;
                filterDrawerPanel.classList.remove('hidden');
                filterDrawerBackdrop.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                if (toggleFilterBtn) toggleFilterBtn.setAttribute('aria-expanded', 'true');

                requestAnimationFrame(() => {
                    filterDrawerBackdrop.classList.remove('opacity-0', 'pointer-events-none');
                    filterDrawerBackdrop.classList.add('opacity-100');
                    filterDrawerPanel.classList.remove('translate-x-full');
                    filterDrawerPanel.classList.add('translate-x-0');
                });
            }

            function closeDrawer() {
                if (!filterDrawerPanel || !filterDrawerBackdrop) return;
                if (toggleFilterBtn) toggleFilterBtn.setAttribute('aria-expanded', 'false');
                filterDrawerBackdrop.classList.remove('opacity-100');
                filterDrawerBackdrop.classList.add('opacity-0', 'pointer-events-none');
                filterDrawerPanel.classList.remove('translate-x-0');
                filterDrawerPanel.classList.add('translate-x-full');

                setTimeout(() => {
                    filterDrawerPanel.classList.add('hidden');
                    filterDrawerBackdrop.classList.add('hidden');
                    document.body.style.overflow = '';
                }, 300);
            }

            if (toggleFilterBtn) toggleFilterBtn.addEventListener('click', openDrawer);
            if (closeFilterDrawerBtn) closeFilterDrawerBtn.addEventListener('click', closeDrawer);
            if (filterDrawerBackdrop) filterDrawerBackdrop.addEventListener('click', closeDrawer);
            if (drawerApplyBtn) drawerApplyBtn.addEventListener('click', closeDrawer);

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && filterDrawerPanel && !filterDrawerPanel.classList.contains('hidden')) {
                    closeDrawer();
                }
            });

            function resetFilters() {
                searchQuery = '';
                activeCategory = 'All';
                activeSubcategory = 'All';
                if (searchInput) searchInput.value = '';

                categoryFilterBtns.forEach(b => {
                    const isAll = b.getAttribute('data-filter') === 'All';
                    b.classList.toggle('active-filter', isAll);
                    b.classList.toggle('bg-red-600', isAll);
                    b.classList.toggle('text-white', isAll);
                    b.classList.toggle('border-red-600', isAll);
                    b.classList.toggle('shadow-sm', isAll);
                    b.classList.toggle('bg-white', !isAll);
                    b.classList.toggle('dark:bg-slate-900', !isAll);
                    b.classList.toggle('text-slate-600', !isAll);
                    b.classList.toggle('dark:text-slate-300', !isAll);
                    b.classList.toggle('border-slate-200', !isAll);
                    b.classList.toggle('dark:border-slate-800', !isAll);

                    const badge = b.querySelector('span:last-child');
                    if (badge) {
                        badge.className = isAll
                            ? 'text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-red-700 font-bold'
                            : 'text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
                    }
                });

                subcategoryFilterBtns.forEach(b => {
                    const isAll = b.getAttribute('data-subcat') === 'All';
                    b.style.display = 'inline-flex';
                    b.classList.toggle('active-subcat', isAll);
                    b.classList.toggle('bg-red-600', isAll);
                    b.classList.toggle('text-white', isAll);
                    b.classList.toggle('border-red-600', isAll);
                    b.classList.toggle('shadow-xs', isAll);
                    b.classList.toggle('bg-white', !isAll);
                    b.classList.toggle('dark:bg-slate-900', !isAll);
                    b.classList.toggle('text-slate-600', !isAll);
                    b.classList.toggle('dark:text-slate-300', !isAll);
                    b.classList.toggle('border-slate-200', !isAll);
                    b.classList.toggle('dark:border-slate-800', !isAll);
                });

                filterCards();
                updateUrlParams();
            }

            if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
            if (drawerResetBtn) {
                drawerResetBtn.addEventListener('click', () => {
                    resetFilters();
                    closeDrawer();
                });
            }

            // Restore from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const queryParam = urlParams.get('q');
            const categoryParam = urlParams.get('category');
            const subcatParam = urlParams.get('subcat');

            if (queryParam) {
                searchQuery = queryParam;
                if (searchInput) searchInput.value = queryParam;
            }

            if (categoryParam) {
                const targetBtn = Array.from(categoryFilterBtns).find(b => b.getAttribute('data-filter').toLowerCase() === categoryParam.toLowerCase());
                if (targetBtn) {
                    targetBtn.click();
                }
            }

            if (subcatParam) {
                const targetBtn = Array.from(subcategoryFilterBtns).find(b => b.getAttribute('data-subcat').toLowerCase() === subcatParam.toLowerCase());
                if (targetBtn) {
                    targetBtn.click();
                }
            }

            if (queryParam || categoryParam || subcatParam) {
                filterCards();
            } else {
                updateDisplay();
            }
        });
    </script>
</body>
</html>`;

    writeFileIfChanged(blogOutPath, hubHtml);
    writeFileIfChanged(blogIndexOutPath, hubHtml);
}
