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
});
