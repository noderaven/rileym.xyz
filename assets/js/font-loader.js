// Font Loading Handler with Dynamic Configuration

// Font configuration
const fontConfig = [
    {
        family: 'Hack',
        className: 'font-loaded-hack',
        weights: [
            { 
                style: 'normal', 
                weight: 400, 
                url: 'https://cdn.jsdelivr.net/npm/hack-font@3/build/web/fonts/hack-regular.woff2',
                format: 'woff2'
            },
            { 
                style: 'normal', 
                weight: 700, 
                url: 'https://cdn.jsdelivr.net/npm/hack-font@3/build/web/fonts/hack-bold.woff2',
                format: 'woff2'
            }
        ],
        fallback: 'https://cdn.jsdelivr.net/npm/hack-font@3/build/web/hack.css'
    }
    // Add more font configurations here as needed
];

class FontLoader {
    constructor(config = fontConfig) {
        this.config = config;
        this.loadedFonts = new Set();
        this.fontFaces = new Map();
        this.init();
    }

    async init() {
        document.documentElement.classList.add('fonts-loading');
        
        try {
            // Load all configured fonts
            await Promise.all(this.config.map(fontFamily => this.loadFontFamily(fontFamily)));
            
            // Mark all fonts as loaded
            document.documentElement.classList.remove('fonts-loading');
            document.documentElement.classList.add('fonts-loaded');
            this.loadedFonts.forEach(className => {
                document.documentElement.classList.add(className);
            });
            
            // Store in session storage
            this.saveToSession();
        } catch (error) {
            console.warn('Font loading failed:', error);
            this.handleError();
        }
    }

    async loadFontFamily(fontConfig) {
        const fontFaces = fontConfig.weights.map(weight => {
            const fontFace = new FontFace(
                fontConfig.family,
                `url(${weight.url}) format("${weight.format}")`,
                { 
                    style: weight.style,
                    weight: weight.weight
                }
            );
            this.fontFaces.set(`${fontConfig.family}-${weight.weight}-${weight.style}`, fontFace);
            return fontFace.load();
        });

        try {
            const loadedFaces = await Promise.all(fontFaces);
            loadedFaces.forEach(face => document.fonts.add(face));
            this.loadedFonts.add(fontConfig.className);
            return true;
        } catch (error) {
            console.warn(`Failed to load font family ${fontConfig.family}:`, error);
            this.loadFallback(fontConfig);
            return false;
        }
    }

    loadFallback(fontConfig) {
        if (fontConfig.fallback) {
            const link = document.createElement('link');
            link.href = fontConfig.fallback;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    }

    handleError() {
        document.documentElement.classList.remove('fonts-loading');
        document.documentElement.classList.add('fonts-failed');
        
        // Load fallbacks for all font families
        this.config.forEach(fontConfig => this.loadFallback(fontConfig));
    }

    saveToSession() {
        const fontState = {
            loaded: true,
            families: Array.from(this.loadedFonts)
        };
        sessionStorage.setItem('fonts-state', JSON.stringify(fontState));
    }

    static checkSession() {
        const fontState = sessionStorage.getItem('fonts-state');
        if (fontState) {
            try {
                const { families } = JSON.parse(fontState);
                document.documentElement.classList.add('fonts-loaded');
                families.forEach(className => {
                    document.documentElement.classList.add(className);
                });
                return true;
            } catch (error) {
                console.warn('Failed to parse font state:', error);
                return false;
            }
        }
        return false;
    }

    static supportsNativeFontLoading() {
        return 'fonts' in document;
    }

    destroy() {
        // Remove all loaded font faces
        this.fontFaces.forEach(face => {
            try {
                document.fonts.delete(face);
            } catch (error) {
                console.warn('Failed to remove font face:', error);
            }
        });

        // Clear maps and sets
        this.fontFaces.clear();
        this.loadedFonts.clear();
    }
}

// Initialize font loading on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Check session storage first
    if (!FontLoader.checkSession() && FontLoader.supportsNativeFontLoading()) {
        const loader = new FontLoader();
        
        // Store loader instance for potential cleanup
        window._fontLoader = loader;
    }
});

// Fallback for browsers that don't support native font loading
if (!FontLoader.supportsNativeFontLoading()) {
    fontConfig.forEach(config => {
        if (config.fallback) {
            const link = document.createElement('link');
            link.href = config.fallback;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window._fontLoader) {
        window._fontLoader.destroy();
        window._fontLoader = null;
    }
}, { once: true }); 