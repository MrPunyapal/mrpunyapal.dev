/**
 * Unified Site Navigation Header Component
 * Single Source of Truth for desktop and mobile navigation across all pages.
 */

export function renderSiteHeader(activePage = 'home') {
    const navItems = [
        { id: 'home', href: '/', label: 'Home' },
        { id: 'services', href: '/services', label: 'Services' },
        { id: 'projects', href: '/projects', label: 'Projects' },
        { id: 'oss', href: '/opensource', label: 'Open Source', shortLabel: 'OSS', hasHeart: true },
        { id: 'tips', href: '/tips', label: 'Tips' },
        { id: 'resume', href: '/resume', label: 'Resume' },
        { id: 'talks', href: '/talks', label: 'Talks' },
    ];

    // Desktop Nav Items
    const desktopNavLinksHtml = navItems.map(item => {
        const isActive = activePage === item.id || (item.id === 'oss' && activePage === 'opensource') || (item.id === 'tips' && (activePage === 'tips' || activePage === 'tip'));
        const activeClasses = 'text-slate-900 dark:text-white border-b-2 border-transparent relative';
        const inactiveClasses = 'text-slate-900/60 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors relative';
        const activeIndicator = isActive ? `<span class="nav-active-indicator absolute -bottom-[1px] inset-x-0 h-[2px] bg-red-500 z-10" style="view-transition-name: active-nav-indicator;" aria-hidden="true"></span>` : '';

        if (item.hasHeart) {
            return `                    <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="px-2 sm:px-2.5 md:px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium ${isActive ? activeClasses : inactiveClasses} inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span class="nav-label" data-text="${item.label}"><span>${item.label}</span></span>
                        <svg class="icon text-red-500 text-xs" width="12" height="12" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>
                        ${activeIndicator}
                    </a>`;
        }

        return `                    <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="px-2 sm:px-2.5 md:px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium ${isActive ? activeClasses : inactiveClasses} inline-flex items-center whitespace-nowrap">
                        <span class="nav-label" data-text="${item.label}"><span>${item.label}</span></span>
                        ${activeIndicator}
                    </a>`;
    }).join('\n');

    // Mobile Sidebar Items (Clean left red border quote style)
    const mobileSidebarNavLinksHtml = navItems.map(item => {
        const isActive = activePage === item.id || (item.id === 'oss' && activePage === 'opensource') || (item.id === 'tips' && (activePage === 'tips' || activePage === 'tip'));
        const activeClasses = 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium border-l-4 border-red-500';
        const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent';

        return `                <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="flex items-center px-4 py-3 text-base transition-all ${isActive ? activeClasses : inactiveClasses}">
                    <span>${item.label}</span>
                </a>`;
    }).join('\n');

    const isResume = activePage === 'resume';
    const githubRepo = 'https://github.com/MrPunyapal/mrpunyapal.dev';
    const githubLabel = 'View source code on GitHub';

    const themeBtnInnerHtml = `<span class="theme-icon-container flex items-center justify-center" aria-hidden="true">
        <svg class="theme-sun-icon hidden dark:block text-amber-400" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" fill="currentColor"/>
            <line x1="12" y1="2" x2="12" y2="4"/>
            <line x1="12" y1="20" x2="12" y2="22"/>
            <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>
            <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
            <line x1="2" y1="12" x2="4" y2="12"/>
            <line x1="20" y1="12" x2="22" y2="12"/>
            <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/>
            <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
        </svg>
        <svg class="theme-moon-icon block dark:hidden text-indigo-500" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    </span>
    <span class="theme-spider-badge absolute -top-1 -right-1 pointer-events-none flex items-center justify-center z-10 text-slate-800 dark:text-slate-200" aria-hidden="true">
        <svg viewBox="0 0 100 100" width="13.5" height="13.5" fill="currentColor" aria-hidden="true" style="display:block;">
            <g stroke="currentColor" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M 44 60 Q 28 80 16 78" />
                <path d="M 56 60 Q 72 80 84 78" />
                <path d="M 42 53 Q 20 63 10 53" />
                <path d="M 58 53 Q 80 63 90 53" />
                <path d="M 42 45 Q 18 36 12 24" />
                <path d="M 58 45 Q 82 36 88 24" />
                <path d="M 44 38 Q 30 18 20 10" />
                <path d="M 56 38 Q 70 18 80 10" />
            </g>
            <ellipse cx="50" cy="35" rx="14" ry="17" />
            <circle cx="50" cy="57" r="10" />
            <path d="M 44 65 Q 47 73 47 77" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" />
            <path d="M 56 65 Q 53 73 53 77" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" />
        </svg>
    </span>`;

    const headerClasses = isResume 
        ? 'print:hidden border-b border-slate-200 dark:border-slate-800 relative z-20'
        : 'border-b border-slate-200 dark:border-slate-800 relative z-20';

    return `<header class="${headerClasses}" style="view-transition-name: site-header;">
                <!-- Embedded navigation icon symbols -->
                <svg xmlns="http://www.w3.org/2000/svg" class="hidden" aria-hidden="true">
                    <defs>
                        <symbol id="i-heart" viewBox="0 0 512 512"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></symbol>
                        <symbol id="i-github" viewBox="0 0 496 512"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></symbol>
                    </defs>
                </svg>

                <!-- Horizontal Line Extension -->
                <div class="tech-line-h bottom-[-1px]"></div>

                <!-- Intersections with outer border -->
                <div class="tech-marker -bottom-[4px] -left-[4px]"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]"></div>

                <!-- Desktop Nav Row (Visible on sm: and larger) -->
                <div class="hidden sm:flex site-nav-row items-center overflow-x-auto px-4 sm:px-6 w-full">
                    <!-- Spacer pushes nav to the right -->
                    <div class="site-nav-spacer flex-1 min-w-0" aria-hidden="true"></div>

                    <!-- Navigation Tabs -->
                    <nav aria-label="Main Navigation" class="site-nav-tabs flex items-center -mb-[1px] shrink-0">
${desktopNavLinksHtml}
                    </nav>

                    <!-- Utility Buttons -->
                    <div class="site-nav-utilities flex items-center gap-1 sm:gap-1.5 py-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800 shrink-0">
                        <a href="${githubRepo}" target="_blank" rel="noopener noreferrer" aria-label="${githubLabel}" class="site-nav-source p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded" title="GitHub Repository">
                            <svg class="icon text-sm" width="16" height="16" viewBox="0 0 496 512" fill="currentColor" aria-hidden="true"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>
                        </a>
                        <button type="button" data-theme-toggle aria-label="Toggle dark mode" title="Toggle theme" class="theme-toggle-btn relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded">
                            ${themeBtnInnerHtml}
                        </button>
                    </div>
                </div>

                <!-- Mobile Header Bar (Visible on mobile < sm) -->
                <div class="flex sm:hidden items-center justify-between px-4 py-2.5 w-full">
                    <a href="/" aria-label="Home page" class="px-2 py-1 text-sm font-semibold text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        Home
                    </a>

                    <div class="flex items-center gap-1.5">
                        <a href="${githubRepo}" target="_blank" rel="noopener noreferrer" aria-label="${githubLabel}" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded" title="GitHub Repository">
                            <svg class="icon text-sm" width="16" height="16" viewBox="0 0 496 512" fill="currentColor" aria-hidden="true"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>
                        </a>
                        <button type="button" data-theme-toggle aria-label="Toggle dark mode" title="Toggle theme" class="theme-toggle-btn relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded">
                            ${themeBtnInnerHtml}
                        </button>
                        <button type="button" data-mobile-menu-toggle aria-expanded="false" aria-controls="mobile-sidebar" aria-label="Open sidebar navigation menu" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                            <svg class="w-5 h-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M3.75 8.25h16.5M3.75 15.75h11"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Off-Canvas Mobile Sidebar Drawer -->
                <div id="mobile-sidebar" class="hidden sm:hidden fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation sidebar">
                    <!-- Semi-transparent Blur Backdrop -->
                    <div id="mobile-sidebar-backdrop" class="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 ease-in-out opacity-0" aria-hidden="true"></div>

                    <!-- Slide-Over Panel Container -->
                    <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
                        <div id="mobile-sidebar-panel" class="w-64 sm:w-72 h-dvh max-h-dvh bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-full flex flex-col">
                            
                            <!-- Sidebar Header Bar (Clean Close Button Only) -->
                            <div class="flex items-center justify-end px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
                                <button type="button" data-mobile-sidebar-close aria-label="Close navigation menu" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <svg class="w-5 h-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <path d="M18 6 6 18M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>

                            <!-- Sidebar Content Links -->
                            <div class="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
${mobileSidebarNavLinksHtml}
                            </div>

                            <!-- Sidebar Footer -->
                            <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span class="font-medium text-slate-700 dark:text-slate-300">Punyapal Shah</span>
                                <a href="${githubRepo}" target="_blank" rel="noopener noreferrer" aria-label="${githubLabel}" class="hover:text-slate-900 dark:hover:text-white transition-colors font-mono">GitHub ↗</a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Smooth Interactivity Script for Off-Canvas Sidebar -->
                <script>
                if (!window.__sidebarNavInit) {
                    window.__sidebarNavInit = true;

                    function preventTouchMove(e) {
                        if (e.target.closest('#mobile-sidebar-panel')) return;
                        e.preventDefault();
                    }

                    function openSidebar() {
                        var sidebar = document.getElementById('mobile-sidebar');
                        var backdrop = document.getElementById('mobile-sidebar-backdrop');
                        var panel = document.getElementById('mobile-sidebar-panel');
                        var toggleBtn = document.querySelector('[data-mobile-menu-toggle]');
                        if (!sidebar || !backdrop || !panel) return;

                        sidebar.classList.remove('hidden');

                        document.addEventListener('touchmove', preventTouchMove, { passive: false });

                        requestAnimationFrame(function() {
                            backdrop.classList.remove('opacity-0');
                            backdrop.classList.add('opacity-100');
                            panel.classList.remove('translate-x-full');
                            panel.classList.add('translate-x-0');
                        });

                        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
                    }

                    function closeSidebar() {
                        var sidebar = document.getElementById('mobile-sidebar');
                        var backdrop = document.getElementById('mobile-sidebar-backdrop');
                        var panel = document.getElementById('mobile-sidebar-panel');
                        var toggleBtn = document.querySelector('[data-mobile-menu-toggle]');
                        if (!sidebar || !backdrop || !panel) return;

                        backdrop.classList.remove('opacity-100');
                        backdrop.classList.add('opacity-0');
                        panel.classList.remove('translate-x-0');
                        panel.classList.add('translate-x-full');

                        document.removeEventListener('touchmove', preventTouchMove);

                        setTimeout(function() {
                            sidebar.classList.add('hidden');
                        }, 300);

                        if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
                    }

                    function initSidebarEvents() {
                        var toggleBtns = document.querySelectorAll('[data-mobile-menu-toggle]');
                        var closeBtns = document.querySelectorAll('[data-mobile-sidebar-close]');
                        var backdrop = document.getElementById('mobile-sidebar-backdrop');

                        toggleBtns.forEach(function(btn) {
                            btn.addEventListener('click', function(e) {
                                e.preventDefault();
                                openSidebar();
                            });
                        });

                        closeBtns.forEach(function(btn) {
                            btn.addEventListener('click', function(e) {
                                e.preventDefault();
                                closeSidebar();
                            });
                        });

                        if (backdrop) {
                            backdrop.addEventListener('click', function(e) {
                                e.preventDefault();
                                closeSidebar();
                            });
                        }
                    }

                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', initSidebarEvents);
                    } else {
                        initSidebarEvents();
                    }

                    document.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape') {
                            var sidebar = document.getElementById('mobile-sidebar');
                            if (sidebar && !sidebar.classList.contains('hidden')) {
                                closeSidebar();
                            }
                        }
                    });
                }
                </script>
            </header>`;
}
