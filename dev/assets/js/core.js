import { debounce, throttle, isInViewport, calculateParallaxTransform, scheduleStyleUpdate } from './utils.js';
import Terminal from './terminal.js';
import PageAnimations from './animations.js';
import ScrollHandler from './scroll-handler.js';

class Core {
    constructor() {
        this.parallaxElements = [];
        this.rectCache = new Map();
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize components in order
        this.scrollHandler = new ScrollHandler();
        this.terminal = Terminal; // Already initialized as singleton
        this.animations = PageAnimations; // Already initialized as singleton

        // Initialize parallax
        this.initializeParallax();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial update
        this.updateParallax();
    }

    initializeParallax() {
        this.parallaxElements = Array.from(document.querySelectorAll('.parallax-image'));
        this.parallaxElements.forEach(element => {
            if (!element.dataset.speedY) {
                element.dataset.speedY = '0.5';
            }
        });
    }

    setupEventListeners() {
        // Scroll handling
        window.addEventListener('scroll', throttle(() => {
            this.updateParallax();
            this.updateScrollProgress();
        }, 16), { passive: true });

        // Resize handling
        window.addEventListener('resize', debounce(() => {
            this.clearRectCache();
            this.updateParallax();
        }, 250));

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    this.smoothScroll(targetElement);
                }
            });
        });
    }

    updateParallax() {
        this.parallaxElements.forEach(element => {
            if (!isInViewport(element)) return;

            const speedY = parseFloat(element.dataset.speedY) || 0.5;
            const transform = calculateParallaxTransform(element, speedY);
            
            scheduleStyleUpdate(element, {
                transform: `translate3d(0, ${transform}px, 0)`
            });
        });
    }

    smoothScroll(target, options = {}) {
        const {
            duration = 1000,
            offset = 0,
            easing = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        } = options;

        const start = window.pageYOffset;
        const targetPosition = target.getBoundingClientRect().top + start + offset;
        const distance = targetPosition - start;
        let startTime = null;

        const animation = currentTime => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easedProgress = easing(progress);
            
            window.scrollTo(0, start + distance * easedProgress);

            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    clearRectCache() {
        this.rectCache.clear();
    }

    destroy() {
        this.scrollHandler.destroy();
        // Add any other cleanup needed
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.core = new Core();
}); 