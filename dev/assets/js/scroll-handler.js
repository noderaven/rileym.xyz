// Scroll Handler with Performance Optimizations

class ScrollHandler {
    constructor() {
        // Scroll state
        this.lastScrollTop = 0;
        this.scrollDirection = 'down';
        this.ticking = false;
        this.supportsNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style;
        
        // DOM Elements
        this.scrollProgress = document.querySelector('.scroll-progress-bar');
        this.parallaxImages = document.querySelectorAll('.parallax-image');
        this.scrollSections = document.querySelectorAll('.scroll-section');
        
        // Throttle/Resize state
        this.resizeTimeout = null;
        this.throttleDelay = 150; // 150ms delay for throttling
        
        // Cache for getBoundingClientRect results
        this.rectCache = new WeakMap();
        this.lastCacheUpdate = 0;
        this.cacheTimeout = 16; // Cache timeout in ms (roughly 1 frame)
        
        // Style update batching
        this.pendingStyles = new Map();
        this.styleUpdateScheduled = false;
        
        // Bind methods
        this.onScroll = this.onScroll.bind(this);
        this.updateScrollProgress = this.updateScrollProgress.bind(this);
        this.updateParallax = this.updateParallax.bind(this);
        this.smoothScroll = this.smoothScroll.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.throttledResize = this.throttle(this.handleResize, this.throttleDelay);
        this.clearRectCache = this.clearRectCache.bind(this);
        this.applyStyles = this.applyStyles.bind(this);
        
        // Add easing function presets
        this.easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 
                ? 4 * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2,
            easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
            easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            easeInOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 
                ? Math.pow(2, 20 * t - 10) / 2
                : (2 - Math.pow(2, -20 * t + 10)) / 2,
            bounceOut: t => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            }
        };

        // Set default easing
        this.defaultEasing = 'easeInOutCubic';
        
        // Add parallax state tracking
        this.parallaxState = new Map();
        this.lastParallaxUpdate = 0;
        this.parallaxUpdateInterval = 16; // Update interval in ms (roughly 60fps)
        this.debouncedParallax = this.debounce(this.updateParallax, this.parallaxUpdateInterval);
        
        // Initialize
        this.init();
    }
    
    init() {
        // Add passive scroll listener
        window.addEventListener('scroll', this.onScroll, { passive: true });
        
        // Add throttled resize listener with passive option
        window.addEventListener('resize', this.throttledResize, { passive: true });
        
        // Add smooth scroll polyfill for browsers that don't support it
        if (!this.supportsNativeSmoothScroll) {
            // Bind the handler to maintain correct context
            this.smoothScrollHandler = this.smoothScrollHandler.bind(this);
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', this.smoothScrollHandler);
            });
        }
        
        // Initial measurements
        this.handleResize();
        
        // Check if reduced motion is preferred
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Store the media query handler for cleanup
        this.reducedMotionHandler = (e) => {
            this.prefersReducedMotion = e.matches;
        };
        
        // Listen for prefers-reduced-motion changes with stored handler
        window.matchMedia('(prefers-reduced-motion: reduce)')
            .addEventListener('change', this.reducedMotionHandler);
    }
    
    // Throttle utility function
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Handle resize with cached measurements
    handleResize() {
        this.windowHeight = window.innerHeight;
        this.documentHeight = document.documentElement.scrollHeight;
        
        // Clear caches
        this.clearRectCache();
        this.parallaxState.clear();
        
        // Force immediate parallax update after resize
        if (!this.prefersReducedMotion) {
            this.lastParallaxUpdate = 0;
            this.updateParallax();
        }
        
        // Update scroll progress
        this.updateScrollProgress();
    }
    
    onScroll() {
        // Update scroll direction
        const st = window.scrollY;
        this.scrollDirection = st > this.lastScrollTop ? 'down' : 'up';
        this.lastScrollTop = st;
        
        // Request animation frame if not already requested
        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.updateScrollProgress();
                if (!this.prefersReducedMotion) {
                    this.debouncedParallax();
                }
                this.ticking = false;
            });
            this.ticking = true;
        }
    }
    
    updateScrollProgress() {
        if (this.scrollProgress) {
            const scrolled = (window.scrollY / (this.documentHeight - this.windowHeight)) * 100;
            this.scheduleStyleUpdate(this.scrollProgress, {
                transform: `scaleX(${scrolled / 100})`
            });
        }
    }
    
    // Calculate parallax transform for an element
    calculateParallaxTransform(element, rect) {
        const speedY = parseFloat(element.dataset.speedY || element.dataset.speed || 0.5);
        const speedX = parseFloat(element.dataset.speedX || 0);
        const rotation = parseFloat(element.dataset.rotation || 0);
        const scale = parseFloat(element.dataset.scale || 1);
        
        // Calculate vertical parallax
        const yPos = (window.scrollY - rect.top) * speedY;
        
        // Calculate horizontal parallax based on element's position relative to center
        const viewportCenter = window.innerWidth / 2;
        const elementCenter = rect.left + rect.width / 2;
        const xOffset = (elementCenter - viewportCenter) * speedX;
        
        // Calculate rotation based on scroll progress
        const scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const rotationAngle = rotation * scrollProgress * 360;
        
        // Calculate scale based on element's position in viewport
        const elementMiddle = rect.top + rect.height / 2;
        const viewportMiddle = window.innerHeight / 2;
        const distanceFromCenter = Math.abs(elementMiddle - viewportMiddle);
        const maxDistance = window.innerHeight / 2;
        const scaleProgress = 1 - (distanceFromCenter / maxDistance);
        const scaleValue = 1 + ((scale - 1) * Math.max(0, scaleProgress));
        
        return {
            transform: [
                `translate3d(${xOffset}px, ${yPos}px, 0)`,
                rotation ? `rotate(${rotationAngle}deg)` : null,
                scale !== 1 ? `scale(${scaleValue})` : null
            ].filter(Boolean).join(' ')
        };
    }

    // Enhanced parallax update method
    updateParallax() {
        if (this.prefersReducedMotion) return;
        
        const now = performance.now();
        if (now - this.lastParallaxUpdate < this.parallaxUpdateInterval) {
            return;
        }
        this.lastParallaxUpdate = now;

        // Batch all parallax calculations
        const updates = new Map();
        
        this.parallaxImages.forEach(image => {
            const rect = this.getElementRect(image);
            const inView = rect.top < this.windowHeight && rect.bottom > 0;
            
            if (inView) {
                const transform = this.calculateParallaxTransform(image, rect);
                updates.set(image, transform);
            }
        });

        // Schedule all style updates in a single batch
        updates.forEach((styles, element) => {
            this.scheduleStyleUpdate(element, styles);
        });
    }
    
    /**
     * Enhanced smooth scroll with customizable easing
     * @param {Element} target - The target element to scroll to
     * @param {Object} options - Scroll options
     * @param {string|Function} options.easing - Easing function name or custom function
     * @param {number} options.minDuration - Minimum scroll duration in ms
     * @param {number} options.maxDuration - Maximum scroll duration in ms
     * @param {number} options.distanceThreshold - Distance threshold for max duration
     */
    smoothScroll(target, options = {}) {
        if (this.prefersReducedMotion) {
            window.scrollTo(0, target.offsetTop);
            return;
        }

        const {
            easing = this.defaultEasing,
            minDuration = 500,
            maxDuration = 1500,
            distanceThreshold = 2000
        } = options;

        // Get easing function
        const easingFn = typeof easing === 'function' 
            ? easing 
            : this.easingFunctions[easing] || this.easingFunctions[this.defaultEasing];
        
        const targetPosition = target.getBoundingClientRect().top + window.scrollY;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition;
        
        // Calculate dynamic duration based on distance
        const duration = Math.min(
            maxDuration,
            Math.max(
                minDuration,
                Math.abs(distance) / distanceThreshold * maxDuration
            )
        );
        
        // Add slight delay for very short scrolls
        const finalDuration = Math.abs(distance) < 100 ? minDuration : duration;
        
        let start = null;
        let previousPosition = startPosition;
        let lastTime = null;
        
        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / finalDuration, 1);
            
            // Apply easing
            const easedProgress = easingFn(progress);
            const currentPos = startPosition + distance * easedProgress;
            
            // Only update if significant change or final position
            if (Math.abs(currentPos - previousPosition) >= 1 || progress === 1) {
                window.scrollTo(0, currentPos);
                previousPosition = currentPos;
                lastTime = currentTime;
            }
            
            // Check for completion or interruption
            if (progress < 1 && 
                Math.abs(window.scrollY - previousPosition) < 10 && // Check for user interruption
                (!lastTime || currentTime - lastTime < 100)) { // Check for stall
                requestAnimationFrame(animation);
            }
        };
        
        requestAnimationFrame(animation);
    }
    
    // Get cached or fresh bounding rect
    getElementRect(element) {
        const now = performance.now();
        let cachedData = this.rectCache.get(element);
        
        // If cache exists and is fresh, return cached rect
        if (cachedData && (now - cachedData.timestamp) < this.cacheTimeout) {
            return cachedData.rect;
        }
        
        // Get fresh rect and cache it
        const rect = element.getBoundingClientRect();
        this.rectCache.set(element, {
            rect,
            timestamp: now
        });
        
        return rect;
    }
    
    // Clear rect cache (called on resize)
    clearRectCache() {
        this.rectCache = new WeakMap();
        this.lastCacheUpdate = 0;
    }
    
    // Optimized isInViewport method
    isInViewport(element, offset = 0) {
        const rect = this.getElementRect(element);
        return (
            rect.top <= (this.windowHeight + offset) &&
            rect.bottom >= -offset
        );
    }
    
    // Schedule style updates
    scheduleStyleUpdate(element, styles) {
        this.pendingStyles.set(element, {
            ...this.pendingStyles.get(element),
            ...styles
        });

        if (!this.styleUpdateScheduled) {
            this.styleUpdateScheduled = true;
            requestAnimationFrame(this.applyStyles);
        }
    }

    // Apply batched style updates
    applyStyles() {
        this.pendingStyles.forEach((styles, element) => {
            Object.entries(styles).forEach(([property, value]) => {
                element.style[property] = value;
            });
        });

        this.pendingStyles.clear();
        this.styleUpdateScheduled = false;
    }
    
    // Enhanced cleanup method with comprehensive memory management
    destroy() {
        // Remove window event listeners
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.throttledResize);
        
        // Remove reduced motion listener with stored handler
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (this.reducedMotionHandler) {
            reducedMotionQuery.removeEventListener('change', this.reducedMotionHandler);
            this.reducedMotionHandler = null;
        }

        // Remove smooth scroll listeners if polyfill was used
        if (!this.supportsNativeSmoothScroll && this.smoothScrollHandler) {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.removeEventListener('click', this.smoothScrollHandler);
            });
        }

        // Clear all timeouts and animation frames
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        if (this.styleUpdateScheduled) {
            cancelAnimationFrame(this.styleUpdateScheduled);
        }
        if (this.ticking) {
            cancelAnimationFrame(this.ticking);
        }

        // Clear all caches and maps
        this.clearRectCache();
        this.pendingStyles.clear();
        this.parallaxState.clear();

        // Clear DOM references
        this.scrollProgress = null;
        this.parallaxImages = null;
        this.scrollSections = null;

        // Clear canvas and context references
        if (this.canvas) {
            this.canvas.width = 0;
            this.canvas.height = 0;
            this.canvas = null;
            this.context = null;
        }

        // Clear all bound methods
        this.onScroll = null;
        this.updateScrollProgress = null;
        this.updateParallax = null;
        this.smoothScroll = null;
        this.handleResize = null;
        this.throttledResize = null;
        this.clearRectCache = null;
        this.applyStyles = null;
        this.debouncedParallax = null;
        this.smoothScrollHandler = null;

        // Clear all state
        this.lastScrollTop = null;
        this.scrollDirection = null;
        this.windowHeight = null;
        this.documentHeight = null;
        this.cachedFont = null;
        this.lastCacheUpdate = null;
        this.lastParallaxUpdate = null;

        // Clear easing functions
        this.easingFunctions = null;
        this.defaultEasing = null;

        // Clear WeakMap and Map instances
        this.rectCache = null;
        this.pendingStyles = null;
        this.parallaxState = null;
    }

    // Add smooth scroll handler method for proper cleanup
    smoothScrollHandler(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const easing = this.dataset.scrollEasing || this.defaultEasing;
            this.smoothScroll(targetElement, { easing });
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize scroll handler
const scrollHandler = new ScrollHandler();

// Export for use in other modules
export default scrollHandler; 