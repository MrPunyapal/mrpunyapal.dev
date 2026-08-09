/**
 * Unified Site Navigation Header Component
 * Single Source of Truth for desktop and mobile navigation across all pages.
 */

export function renderSiteHeader(activePage = 'home') {
    const navItems = [
        { id: 'home', href: '/', label: 'Home', isHome: true, icon: '<svg class="w-4 h-4" viewBox="0 0 576 512" fill="currentColor" aria-hidden="true"><path d="M280.37 148.26 96 300.4V464c0 26.5 21.5 48 48 48h96V368c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16v144h96c26.5 0 48-21.5 48-48V300.3L295.67 148.26c-4.42-3.65-10.88-3.65-15.3 0zM571.6 251.47 488 182.34V44c0-6.63-5.37-12-12-12h-56c-6.63 0-12 5.37-12 12v74.12L318.4 37.6c-17.69-14.61-43.11-14.61-60.8 0L4.4 251.47c-5.1 4.21-5.82 11.77-1.61 16.87l25.6 30.98c4.21 5.1 11.77 5.82 16.87 1.61L280.37 82.26c4.42-3.65 10.88-3.65 15.3 0l235.11 218.67c5.1 4.21 12.66 3.49 16.87-1.61l25.6-30.98c4.21-5.1 3.49-12.66-1.65-16.87z"/></svg>' },
        { id: 'projects', href: '/projects', label: 'Projects', icon: '<svg class="w-4 h-4" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M464 128H352V80c0-26.5-21.5-48-48-48H208c-26.5 0-48 21.5-48 48v48H48c-26.5 0-48 21.5-48 48v256c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V176c0-26.5-21.5-48-48-48zM208 80h96v48h-96V80z"/></svg>' },
        { id: 'oss', href: '/opensource', label: 'Open Source', shortLabel: 'OSS', hasHeart: true, icon: '<svg class="w-4 h-4 text-red-500" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"/></svg>' },
        { id: 'tips', href: '/tips', label: 'Tips', icon: '<svg class="w-4 h-4" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><path d="M192 0C86 0 0 86 0 192c0 77.4 46.2 144.1 112 174.1V416c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32v-49.9c65.8-30 112-96.7 112-174.1C384 86 298 0 192 0zm-32 464c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16h-48c-8.8 0-16-7.2-16-16v-16z"/></svg>' },
        { id: 'resume', href: '/resume', label: 'Resume', icon: '<svg class="w-4 h-4" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><path d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"/></svg>' },
        { id: 'talks', href: '/talks', label: 'Talks', icon: '<svg class="w-4 h-4" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M384 192c0-88.4-71.6-160-160-160S64 103.6 64 192c0 34.4 10.9 66.3 29.5 92.6L48 448l163.4-45.4C217 403 221.5 403.4 224 403.4c88.4 0 160-71.6 160-160z"/></svg>' },
    ];

    // Desktop Nav Items
    const desktopNavLinksHtml = navItems.map(item => {
        const isActive = activePage === item.id || (item.id === 'oss' && activePage === 'opensource');
        const activeClasses = 'text-slate-900 dark:text-white border-b-[2.5px] dark:border-b-2 border-red-500';
        const inactiveClasses = 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-[2.5px] dark:border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-700';

        if (item.isHome) {
            return `                    <a href="${item.href}" aria-label="Home"${isActive ? ' aria-current="page"' : ''} class="px-2.5 sm:px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium ${isActive ? activeClasses : inactiveClasses} transition-colors inline-flex items-center whitespace-nowrap">
                        <span class="site-nav-home-label">Home</span><svg class="site-nav-home-icon icon text-sm" viewBox="0 0 576 512" aria-hidden="true"><path d="M280.37 148.26 96 300.4V464c0 26.5 21.5 48 48 48h96V368c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16v144h96c26.5 0 48-21.5 48-48V300.3L295.67 148.26c-4.42-3.65-10.88-3.65-15.3 0zM571.6 251.47 488 182.34V44c0-6.63-5.37-12-12-12h-56c-6.63 0-12 5.37-12 12v74.12L318.4 37.6c-17.69-14.61-43.11-14.61-60.8 0L4.4 251.47c-5.1 4.21-5.82 11.77-1.61 16.87l25.6 30.98c4.21 5.1 11.77 5.82 16.87 1.61L280.37 82.26c4.42-3.65 10.88-3.65 15.3 0l235.11 218.67c5.1 4.21 12.66 3.49 16.87-1.61l25.6-30.98c4.21-5.1 3.49-12.66-1.65-16.87z"/></svg>
                    </a>`;
        }

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

    // Mobile Sidebar Items
    const mobileSidebarNavLinksHtml = navItems.map(item => {
        const isActive = activePage === item.id || (item.id === 'oss' && activePage === 'opensource');
        const activeClasses = 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold border-l-2 border-red-500';
        const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border-l-2 border-transparent';

        return `                <a href="${item.href}"${isActive ? ' aria-current="page"' : ''} class="flex items-center gap-3.5 px-3.5 py-3 rounded-r-lg text-sm transition-all ${isActive ? activeClasses : inactiveClasses}">
                    <span class="shrink-0 text-slate-400 dark:text-slate-500 ${isActive ? 'text-red-500 dark:text-red-400' : ''}">${item.icon}</span>
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
                    <a href="/" aria-label="Home - Punyapal Shah" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded">
                        <svg class="w-4.5 h-4.5" viewBox="0 0 576 512" fill="currentColor" aria-hidden="true"><path d="M280.37 148.26 96 300.4V464c0 26.5 21.5 48 48 48h96V368c0-8.8 7.2-16 16-16h64c8.8 0 16 7.2 16 16v144h96c26.5 0 48-21.5 48-48V300.3L295.67 148.26c-4.42-3.65-10.88-3.65-15.3 0zM571.6 251.47 488 182.34V44c0-6.63-5.37-12-12-12h-56c-6.63 0-12 5.37-12 12v74.12L318.4 37.6c-17.69-14.61-43.11-14.61-60.8 0L4.4 251.47c-5.1 4.21-5.82 11.77-1.61 16.87l25.6 30.98c4.21 5.1 11.77 5.82 16.87 1.61L280.37 82.26c4.42-3.65 10.88-3.65 15.3 0l235.11 218.67c5.1 4.21 12.66 3.49 16.87-1.61l25.6-30.98c4.21-5.1 3.49-12.66-1.65-16.87z"/></svg>
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
                <div id="mobile-sidebar" class="hidden sm:hidden fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="sidebar-nav-title">
                    <!-- Semi-transparent Blur Backdrop -->
                    <div id="mobile-sidebar-backdrop" class="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ease-in-out opacity-0" aria-hidden="true"></div>

                    <!-- Slide-Over Panel Container -->
                    <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
                        <div id="mobile-sidebar-panel" class="w-72 sm:w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-full flex flex-col">
                            
                            <!-- Sidebar Header Bar -->
                            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                                <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true"></span>
                                    <h2 id="sidebar-nav-title" class="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Navigation</h2>
                                </div>
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

                    function openSidebar() {
                        var sidebar = document.getElementById('mobile-sidebar');
                        var backdrop = document.getElementById('mobile-sidebar-backdrop');
                        var panel = document.getElementById('mobile-sidebar-panel');
                        var toggleBtn = document.querySelector('[data-mobile-menu-toggle]');
                        if (!sidebar || !backdrop || !panel) return;

                        sidebar.classList.remove('hidden');
                        document.body.style.overflow = 'hidden';

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

                        document.body.style.overflow = '';

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
