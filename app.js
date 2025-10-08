let currentPhrase = 0;
let currentChar = 0;
let isDeleting = false;
let typingInterval;

const phrases = [
    "PHP Developer",
    "Laravel Artisan",
    "Open Source Contributor", 
    "Content Creator",
    "Community Builder",
    "Full Stack Developer",
    "Tall Stack Developer",
    "Consultant",
];

function typeAnimation() {
    const typingText = document.getElementById('typingText');
    if (!typingText) return;
    
    const fullText = phrases[currentPhrase];
    
    if (isDeleting) {
        typingText.textContent = fullText.substring(0, currentChar - 1);
        currentChar--;
    } else {
        typingText.textContent = fullText.substring(0, currentChar + 1);
        currentChar++;
    }
    
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
        typingText.textContent = '';
        setTimeout(typeAnimation, 500);
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    const animatedElements = document.querySelectorAll('.container, .profile-image, .skills-container');
    animatedElements.forEach(el => observer.observe(el));
    
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.01s');
    }
    
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.style.opacity = '0.5';
            this.alt = 'Image could not be loaded';
        });
    });
    
    const socialLinks = document.querySelectorAll('.social-links a');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.1)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        link.addEventListener('click', function() {
            const platform = this.classList[0] || 'unknown';
            trackEvent('social_click', {
                platform: platform,
                url: this.href
            });
        });
    });
    
    const skillTags = document.querySelectorAll('.skill-tag');
    skillTags.forEach((tag, index) => {
        tag.style.animationDelay = `${0.8 + (index * 0.1)}s`;
        tag.style.opacity = '0';
        tag.style.animation = 'slideInUp 0.6s ease-out forwards';
        
        tag.addEventListener('click', function() {
            const skillName = this.textContent.trim();
            
            this.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.5)';
            this.style.transform = 'translateY(-5px) scale(1.1)';
            
            setTimeout(() => {
                this.style.boxShadow = '';
                this.style.transform = '';
            }, 300);
            
            trackEvent('skill_interaction', {
                skill: skillName,
                timestamp: new Date().toISOString()
            });
        });
        
        const delay = Math.random() * 0.5;
        tag.style.animationDelay = `${delay}s`;
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
    
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            // Add scroll-based effects here if needed
        }, 10);
    });
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function handleThemeChange(e) {
        if (e.matches) {
            document.documentElement.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
        } else {
            document.documentElement.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
        }
    }
    mediaQuery.addListener(handleThemeChange);
    handleThemeChange(mediaQuery);
    
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
    
    // Enhanced PHP Elephant Interactions
    const elephant = document.getElementById('runningElephant');
    if (elephant) {
        let isPartyMode = false;
        
        // Make elephant interactive
        elephant.style.pointerEvents = 'auto';
        elephant.style.cursor = 'pointer';
        
        // Add no-hover class on touch devices to prevent hover state
        elephant.addEventListener('touchstart', function(e) {
            e.preventDefault();
            elephant.classList.add('no-hover');
        }, { passive: false });
        
        // Handle click/tap interaction
        const handleInteraction = function(e) {
            e.stopPropagation();
            e.preventDefault();
            
            // Remove hover effects that might pause animation
            elephant.classList.add('no-hover');
            
            // Toggle party mode
            if (isPartyMode) {
                // Turn off party mode - back to normal
                elephant.classList.remove('party-mode');
                isPartyMode = false;
            } else {
                // Turn on party mode
                elephant.classList.add('party-mode');
                isPartyMode = true;
                createConfetti();
                createFireworks();
                playTrumpetSound();
                trackEvent('elephant_interaction', {
                    action: 'party_mode_enabled'
                });
            }
            
            // Add bounce effect on click
            const originalTransform = elephant.style.transform;
            elephant.style.transform = 'scale(1.2)';
            setTimeout(() => {
                elephant.style.transform = originalTransform;
            }, 200);
        };
        
        elephant.addEventListener('click', handleInteraction);
        elephant.addEventListener('touchend', handleInteraction);
        
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
        
        // Elephant trumpet sound (simple beep using Web Audio API)
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
    }
});
