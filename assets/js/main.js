import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import scrollHandler from './scroll-handler.js';
import { Terminal } from './terminal.js';
import { PageAnimations } from './animations.js';

gsap.registerPlugin(ScrollTrigger);

// Initialize terminal only once
let terminalInstance = null;
function initializeTerminal() {
    if (!terminalInstance) {
        console.log('Initializing terminal...');
        terminalInstance = Terminal.getInstance();
    } else {
        console.warn('Terminal already initialized, skipping initialization');
    }
}

// Initialize based on DOM readiness
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTerminal);
} else {
    requestAnimationFrame(initializeTerminal);
}

// Initialize scroll handler
const htmlElement = document.documentElement;

// Form Handling
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    const submitButton = contactForm.querySelector('.submit-button');
    const buttonText = submitButton.querySelector('.button-text');
    const buttonLoader = submitButton.querySelector('.button-loader');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        buttonText.style.opacity = '0';
        buttonLoader.style.display = 'block';
        submitButton.disabled = true;

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show success state
        buttonLoader.style.display = 'none';
        buttonText.textContent = 'Message Sent!';
        buttonText.style.opacity = '1';

        // Reset form
        setTimeout(() => {
            contactForm.reset();
            buttonText.textContent = 'Send Message';
            submitButton.disabled = false;
        }, 3000);
    });
}

// Loading Animation
const loadingBar = document.querySelector('.loading-bar');
if (loadingBar) {
    window.addEventListener('load', () => {
        gsap.to(loadingBar, {
            scaleX: 1,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => {
                gsap.to(loadingBar, {
                    scaleX: 0,
                    transformOrigin: 'right',
                    duration: 0.5,
                    delay: 0.2
                });
            }
        });
    }, { passive: true });
}

// Mobile Menu Functionality
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
const navbar = document.querySelector('.navbar');
const body = document.body;
let lastScroll = 0;

// Handle mobile menu toggle
function toggleMobileMenu() {
    mobileMenuBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    body.classList.toggle('menu-open');
    
    // Add animation delays to menu items
    const menuItems = document.querySelectorAll('.mobile-menu-links li');
    menuItems.forEach((item, index) => {
        item.style.setProperty('--item-index', index);
    });
}

mobileMenuBtn.addEventListener('click', toggleMobileMenu);

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('active') && 
        !mobileMenu.contains(e.target) && 
        !mobileMenuBtn.contains(e.target)) {
        toggleMobileMenu();
    }
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.mobile-menu-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    });
});

// Handle navbar visibility on scroll
let scrollTimeout;

function handleScroll() {
    clearTimeout(scrollTimeout);
    
    const currentScroll = window.pageYOffset;
    
    // Show/hide navbar based on scroll direction
    if (currentScroll > lastScroll && currentScroll > 100) {
        navbar.classList.add('hide');
    } else {
        navbar.classList.remove('hide');
    }
    
    lastScroll = currentScroll;
    
    // Add scrolled class for styling
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Debounce scroll handling
    scrollTimeout = setTimeout(() => {
        navbar.classList.remove('hide');
    }, 150);
}

// Throttle scroll event
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleScroll();
            ticking = false;
        });
        ticking = true;
    }
});

// Handle smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;

        if (scrollHandler && !scrollHandler.supportsNativeSmoothScroll) {
            const easing = anchor.dataset.scrollEasing || scrollHandler.defaultEasing;
            scrollHandler.smoothScroll(target, { easing });
        } else {
            const headerOffset = 100;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Handle touch events for better mobile interaction
if ('ontouchstart' in window) {
    document.documentElement.classList.add('touch-device');
    
    // Add touch feedback
    const buttons = document.querySelectorAll('button, .mobile-menu-links a, .social-link');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('touch-active');
        });
    });
}

// Update active section on scroll
const sections = document.querySelectorAll('section[id]');
function updateActiveSection() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelector(`.mobile-menu-links a[href="#${sectionId}"]`)?.classList.add('active');
        } else {
            document.querySelector(`.mobile-menu-links a[href="#${sectionId}"]`)?.classList.remove('active');
        }
    });
}

window.addEventListener('scroll', updateActiveSection);

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    }, 250);
});

// Dynamic navbar background on scroll
if (navbar) {
    ScrollTrigger.create({
        start: 'top -50',
        onUpdate: (self) => {
            const direction = self.direction === 1;
            gsap.to(navbar, {
                backgroundColor: direction ? 'rgba(10, 10, 10, 0.98)' : 'rgba(10, 10, 10, 0.95)',
                boxShadow: direction ? '0 2px 10px rgba(0, 0, 0, 0.3)' : 'none',
                duration: 0.3
            });
        }
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize typing animation
    const txtElement = document.querySelector('.typed-text');
    if (txtElement) {
        const words = JSON.parse(txtElement.getAttribute('data-words') || '[]');
        const wait = txtElement.getAttribute('data-wait');
        new TypeWriter(txtElement, words, wait);
    }

    // Initialize parallax images
    document.querySelectorAll('.parallax-image').forEach(image => {
        // Set default speed if not specified
        if (!image.dataset.speed && !image.dataset.speedY) {
            image.dataset.speedY = '0.5';
        }
    });

    // Initialize all animations with IntersectionObserver
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '50px'
    });

    // Observe elements for animation
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        animateOnScroll.observe(element);
    });

    // Initialize Skills Category Collapsible functionality
    initializeSkillsCollapsible();

    // Initialize terminal and animations
    Terminal.getInstance();
    new PageAnimations();
}, { passive: true });

// Skills Category Collapsible
function initializeSkillsCollapsible() {
    const skillsHeaders = document.querySelectorAll('.skills-category-header');
    
    skillsHeaders.forEach(header => {
        // Ensure initial state is set
        header.setAttribute('aria-expanded', 'false');
        
        // Add index to list items for staggered animation
        const list = header.nextElementSibling;
        if (list && list.classList.contains('skills-list')) {
            list.querySelectorAll('li').forEach((li, index) => {
                li.style.setProperty('--item-index', index);
            });
        }
        
        header.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isExpanded = header.getAttribute('aria-expanded') === 'true';
            
            // Close all other sections
            skillsHeaders.forEach(otherHeader => {
                if (otherHeader !== header) {
                    otherHeader.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current section
            header.setAttribute('aria-expanded', (!isExpanded).toString());
            
            // Force a reflow to ensure transitions work
            const list = header.nextElementSibling;
            if (list) {
                list.style.display = 'none';
                list.offsetHeight; // Force reflow
                list.style.display = '';
            }
        });
    });
}

// Clean up event listeners and animations
window.addEventListener('beforeunload', () => {
    // Clean up scroll handler
    if (scrollHandler) {
        scrollHandler.destroy();
    }
    
    // Kill all GSAP animations
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    gsap.killTweensOf('*');
}, { once: true }); 