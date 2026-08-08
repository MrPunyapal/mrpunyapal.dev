let currentPhrase = 0;
let currentChar = 0;
let isDeleting = false;
let typingInterval;

const phrases = [
    "Laravel Engineer",
    "Open Source Maintainer",
    "Core Team @ Pinkary",
    "Core Team @ Pest",
    "Community Builder",
    "Speaker",
    "Content Creator",
];

function typeAnimation() {
    const typingText = document.getElementById('typingText');
    if (!typingText) return;
    
    const fullText = phrases[currentPhrase];
    
    let newText = "";
    if (isDeleting) {
        newText = fullText.substring(0, currentChar - 1);
        currentChar--;
    } else {
        newText = fullText.substring(0, currentChar + 1);
        currentChar++;
    }

    typingText.textContent = newText;
    
    let typeSpeed = isDeleting ? 50 : 100;
    
    if (!isDeleting && currentChar === fullText.length) {
        typeSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && currentChar === 0) {
        isDeleting = false;
        currentPhrase = (currentPhrase + 1) % phrases.length;
        typeSpeed = 500;
    }
    
    clearTimeout(typingInterval);
    typingInterval = setTimeout(typeAnimation, typeSpeed);
}

function trackEvent(event, details) {
    if (typeof gtag !== 'undefined') {
        gtag('event', event, details);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const typingText = document.getElementById('typingText');
    if (typingText) {
        currentChar = phrases[0].length;
        isDeleting = true;
        setTimeout(typeAnimation, 3000);
    }
    
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.addEventListener('click', function() {
            trackEvent('external_link_click', {
                url: this.href,
                text: this.textContent.trim()
            });
        });
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Door & Lazy Loaded PHP Elephpant Interaction System
    const doorContainer = document.getElementById('door-container');
    const doorMessage = document.getElementById('doorMessage');
    let isElephpantHome = false;
    let elephpantInitialized = false;

    // The door's visible text changes as the elephpant comes and goes, so set the
    // accessible name from it. WCAG 2.5.3 requires the accessible name to contain
    // the visible label, and the two drift apart if they are updated separately.
    function setDoorMessage(text, hint) {
        if (doorMessage) doorMessage.textContent = text;
        if (doorContainer) doorContainer.setAttribute('aria-label', `${text}: ${hint}`);
    }

    // Confetti effect
    function createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: 50%;
                left: 50%;
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
                animation: confettiFall ${1 + Math.random() * 2}s linear forwards;
                transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
            `;
            confetti.style.setProperty('--tx', (Math.random() - 0.5) * 1000 + 'px');
            confetti.style.setProperty('--ty', Math.random() * 1000 + 'px');
            confetti.style.setProperty('--rz', Math.random() * 720 + 'deg');
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }
    }
    
    // Fireworks effect
    function createFireworks() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const x = 20 + Math.random() * 60;
                const y = 20 + Math.random() * 60;
                for (let j = 0; j < 30; j++) {
                    const particle = document.createElement('div');
                    particle.style.cssText = `
                        position: fixed;
                        width: 6px;
                        height: 6px;
                        background: ${colors[Math.floor(Math.random() * colors.length)]};
                        top: ${y}%;
                        left: ${x}%;
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 9998;
                        box-shadow: 0 0 10px currentColor;
                    `;
                    const angle = (j / 30) * Math.PI * 2;
                    const velocity = 100 + Math.random() * 100;
                    const tx = Math.cos(angle) * velocity;
                    const ty = Math.sin(angle) * velocity;
                    particle.style.animation = `fireworkParticle 1s ease-out forwards`;
                    particle.style.setProperty('--tx', tx + 'px');
                    particle.style.setProperty('--ty', ty + 'px');
                    document.body.appendChild(particle);
                    
                    setTimeout(() => particle.remove(), 1000);
                }
            }, i * 300);
        }
    }
    
    // Elephpant trumpet sound (simple beep using Web Audio API)
    function playTrumpetSound() {
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }

    // Responsive Door Positioning
    function positionDoor() {
        const desktopPlaceholder = document.getElementById('desktop-door-placeholder');
        const mobilePlaceholder = document.getElementById('mobile-door-placeholder');
        
        if (!desktopPlaceholder || !mobilePlaceholder || !doorContainer) return;

        if (window.innerWidth < 768) {
            // Mobile: Move to bottom placeholder
            if (doorContainer.parentElement !== mobilePlaceholder) {
                mobilePlaceholder.appendChild(doorContainer);
            }
        } else {
            // Desktop: Move to about section placeholder
            if (doorContainer.parentElement !== desktopPlaceholder) {
                desktopPlaceholder.appendChild(doorContainer);
            }
        }
    }

    positionDoor();
    window.addEventListener('resize', positionDoor);

    function getElephpant() {
        return document.getElementById('runningElephpant');
    }

    function initElephpant() {
        let elephpant = getElephpant();
        if (elephpant) return elephpant;

        const template = document.getElementById('elephpantTemplate');
        if (template) {
            const clone = template.content.cloneNode(true);
            document.body.appendChild(clone);
            elephpant = getElephpant();
        }

        if (!elephpant) return null;
        if (elephpantInitialized) return elephpant;
        elephpantInitialized = true;

        let isPartyMode = false;

        elephpant.style.pointerEvents = 'auto';
        elephpant.style.cursor = 'pointer';

        elephpant.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (isPartyMode) {
                elephpant.classList.remove('party-mode');
                isPartyMode = false;
            } else {
                elephpant.classList.add('party-mode');
                isPartyMode = true;
                createConfetti();
                createFireworks();
                playTrumpetSound();
                trackEvent('elephpant_interaction', {
                    action: 'party_mode_enabled'
                });
            }
        });

        // Initial Sequence: Speed up initially, then go home after a few seconds
        setTimeout(() => {
            elephpant.classList.add('turbo-mode');
            setTimeout(() => {
                sendElephpantHome();
            }, 3000);
        }, 1000);

        return elephpant;
    }

    // The elephpant is pinned to a fixed bottom/right corner and every move it
    // makes is a transform away from that corner, so nothing it does can shift
    // the page layout. These two turn a "distance from the viewport edges"
    // target into the matching translation.
    function getElephpantAnchor(elephpant) {
        const style = window.getComputedStyle(elephpant);
        return {
            bottom: parseFloat(style.bottom) || 0,
            right: parseFloat(style.right) || 0,
        };
    }

    function translateFrom(anchor, bottom, right) {
        // A larger bottom sits higher up and a larger right sits further left.
        return `translate3d(${anchor.right - right}px, ${anchor.bottom - bottom}px, 0)`;
    }

    function sendElephpantHome() {
        const elephpant = getElephpant();
        if (!elephpant || isElephpantHome) return;
        
        const rect = elephpant.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        const currentBottom = windowHeight - rect.bottom;
        const currentRight = windowWidth - rect.right;
        const anchor = getElephpantAnchor(elephpant);

        elephpant.style.animation = 'none';
        // Hold the spot the run stopped at, expressed as an offset from the anchor.
        elephpant.style.transform = translateFrom(anchor, currentBottom, currentRight);
        elephpant.classList.remove('party-mode', 'turbo-mode', 'celebration-mode');
        
        void elephpant.offsetWidth;
        
        if (doorContainer) doorContainer.classList.add('open');
        
        const doorRect = doorContainer ? doorContainer.getBoundingClientRect() : { bottom: 0, right: 0, width: 0 };
        const elephpantSize = elephpant.offsetWidth || 220;
        const scaledSize = elephpantSize * 0.5;
        const offset = (elephpantSize - scaledSize) / 2;
        
        const targetBottom = (windowHeight - doorRect.bottom) - offset;
        const doorCenterFromRight = (windowWidth - doorRect.right) + (doorRect.width / 2);
        const targetRight = doorCenterFromRight - (elephpantSize / 2);

        elephpant.classList.add('returning-home');
        elephpant.style.transform = `${translateFrom(anchor, targetBottom, targetRight)} scale(0.5)`;
        
        setTimeout(() => {
            elephpant.classList.add('hidden-behind-door');
            elephpant.style.opacity = '0';
            elephpant.style.pointerEvents = 'none';
            if (doorContainer) doorContainer.classList.remove('open');
            setDoorMessage("Knock to see me", "reveals the elephpant easter egg");
            isElephpantHome = true;
        }, 1500);
    }

    function releaseElephpant() {
        const elephpant = initElephpant();
        if (!elephpant || !isElephpantHome) return;
        
        if (doorContainer) doorContainer.classList.add('open');
        
        setTimeout(() => {
            elephpant.classList.remove('hidden-behind-door');
            elephpant.style.opacity = '1';
            elephpant.style.pointerEvents = 'auto';
            
            const doorRect = doorContainer ? doorContainer.getBoundingClientRect() : { bottom: 0, right: 0, width: 0 };
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            
            const elephpantSize = elephpant.offsetWidth || 220;
            const scaledSize = elephpantSize * 0.5;
            const offset = (elephpantSize - scaledSize) / 2;
            
            const targetBottom = (windowHeight - doorRect.bottom) - offset;
            const doorCenterFromRight = (windowWidth - doorRect.right) + (doorRect.width / 2);
            const startRight = doorCenterFromRight - (elephpantSize / 2);
            
            const anchor = getElephpantAnchor(elephpant);

            // Step 1: Emerge directly from the hut door at half scale
            elephpant.style.transition = 'none';
            elephpant.style.transform = `${translateFrom(anchor, targetBottom, startRight)} scale(0.5)`;

            void elephpant.offsetWidth;

            elephpant.classList.remove('returning-home');
            elephpant.classList.add('exiting-door');

            // Step 2: Step out of the hut and transition down to screen perimeter run
            elephpant.style.transition = 'transform 1s cubic-bezier(0.2, 0.8, 0.2, 1)';
            elephpant.style.transform = 'translate3d(0px, 0px, 0) scaleX(1)';

            setTimeout(() => {
                elephpant.classList.remove('exiting-door');
                elephpant.style.animation = '';
                elephpant.style.transform = '';
                elephpant.style.transition = '';
                
                if (doorContainer) doorContainer.classList.remove('open');
                setDoorMessage("Knock to hide me", "hides the elephpant easter egg");
                isElephpantHome = false;
            }, 1000);
        }, 400);
    }

    // Door Click Event
    if (doorContainer) {
        doorContainer.addEventListener('click', () => {
            initElephpant();
            if (isElephpantHome) {
                releaseElephpant();
                playTrumpetSound();
            } else {
                sendElephpantHome();
            }
        });
    }

    // Lazy load elephpant when browser is idle after load
    function scheduleLazyElephpant() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => initElephpant(), { timeout: 2500 });
        } else {
            setTimeout(initElephpant, 2000);
        }
    }

    if (document.readyState === 'complete') {
        scheduleLazyElephpant();
    } else {
        window.addEventListener('load', scheduleLazyElephpant);
    }
});
