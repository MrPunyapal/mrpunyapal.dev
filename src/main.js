import './tailwind.css';
import './app.css';
import './theme.js';

// Custom Element definition for <site-header>
if (typeof customElements !== 'undefined' && !customElements.get('site-header')) {
    class SiteHeader extends HTMLElement {
        connectedCallback() {
            this.setupMobileMenu();
        }

        setupMobileMenu() {
            const toggleBtn = this.querySelector('[data-mobile-menu-toggle]');
            const drawer = this.querySelector('#mobile-menu-drawer');
            if (!toggleBtn || !drawer) return;

            const openIcon = toggleBtn.querySelector('.icon-menu-open');
            const closeIcon = toggleBtn.querySelector('.icon-menu-close');

            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isClosed = drawer.classList.contains('hidden');
                if (isClosed) {
                    drawer.classList.remove('hidden');
                    toggleBtn.setAttribute('aria-expanded', 'true');
                    openIcon?.classList.add('hidden');
                    closeIcon?.classList.remove('hidden');
                } else {
                    drawer.classList.add('hidden');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                    openIcon?.classList.remove('hidden');
                    closeIcon?.classList.add('hidden');
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !drawer.classList.contains('hidden')) {
                    drawer.classList.add('hidden');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                    openIcon?.classList.remove('hidden');
                    closeIcon?.classList.add('hidden');
                }
            });
        }
    }
    customElements.define('site-header', SiteHeader);
}

// Copy to clipboard handler for code blocks
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.copy-code-btn');
        if (!btn) return;
        const container = btn.closest('.code-block-wrapper');
        if (!container) return;
        const code = container.querySelector('code');
        if (!code) return;
        const text = code.innerText || code.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
            const copyText = btn.querySelector('.copy-text');
            if (copyText) {
                const originalText = copyText.textContent;
                copyText.textContent = 'Copied!';
                setTimeout(() => {
                    copyText.textContent = originalText;
                }, 2000);
            }
        }).catch(() => {});
    });
}
