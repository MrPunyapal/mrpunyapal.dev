import './tailwind.css';
import './app.css';
import './theme.js';

// Custom Element definition for <site-header>
if (typeof customElements !== 'undefined' && !customElements.get('site-header')) {
    class SiteHeader extends HTMLElement {
        connectedCallback() {
            // Pre-rendered at build-time for 0 CLS and instant SEO
        }
    }
    customElements.define('site-header', SiteHeader);
}
