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
        const isActive = activePage === item.id || (item.id === 'oss' && activePage === 'opensource');
        const activeClasses = 'text-slate-900 dark:text-white border-b-2 border-red-500';
        const inactiveClasses = 'text-slate-900/60 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-colors';

        if (item.hasHeart) {
            return `                    <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="px-2 sm:px-2.5 md:px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium ${isActive ? activeClasses : inactiveClasses} inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span class="nav-label" data-text="${item.label}"><span>${item.label}</span></span>
                        <svg class="icon text-red-500 text-xs" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-heart"/></svg>
                    </a>`;
        }

        return `                    <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="px-2 sm:px-2.5 md:px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium ${isActive ? activeClasses : inactiveClasses} inline-flex items-center whitespace-nowrap">
                        <span class="nav-label" data-text="${item.label}"><span>${item.label}</span></span>
                    </a>`;
    }).join('\n');

    // Mobile Sidebar Items (Clean left red border quote style)
    const mobileSidebarNavLinksHtml = navItems.map(item => {
        const isActive = activePage === item.id || (item.id === 'oss' && activePage === 'opensource');
        const activeClasses = 'bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium border-l-4 border-red-500';
        const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent';

        return `                <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="flex items-center px-4 py-3 text-base transition-all ${isActive ? activeClasses : inactiveClasses}">
                    <span>${item.label}</span>
                </a>`;
    }).join('\n');

    const isResume = activePage === 'resume';
    const isTips = activePage === 'tips';
    const githubRepo = isTips ? 'https://github.com/MrPunyapal/tips' : 'https://github.com/MrPunyapal/mrpunyapal.dev';
    const githubLabel = isTips ? 'View Tips repository on GitHub' : 'View source code on GitHub';

    const themeBtnInnerHtml = `<span class="theme-spider-btn-icon flex items-center justify-center text-slate-900 dark:text-white transition-colors duration-200" aria-hidden="true">
        <svg viewBox="0 0 100 100" width="16" height="16" fill="currentColor" aria-hidden="true" style="display:block;">
            <g stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
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
            <path d="M 44 65 Q 47 73 47 77" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" />
            <path d="M 56 65 Q 53 73 53 77" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" />
        </svg>
    </span>
    <span class="theme-mode-badge absolute -top-1 -right-1 pointer-events-none flex items-center justify-center z-10" aria-hidden="true">
        <svg class="hidden dark:block" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5" fill="#f59e0b"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg class="block dark:hidden" viewBox="0 0 24 24" width="10" height="10" fill="#6366f1" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    </span>`;

    const headerClasses = isResume 
        ? 'print:hidden border-b border-slate-200 dark:border-slate-800 relative z-20'
        : 'border-b border-slate-200 dark:border-slate-800 relative z-20';

    return `<header class="${headerClasses}" style="view-transition-name: site-header;">
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
                            <svg class="icon text-sm" viewBox="0 0 496 512" aria-hidden="true"><use href="#i-github"/></svg>
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
                            <svg class="icon text-sm" viewBox="0 0 496 512" aria-hidden="true"><use href="#i-github"/></svg>
                        </a>
                        <button type="button" data-theme-toggle aria-label="Toggle dark mode" title="Toggle theme" class="theme-toggle-btn relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded">
                            ${themeBtnInnerHtml}
                        </button>
                        <button type="button" data-mobile-menu-toggle aria-expanded="false" aria-controls="mobile-sidebar" aria-label="Open sidebar navigation menu" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
                                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
                                <a href="${githubRepo}" target="_blank" rel="noopener noreferrer" class="hover:text-slate-900 dark:hover:text-white transition-colors font-mono">GitHub ↗</a>
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

                    document.addEventListener('click', function(e) {
                        var openBtn = e.target.closest('[data-mobile-menu-toggle]');
                        if (openBtn) {
                            e.preventDefault();
                            openSidebar();
                            return;
                        }

                        var closeBtn = e.target.closest('[data-mobile-sidebar-close]');
                        var backdrop = e.target.closest('#mobile-sidebar-backdrop');
                        if (closeBtn || backdrop) {
                            e.preventDefault();
                            closeSidebar();
                            return;
                        }
                    });

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
