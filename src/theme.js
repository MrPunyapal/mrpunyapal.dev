// Theme Management Module for Dark Mode

export function getPreferredTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function updateToggleButtons(theme) {
    const isDark = theme === 'dark';
    const buttons = document.querySelectorAll('[data-theme-toggle]');
    buttons.forEach(btn => {
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        
        const sunIcon = btn.querySelector('.theme-sun-icon');
        const moonIcon = btn.querySelector('.theme-moon-icon');
        if (sunIcon && moonIcon) {
            if (isDark) {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            } else {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            }
        }
    });
}

export function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    updateToggleButtons(theme);
}

function spawnSpiderCrawler(isDarkNext, duration) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const crawler = document.createElement('div');
    crawler.className = `theme-spider-crawler ${isDarkNext ? 'dark-spider' : 'light-spider'}`;
    crawler.setAttribute('aria-hidden', 'true');
    crawler.innerHTML = getRealisticSpiderHTML();
    document.body.appendChild(crawler);

    const verticalY = window.innerHeight * 0.5; // Exact vertical center of screen
    
    // Position spider 45px AHEAD of the curtain leading edge!
    const leadOffset = 45;
    const startX = isDarkNext ? (-45 + leadOffset) : (window.innerWidth + 45 - leadOffset);
    const endX = isDarkNext ? (window.innerWidth + 45 + leadOffset) : (-45 - leadOffset);
    const rotation = isDarkNext ? 'rotate(90deg)' : 'rotate(-90deg)';

    const anim = crawler.animate([
        {
            transform: `translate(${startX}px, ${verticalY}px) ${rotation}`,
            opacity: 1
        },
        {
            transform: `translate(${endX}px, ${verticalY}px) ${rotation}`,
            opacity: 1
        }
    ], {
        duration: duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });

    anim.onfinish = () => crawler.remove();
}

function getRealisticSpiderHTML() {
    return `<svg class="real-spider-svg" viewBox="0 0 150 100" width="105" height="70">
      <!-- Tight Realistic Cast Shadow -->
      <ellipse cx="65" cy="53" rx="28" ry="16" fill="rgba(0,0,0,0.3)" filter="blur(2px)" />
      
      <!-- Dotted Viscid Silk Fiber connected to spinneret -->
      <g class="spider-silk-fiber-group">
        <line class="spider-silk-fiber-line" x1="35" y1="50" x2="0" y2="50" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 7" />
        <circle cx="28" cy="50" r="2" fill="currentColor" class="silk-bead" />
        <circle cx="20" cy="50" r="2.4" fill="currentColor" class="silk-bead" />
        <circle cx="12" cy="50" r="2" fill="currentColor" class="silk-bead" />
        <circle cx="4" cy="50" r="2.2" fill="currentColor" class="silk-bead" />
      </g>

      <!-- Top Legs Group A (Alternating Gait Group A) -->
      <g class="spider-legs-group-a">
        <!-- Leg 1L (Front Top) -->
        <path d="M 75 44 Q 85 30 96 18 Q 102 12 108 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Leg 3L (Back-Mid Top) -->
        <path d="M 60 44 Q 54 28 44 14 Q 38 8 32 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Leg 2R (Mid Bottom) -->
        <path d="M 68 56 Q 74 72 82 86 Q 88 92 94 88" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Leg 4R (Hind Bottom) -->
        <path d="M 52 56 Q 38 70 28 82 Q 22 88 18 84" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- Bottom Legs Group B (Alternating Gait Group B) -->
      <g class="spider-legs-group-b">
        <!-- Leg 2L (Mid Top) -->
        <path d="M 68 44 Q 74 28 84 14 Q 90 8 96 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Leg 4L (Hind Top) -->
        <path d="M 52 44 Q 38 30 28 18 Q 22 12 18 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Leg 1R (Front Bottom) -->
        <path d="M 75 56 Q 85 70 96 82 Q 102 88 108 84" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Leg 3R (Back-Mid Bottom) -->
        <path d="M 60 56 Q 54 72 44 86 Q 38 92 32 88" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- Pedipalps (Front Fangs facing RIGHT) -->
      <path d="M 85 47 Q 95 45 102 42" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 85 53 Q 95 55 102 58" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />

      <!-- Cephalothorax (Head at right) -->
      <ellipse cx="78" cy="50" rx="10" ry="8" fill="currentColor" />

      <!-- Eyes (Facing Right) -->
      <circle cx="84" cy="47" r="1.3" fill="#ffffff" />
      <circle cx="84" cy="53" r="1.3" fill="#ffffff" />
      <circle cx="86" cy="48.5" r="1" fill="#ffffff" />
      <circle cx="86" cy="51.5" r="1" fill="#ffffff" />

      <!-- Abdomen (Tail at left) -->
      <ellipse class="spider-abdomen" cx="54" cy="50" rx="16" ry="11" fill="currentColor" />
    </svg>`;
}

export function toggleTheme(event) {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const isDarkNext = nextTheme === 'dark';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = 2500;

    // Get or create permanent spider element before startViewTransition runs
    let crawler = document.querySelector('.theme-spider-crawler');
    if (!crawler) {
        crawler = document.createElement('div');
        crawler.className = 'theme-spider-crawler';
        crawler.setAttribute('aria-hidden', 'true');
        crawler.innerHTML = getRealisticSpiderHTML();
        document.body.appendChild(crawler);
    }
    crawler.className = `theme-spider-crawler ${isDarkNext ? 'dark-spider' : 'light-spider'} active-spider`;

    if (!document.startViewTransition || prefersReducedMotion) {
        setTheme(nextTheme);
        return;
    }

    const verticalY = window.innerHeight * 0.5;
    const leadOffset = 50;
    const startX = isDarkNext ? (-45 + leadOffset) : (window.innerWidth + 45 - leadOffset);
    const endX = isDarkNext ? (window.innerWidth + 45 + leadOffset) : (-45 - leadOffset);

    // Generate realistic scuttle micro-steps with organic torso sway
    const keyframes = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const currentX = startX + (endX - startX) * progress;
        const baseAngle = isDarkNext ? 0 : 180;
        // Natural torso sway (+/- 2.5deg) on alternating scuttle strides
        const sway = (i % 2 === 0 ? 2.5 : -2.5);
        keyframes.push({
            transform: `translate(${currentX}px, ${verticalY}px) rotate(${baseAngle + sway}deg)`,
            opacity: 1
        });
    }

    // Animate spider WAAPI before startViewTransition so its layer is captured in top-layer group
    const spiderAnim = crawler.animate(keyframes, {
        duration: duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });

    const transition = document.startViewTransition(() => {
        setTheme(nextTheme);
    });

    transition.ready.then(() => {
        const clipPath = isDarkNext
            ? [
                'polygon(0 0, 0 0, 0 100%, 0 100%)',
                'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
              ]
            : [
                'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
                'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
              ];

        document.documentElement.animate(
            { clipPath: clipPath },
            {
                duration: duration,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                pseudoElement: '::view-transition-new(root)'
            }
        );
    });

    spiderAnim.onfinish = () => {
        crawler.classList.remove('active-spider');
    };
}

export function initTheme() {
    const theme = getPreferredTheme();
    setTheme(theme);

    // Watch system preference changes if user has not explicitly chosen a preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    // Delegate click events for any theme toggle button
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-theme-toggle]');
        if (toggleBtn) {
            e.preventDefault();
            toggleTheme(e);
        }
    });
}

// Auto-initialize when loaded as module or script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}
