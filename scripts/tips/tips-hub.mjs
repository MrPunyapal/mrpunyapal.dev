import fs from 'node:fs';
import path from 'node:path';
import { renderSiteHeader } from '../site-header.mjs';
import { getCategoryBadge, escapeHtml, escapeJsonStr, criticalGridStyles, iconSprite, formatDate } from './tips-helpers.mjs';

export function generateTipsHubPage(tips, categoryList, categoriesMap, rootDir) {
    const tipsCardsHtml = tips.map((tip, idx) => {
        const badge = getCategoryBadge(tip.category);

        return `
            <div class="tip-card group relative p-6 bg-white dark:bg-slate-900/60 border-r border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-300 flex flex-col justify-between cursor-pointer"
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
                    <div class="flex items-center gap-1.5 mb-2.5 flex-wrap relative z-10">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}">
                            ${escapeHtml(tip.category)}
                        </span>
                        ${tip.subcategory ? `
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800">
                                ${escapeHtml(tip.subcategory)}
                            </span>
                        ` : ''}
                    </div>
                    <h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug mb-2 tracking-tight">
                        <a href="/tips/${tip.slug}" class="after:absolute after:inset-0 focus:outline-none">
                            ${escapeHtml(tip.title)}
                        </a>
                    </h2>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        ${escapeHtml(tip.summary)}
                    </p>
                </div>

                <div class="pt-4 mt-auto flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
                    <time datetime="${escapeHtml(tip.date)}" class="text-xs font-mono text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                        ${formatDate(tip.date)}
                    </time>
                    <span class="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 group-hover:text-red-700 transition-colors inline-flex items-center gap-1">
                        <span>READ</span>
                        <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
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
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tips | Punyapal Shah</title>

    <!-- Browser and Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
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
                        "name": "${escapeJsonStr(t.title)}"
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
                        <div class="flex items-center gap-2">
                            <button id="random-tip-btn" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs font-mono group cursor-pointer" aria-label="Open a random developer tip">
                                <svg class="w-3.5 h-3.5 text-red-500 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h7l-4 4m0 0l4 4M7 8h13M20 20h-7l4-4m0 0l-4-4m4 4H4" />
                                </svg>
                                <span>Random</span>
                            </button>
                            <a href="/tips/feed.xml" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs font-mono group" aria-label="RSS Feed for Punyapal Shah's Tips">
                                <svg class="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20 5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18zM4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
                                </svg>
                                <span>RSS Feed</span>
                            </a>
                        </div>
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
                    <h2 class="text-base font-semibold text-slate-900 dark:text-white mb-1">No matching tips found</h2>
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
        const ALL_TIP_SLUGS = ${JSON.stringify(tips.map(t => t.slug))};
        document.addEventListener('DOMContentLoaded', () => {
            const randomTipBtn = document.getElementById('random-tip-btn');
            if (randomTipBtn && ALL_TIP_SLUGS.length > 0) {
                randomTipBtn.addEventListener('click', () => {
                    const randomIndex = Math.floor(Math.random() * ALL_TIP_SLUGS.length);
                    const randomSlug = ALL_TIP_SLUGS[randomIndex];
                    window.location.href = '/tips/' + randomSlug;
                });
            }
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
