export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

export const getElementRect = (element) => {
    return element.getBoundingClientRect();
};

export const isInViewport = (element, offset = 0) => {
    const rect = getElementRect(element);
    return (
        rect.top + offset < window.innerHeight &&
        rect.bottom - offset > 0
    );
};

export const calculateParallaxTransform = (element, speed) => {
    const rect = getElementRect(element);
    const viewportHeight = window.innerHeight;
    const scrolled = window.pageYOffset;
    
    const parallaxStart = rect.top + scrolled - viewportHeight;
    const parallaxEnd = rect.bottom + scrolled;
    
    const progress = (scrolled - parallaxStart) / (parallaxEnd - parallaxStart);
    return progress * speed;
};

export const scheduleStyleUpdate = (() => {
    const updates = new Map();
    let ticking = false;

    const runUpdates = () => {
        updates.forEach((style, element) => {
            Object.assign(element.style, style);
        });
        updates.clear();
        ticking = false;
    };

    return (element, style) => {
        updates.set(element, { ...updates.get(element), ...style });
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(runUpdates);
        }
    };
})(); 