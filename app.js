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
        
        elephant.addEventListener('click', function(e) {
            e.stopPropagation();
            
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
        });
        
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

        // Door Interaction Logic
        const doorContainer = document.getElementById('door-container');
        const doorMessage = document.getElementById('doorMessage');
        let isElephantHome = false;

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

        // Initial position and resize listener
        positionDoor();
        window.addEventListener('resize', positionDoor);

        function sendElephantHome() {
            if (isElephantHome) return;
            
            // Get current position to animate from there
            const rect = elephant.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            
            // Calculate current bottom/right relative to viewport
            const currentBottom = windowHeight - rect.bottom;
            const currentRight = windowWidth - rect.right;
            
            // Stop current animation and set explicit position
            elephant.style.animation = 'none';
            elephant.style.bottom = `${currentBottom}px`;
            elephant.style.right = `${currentRight}px`;
            elephant.classList.remove('party-mode', 'turbo-mode', 'celebration-mode');
            
            // Force reflow
            void elephant.offsetWidth;
            
            // Open door
            doorContainer.classList.add('open');
            
            // Calculate target position (Door)
            const doorRect = doorContainer.getBoundingClientRect();
            
            // Dynamic offset calculation based on current elephant size
            const elephantSize = elephant.offsetWidth; // 220 on desktop, 120 on mobile
            const scaledSize = elephantSize * 0.5; // Scale is 0.5
            const offset = (elephantSize - scaledSize) / 2;
            
            // We want visual bottom to match door bottom
            // doorBottomSpace = windowHeight - doorRect.bottom
            // targetBottom = doorBottomSpace - offset
            const targetBottom = (windowHeight - doorRect.bottom) - offset;
            
            // We want visual center to match door center
            // doorCenterFromRight = (windowWidth - doorRect.right) + (doorRect.width / 2)
            // elephantCenterFromRight = targetRight + (elephantSize / 2)
            // targetRight = doorCenterFromRight - (elephantSize / 2)
            const doorCenterFromRight = (windowWidth - doorRect.right) + (doorRect.width / 2);
            const targetRight = doorCenterFromRight - (elephantSize / 2);

            // Animate home
            elephant.classList.add('returning-home');
            elephant.style.bottom = `${targetBottom}px`;
            elephant.style.right = `${targetRight}px`;
            
            // Wait for arrival
            setTimeout(() => {
                elephant.classList.add('hidden-behind-door');
                doorContainer.classList.remove('open');
                doorMessage.textContent = "Knock to see me";
                isElephantHome = true;
            }, 1500);
        }

        function releaseElephant() {
            if (!isElephantHome) return;
            
            // Open door
            doorContainer.classList.add('open');
            elephant.classList.remove('hidden-behind-door');
            
            // Recalculate position in case window resized
            const doorRect = doorContainer.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const windowWidth = window.innerWidth;
            
            const elephantSize = elephant.offsetWidth;
            const scaledSize = elephantSize * 0.5;
            const offset = (elephantSize - scaledSize) / 2;
            
            const targetBottom = (windowHeight - doorRect.bottom) - offset;
            const doorCenterFromRight = (windowWidth - doorRect.right) + (doorRect.width / 2);
            const startRight = doorCenterFromRight - (elephantSize / 2);
            
            // Set start position
            elephant.style.bottom = `${targetBottom}px`;
            elephant.style.right = `${startRight}px`;
            
            // Force reflow
            void elephant.offsetWidth;

            // Animate out
            elephant.classList.remove('returning-home');
            elephant.classList.add('exiting-door');
            
            // Move out to the left (increase right value)
            elephant.style.right = `${startRight + 200}px`;
            
            setTimeout(() => {
                // Start running
                elephant.classList.remove('exiting-door');
                elephant.style.animation = ''; // Reset to CSS defined animation
                elephant.style.bottom = '';
                elephant.style.right = '';
                
                doorContainer.classList.remove('open');
                doorMessage.textContent = "Knock to hide me";
                isElephantHome = false;
            }, 1000);
        }

        // Initial Sequence
        setTimeout(() => {
            // Speed up initially
            elephant.classList.add('turbo-mode');
            
            // Go home after a few seconds
            setTimeout(() => {
                sendElephantHome();
            }, 3000);
        }, 1000);

        // Door Click Event
        if (doorContainer) {
            doorContainer.addEventListener('click', () => {
                if (isElephantHome) {
                    releaseElephant();
                    playTrumpetSound();
                } else {
                    sendElephantHome();
                }
            });
        }
    }
});
