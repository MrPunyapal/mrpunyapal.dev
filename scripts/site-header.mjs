/**
 * Unified Site Navigation Header Component
 * Single Source of Truth for desktop and mobile navigation across all pages.
 */

export function renderSiteHeader(activePage = 'home') {
    const navItems = [
        { id: 'home', href: '/', label: 'Home' },
        { id: 'projects', href: '/projects', label: 'Projects' },
        { id: 'oss', href: '/opensource', label: 'Open Source', shortLabel: 'OSS', hasHeart: true },
        { id: 'tips', href: '/tips', label: 'Tips' },
        { id: 'resume', href: '/resume', label: 'Resume' },
        { id: 'talks', href: '/talks', label: 'Talks' },
    ];

    // Desktop Nav Items
    const desktopNavLinksHtml = navItems.map(item => {
        const isActive = activePage === item.id || (item.id === 'oss' && activePage === 'opensource');
        const activeClasses = 'text-slate-900 dark:text-white border-b-[2.5px] dark:border-b-2 border-red-500';
        const inactiveClasses = 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-[2.5px] dark:border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700';

        if (item.hasHeart) {
            return `                    <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="px-2.5 sm:px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium ${isActive ? activeClasses : inactiveClasses} transition-colors inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span class="sm:hidden">${item.shortLabel}</span><span class="hidden sm:inline">${item.label}</span>
                        <svg class="icon text-red-500 text-xs" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-heart"/></svg>
                    </a>`;
        }

        return `                    <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="px-2.5 sm:px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium ${isActive ? activeClasses : inactiveClasses} transition-colors inline-flex items-center whitespace-nowrap">
                        ${item.label}
                    </a>`;
    }).join('\n');

    // Mobile Sidebar Items (Clean text links, NO icons)
    const mobileSidebarNavLinksHtml = navItems.map(item => {
        const isActive = activePage === item.id || (item.id === 'oss' && activePage === 'opensource');
        const activeClasses = 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold border-l-2 border-red-500';
        const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border-l-2 border-transparent';

        return `                <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="flex items-center px-4 py-3 rounded-r-lg text-base transition-all ${isActive ? activeClasses : inactiveClasses}">
                    <span class="font-medium">${item.label}</span>
                </a>`;
    }).join('\n');

    const isResume = activePage === 'resume';
    const isTips = activePage === 'tips';
    const githubRepo = isTips ? 'https://github.com/MrPunyapal/tips' : 'https://github.com/MrPunyapal/mrpunyapal.dev';
    const githubLabel = isTips ? 'View Tips repository on GitHub' : 'View source code on GitHub';

    const resumeDownloadBtn = isResume ? `
                    <a href="/resume.pdf" download="Punyapal Shah" title="Download PDF Resume" aria-label="Download PDF Resume" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded">
                        <svg class="icon text-sm" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-download"/></svg>
                    </a>` : '';

    const headerClasses = isResume 
        ? 'print:hidden border-b border-slate-200 dark:border-slate-800 relative z-20'
        : 'border-b border-slate-200 dark:border-slate-800 relative z-20';

    return `<header class="${headerClasses}">
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
                    <div class="site-nav-utilities flex items-center gap-1 sm:gap-1.5 py-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800 shrink-0">${resumeDownloadBtn}
                        <a href="${githubRepo}" target="_blank" rel="noopener noreferrer" aria-label="${githubLabel}" class="site-nav-source p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded" title="GitHub Repository">
                            <svg class="icon text-sm" viewBox="0 0 496 512" aria-hidden="true"><use href="#i-github"/></svg>
                        </a>
                        <button type="button" data-theme-toggle aria-label="Toggle dark mode" title="Toggle theme" class="theme-toggle-btn p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded">
                        </button>
                    </div>
                </div>

                <!-- Mobile Header Bar (Visible on mobile < sm) -->
                <div class="flex sm:hidden items-center justify-between px-4 py-2.5 w-full">
                    <a href="/" aria-label="Home page" class="px-2 py-1 text-sm font-semibold text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors inline-flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true"></span>
                        <span>Home</span>
                    </a>

                    <div class="flex items-center gap-1.5">${resumeDownloadBtn}
                        <a href="${githubRepo}" target="_blank" rel="noopener noreferrer" aria-label="${githubLabel}" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded" title="GitHub Repository">
                            <svg class="icon text-sm" viewBox="0 0 496 512" aria-hidden="true"><use href="#i-github"/></svg>
                        </a>
                        <button type="button" data-theme-toggle aria-label="Toggle dark mode" title="Toggle theme" class="theme-toggle-btn p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded">
                        </button>
                        <button type="button" data-mobile-menu-toggle aria-expanded="false" aria-controls="mobile-sidebar" aria-label="Open sidebar navigation menu" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded ml-1 border border-slate-200 dark:border-slate-800">
                            <svg class="w-4 h-4" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M16 132h416c8.83 0 16-7.17 16-16V84c0-8.83-7.17-16-16-16H16C7.17 68 0 75.17 0 84v32c0 8.83 7.17 16 16 16zm0 160h416c8.83 0 16-7.17 16-16v-32c0-8.83-7.17-16-16-16H16c-8.83 0-16 7.17-16 16v32c0 8.83 7.17 16 16 16zm0 160h416c8.83 0 16-7.17 16-16v-32c0-8.83-7.17-16-16-16H16c-8.83 0-16 7.17-16 16v32c0 8.83 7.17 16 16 16z"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Off-Canvas Mobile Sidebar Drawer -->
                <div id="mobile-sidebar" class="hidden sm:hidden fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation sidebar">
                    <!-- Semi-transparent Blur Backdrop -->
                    <div id="mobile-sidebar-backdrop" class="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ease-in-out opacity-0" aria-hidden="true"></div>

                    <!-- Slide-Over Panel Container -->
                    <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
                        <div id="mobile-sidebar-panel" class="w-64 sm:w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-full flex flex-col">
                            
                            <!-- Sidebar Header Bar (Clean Close Button Only) -->
                            <div class="flex items-center justify-end px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                                <button type="button" data-mobile-sidebar-close aria-label="Close navigation menu" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <svg class="w-4 h-4" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
                                </button>
                            </div>

                            <!-- Sidebar Content Links -->
                            <div class="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
${mobileSidebarNavLinksHtml}
                            </div>

                            <!-- Sidebar Footer -->
                            <div class="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                <span class="font-medium">Punyapal Shah</span>
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

                        // Lock scrolling on both html and body
                        document.documentElement.style.overflow = 'hidden';
                        document.body.style.overflow = 'hidden';
                        document.documentElement.style.touchAction = 'none';
                        document.body.style.touchAction = 'none';

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

                        // Unlock scrolling
                        document.documentElement.style.overflow = '';
                        document.body.style.overflow = '';
                        document.documentElement.style.touchAction = '';
                        document.body.style.touchAction = '';

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
