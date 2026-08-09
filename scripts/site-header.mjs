/**
 * Unified Site Navigation Header Component
 * Single Source of Truth for desktop and mobile navigation across all pages.
 */

export function renderSiteHeader(activePage = 'home') {
    const navItems = [
        { id: 'home', href: '/', label: 'Home', isHome: true },
        { id: 'projects', href: '/projects', label: 'Projects' },
        { id: 'oss', href: '/opensource', label: 'Open Source', shortLabel: 'OSS', hasHeart: true },
        { id: 'tips', href: '/tips', label: 'Tips' },
        { id: 'resume', href: '/resume', label: 'Resume' },
        { id: 'talks', href: '/talks', label: 'Talks' },
    ];

    const navLinksHtml = navItems.map(item => {
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

    const isResume = activePage === 'resume';
    const isTips = activePage === 'tips';
    const githubRepo = isTips ? 'https://github.com/MrPunyapal/tips' : 'https://github.com/MrPunyapal/mrpunyapal.dev';
    const githubLabel = isTips ? 'View Tips repository on GitHub' : 'View source code on GitHub';

    const resumeDownloadBtn = isResume ? `
                    <a href="/resume.pdf" download="Punyapal Shah" title="Download PDF Resume" aria-label="Download PDF Resume" class="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center rounded">
                        <svg class="icon text-sm" viewBox="0 0 512 512" aria-hidden="true"><use href="#i-download"/></svg>
                    </a>` : '';

    const headerClasses = isResume 
        ? 'print:hidden border-b border-slate-200 dark:border-slate-800 flex items-center relative z-20'
        : 'border-b border-slate-200 dark:border-slate-800 relative z-20';

    return `<header class="${headerClasses}">
                <!-- Horizontal Line Extension -->
                <div class="tech-line-h bottom-[-1px]"></div>

                <!-- Intersections with outer border -->
                <div class="tech-marker -bottom-[4px] -left-[4px]"></div>
                <div class="tech-marker -bottom-[4px] -right-[4px]"></div>

                <!-- Inner scrollable row -->
                <div class="site-nav-row flex items-center overflow-x-auto px-4 sm:px-6 w-full">

                <!-- Spacer pushes nav to the right; shrinks to 0 before nav ever wraps -->
                <div class="site-nav-spacer flex-1 min-w-0" aria-hidden="true"></div>

                <!-- Navigation Tabs -->
                <nav aria-label="Main Navigation" class="site-nav-tabs flex items-center -mb-[1px] shrink-0">
${navLinksHtml}
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
            </header>`;
}
