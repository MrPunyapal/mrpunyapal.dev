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
        
        if (!btn.classList.contains('relative')) {
            btn.classList.add('relative');
        }

        // Completely remove legacy sun and moon icons if present
        const sunIcon = btn.querySelector('.theme-sun-icon');
        const moonIcon = btn.querySelector('.theme-moon-icon');
        if (sunIcon) sunIcon.remove();
        if (moonIcon) moonIcon.remove();

        let spiderIcon = btn.querySelector('.theme-spider-btn-icon');
        if (!spiderIcon) {
            spiderIcon = document.createElement('span');
            spiderIcon.className = 'theme-spider-btn-icon flex items-center justify-center transition-colors duration-200';
            spiderIcon.setAttribute('aria-hidden', 'true');
            spiderIcon.innerHTML = `<svg viewBox="0 0 100 100" width="16" height="16" fill="currentColor" aria-hidden="true" style="display:block;">
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
            </svg>`;
            
            btn.appendChild(spiderIcon);
        }
        
        // Pure White spider icon in Dark Mode, Obsidian Charcoal Black spider icon in Light Mode
        spiderIcon.style.color = isDark ? '#ffffff' : '#0f172a';

        // Top-Right Sun / Moon Indicator Badge
        let badge = btn.querySelector('.theme-mode-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'theme-mode-badge absolute -top-1 -right-1 pointer-events-none flex items-center justify-center z-10';
            badge.setAttribute('aria-hidden', 'true');
            btn.appendChild(badge);
        }

        if (!badge.children.length) {
            badge.innerHTML = `<svg class="hidden dark:block" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
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
            </svg>`;
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
    return `<svg class="real-spider-svg" viewBox="0 0 120 70" width="84" height="49">
      <!-- 3D Far Legs Group (Drawn behind body, thinner 1.8px stroke, 0.75 opacity for depth perspective) -->
      <g class="spider-legs-far">
        <!-- Far Top Leg 1 -->
        <path d="M 64 30 Q 74 16 86 10 Q 92 8 96 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
        <!-- Far Top Leg 3 -->
        <path d="M 50 30 Q 42 16 30 10 Q 22 8 18 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
        <!-- Far Top Leg 2 -->
        <path d="M 58 30 Q 66 16 78 10 Q 86 8 90 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
        <!-- Far Top Leg 4 -->
        <path d="M 44 30 Q 32 16 20 10 Q 14 8 10 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
      </g>

      <!-- Far Pedipalp Feeler -->
      <path d="M 68 31 Q 74 29 80 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />

      <!-- Cephalothorax (Head) -->
      <ellipse cx="60" cy="35" rx="8" ry="6" fill="currentColor" />

      <!-- Eyes (4 Specular Glint Dots) -->
      <circle cx="65" cy="32.5" r="1" fill="#ffffff" />
      <circle cx="65" cy="37.5" r="1" fill="#ffffff" />
      <circle cx="66.8" cy="33.8" r="0.7" fill="#ffffff" />
      <circle cx="66.8" cy="36.2" r="0.7" fill="#ffffff" />

      <!-- Abdomen -->
      <ellipse class="spider-abdomen" cx="42" cy="35" rx="13" ry="9" fill="currentColor" />

      <!-- Near Pedipalp Feeler -->
      <path d="M 68 39 Q 74 41 80 44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />

      <!-- 3D Near Legs Group (Drawn in front of body, full opacity 1.0, 2.5px stroke for foreground depth) -->
      <g class="spider-legs-near">
        <!-- Near Bottom Leg 1 -->
        <path d="M 64 40 Q 74 54 86 60 Q 92 62 96 59" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Near Bottom Leg 3 -->
        <path d="M 50 40 Q 42 54 30 60 Q 22 62 18 59" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Near Bottom Leg 2 -->
        <path d="M 58 40 Q 66 54 78 60 Q 86 62 90 59" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Near Bottom Leg 4 -->
        <path d="M 44 40 Q 32 54 20 60 Q 14 62 10 59" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </svg>`;
}

