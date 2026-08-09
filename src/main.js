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