export function toggleTheme(eventOrElement) {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const isDarkNext = nextTheme === 'dark';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // Safely extract Element node from event or element parameter
    let toggleBtn = null;
    if (eventOrElement && typeof eventOrElement.getBoundingClientRect === 'function') {
        toggleBtn = eventOrElement;
    } else if (eventOrElement?.target && typeof eventOrElement.target.closest === 'function') {
        toggleBtn = eventOrElement.target.closest('[data-theme-toggle]');
    }
    if (!toggleBtn || typeof toggleBtn.getBoundingClientRect !== 'function') {
        toggleBtn = document.querySelector('[data-theme-toggle]');
    }

    // Temporarily hide elephpant easter egg during spider theme animation if currently visible
    const runningElephpant = document.getElementById('runningElephpant');
    const isElephpantVisible = runningElephpant && 
        !runningElephpant.classList.contains('hidden-behind-door') && 
        !runningElephpant.classList.contains('returning-home') && 
        runningElephpant.style.opacity !== '0' && 
        getComputedStyle(runningElephpant).opacity !== '0';

    if (runningElephpant && isElephpantVisible) {
        runningElephpant.style.transition = 'opacity 0.25s ease';
        runningElephpant.style.opacity = '0';
        runningElephpant.style.pointerEvents = 'none';
    }

    const restoreElephpant = () => {
        if (runningElephpant && isElephpantVisible) {
            // Only restore if the elephpant is NOT parked behind the door
            if (!runningElephpant.classList.contains('hidden-behind-door') && !runningElephpant.classList.contains('returning-home')) {
                runningElephpant.style.opacity = '1';
                runningElephpant.style.pointerEvents = 'auto';
            }
        }
    };

    let btnX = window.innerWidth * 0.85;
    let btnY = 20;
    if (toggleBtn && typeof toggleBtn.getBoundingClientRect === 'function') {
        const btnRect = toggleBtn.getBoundingClientRect();
        btnX = btnRect.left + btnRect.width * 0.5;
        btnY = btnRect.top + btnRect.height * 0.5;
    }

    // Mobile dropTargetY is identical for both dark and light modes: after button, before center, closer to center (35% of height)
    const verticalY = window.innerHeight * 0.5;
    const curtainStartY = isDarkNext ? 40 : (window.innerHeight - 40);
    const dropTargetY = isMobile ? window.innerHeight * 0.35 : verticalY;
    const dropX = btnX;
    const dropStartY = btnY;

    // Desktop: Horizontal curtain sweep across X. Mobile: Vertical curtain sweep across Y.
    const curtainStartX = isDarkNext ? 40 : (window.innerWidth - 40);
    const endX = isDarkNext ? (window.innerWidth + 95) : -95;
    const endY = isDarkNext ? (window.innerHeight + 95) : -95;

    const baseAngle = isMobile 
        ? (isDarkNext ? 90 : -90)
        : (isDarkNext ? 0 : 180);

    const clipPath = isMobile
        ? (isDarkNext
            ? ['polygon(0 0, 100% 0, 100% 0, 0 0)', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)']
            : ['polygon(0 100%, 100% 100%, 100% 100%, 0 100%)', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'])
        : (isDarkNext
            ? ['polygon(0 0, 0 0, 0 100%, 0 100%)', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)']
            : ['polygon(100% 0, 100% 0, 100% 100%, 100% 100%)', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)']);

    // Switch the theme outright when there is no crawl to show.
    if (!document.startViewTransition || prefersReducedMotion) {
        setTheme(nextTheme);
        restoreElephpant();
        return;
    }

    // Get or create permanent spider element before startViewTransition runs
    let crawler = document.querySelector('.theme-spider-crawler');
    if (!crawler) {
        crawler = document.createElement('div');
        crawler.setAttribute('aria-hidden', 'true');
        document.body.appendChild(crawler);
    }
    crawler.innerHTML = getRealisticSpiderHTML();
    crawler.className = `theme-spider-crawler ${isDarkNext ? 'dark-spider' : 'light-spider'} active-spider`;
    crawler.style.transform = `translate(${dropX}px, ${dropStartY}px) rotate(90deg)`;

    // Create vertical drop-down silk thread element
    let silkLine = document.querySelector('.spider-drop-silk-line');
    if (!silkLine) {
        silkLine = document.createElement('div');
        silkLine.className = 'spider-drop-silk-line';
        silkLine.setAttribute('aria-hidden', 'true');
        document.body.appendChild(silkLine);
    }
    silkLine.style.left = `${dropX}px`;
    silkLine.style.top = `${dropStartY}px`;
    silkLine.style.height = '0px';
    silkLine.style.display = 'block';

    // Step 1: Drop down directly from clicked Theme Button on a silk thread
    const dropDuration = 580;
    const dropAnim = crawler.animate([
        { transform: `translate(${dropX}px, ${dropStartY}px) rotate(90deg)`, opacity: 1 },
        { transform: `translate(${dropX}px, ${dropTargetY}px) rotate(90deg)`, opacity: 1 }
    ], {
        duration: dropDuration,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });

    silkLine.animate([
        { height: '0px', opacity: 1 },
        { height: `${Math.max(0, dropTargetY - dropStartY)}px`, opacity: 1 }
    ], {
        duration: dropDuration,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });

    dropAnim.onfinish = () => {
        silkLine.style.display = 'none';

        // Step 2: Walk to start edge (top for Dark Mode, bottom for Light Mode) & perform 180deg U-turn
        const prepDuration = 1000;
        const prepKeyframes = [];
        const prepSteps = 10;
        const mobileTargetX = window.innerWidth * 0.5;

        for (let i = 0; i <= prepSteps; i++) {
            const progress = i / prepSteps;
            const sway = (i % 2 === 0 ? 2 : -2);

            if (isMobile) {
                // Mobile Diagonal Cross Walk:
                // Walk diagonally in cross from (dropX, dropTargetY) to (mobileTargetX, curtainStartY) facing travel vector angle, then U-turn at edge
                const currentX = dropX + (mobileTargetX - dropX) * progress;
                const currentY = dropTargetY + (curtainStartY - dropTargetY) * progress;

                const dx = mobileTargetX - dropX;
                const dy = curtainStartY - dropTargetY;
                const travelAngle = Math.atan2(dy, dx) * (180 / Math.PI);

                let currentAngle;
                if (progress < 0.7) {
                    currentAngle = travelAngle;
                } else {
                    const turnP = (progress - 0.7) / 0.3;
                    const targetAngle = isDarkNext ? 90 : -90;
                    currentAngle = travelAngle + (targetAngle - travelAngle) * turnP;
                }

                prepKeyframes.push({
                    transform: `translate(${currentX}px, ${currentY}px) rotate(${currentAngle + sway}deg)`,
                    opacity: 1
                });
            } else {
                // Desktop: Walk to left/right edge and perform 180deg U-Turn
                const currentX = dropX + (curtainStartX - dropX) * progress;
                let currentAngle;
                if (isDarkNext) {
                    currentAngle = progress < 0.7 ? 180 : (180 - 180 * ((progress - 0.7) / 0.3));
                } else {
                    currentAngle = progress < 0.7 ? 0 : (0 + 180 * ((progress - 0.7) / 0.3));
                }
                prepKeyframes.push({
                    transform: `translate(${currentX}px, ${verticalY}px) rotate(${currentAngle + sway}deg)`,
                    opacity: 1
                });
            }
        }

        const prepAnim = crawler.animate(prepKeyframes, {
            duration: prepDuration,
            easing: 'ease-in-out'
        });

        prepAnim.onfinish = () => {
            // Step 3: Perform View Transition curtain sweep across the page (Horizontal for Desktop, Vertical for Mobile)
            const sweepDuration = 2500;
            const sweepKeyframes = [];
            const sweepSteps = 20;

            for (let i = 0; i <= sweepSteps; i++) {
                const progress = i / sweepSteps;
                const sway = (i % 2 === 0 ? 2.5 : -2.5);

                if (isMobile) {
                    // Mobile Vertical Crawl: Starts seamlessly at curtainStartY (top 40px or bottom height-40px) and scuttles full-screen to endY
                    const currentY = curtainStartY + (endY - curtainStartY) * progress;
                    sweepKeyframes.push({
                        transform: `translate(${mobileTargetX}px, ${currentY}px) rotate(${baseAngle + sway}deg)`,
                        opacity: 1
                    });
                } else {
                    // Desktop Horizontal Crawl across X axis
                    const currentX = curtainStartX + (endX - curtainStartX) * progress;
                    sweepKeyframes.push({
                        transform: `translate(${currentX}px, ${verticalY}px) rotate(${baseAngle + sway}deg)`,
                        opacity: 1
                    });
                }
            }

            const transition = document.startViewTransition(() => {
                setTheme(nextTheme);
            });

            transition.ready.then(() => {
                const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';

                const spiderAnim = crawler.animate(sweepKeyframes, {
                    duration: sweepDuration,
                    easing: easing
                });

                const curtainAnim = document.documentElement.animate(
                    { clipPath: clipPath },
                    {
                        duration: sweepDuration,
                        easing: easing,
                        pseudoElement: '::view-transition-new(root)'
                    }
                );

                spiderAnim.currentTime = 0;
                curtainAnim.currentTime = 0;

                spiderAnim.onfinish = () => {
                    crawler.classList.remove('active-spider');
                    restoreElephpant();
                };
            });
        };
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
