import Typewriter from 'typewriter-effect/dist/core';
import anime from 'animejs/lib/anime.es.js';

// Pre-compute terminal lines for better performance
const terminalLines = Object.freeze([
    'initializing system...',
    'loading modules...',
    'establishing connection...',
    'accessing mainframe...',
    'decrypting data...',
    'system ready...',
    'running diagnostics...',
    'checking security protocols...',
    'verifying credentials...',
    'access granted...'
]);

export class Terminal {
    static #instance = null;  // private static instance
    static #initializing = false;  // private initialization flag

    constructor() {
        // Prevent direct construction
        if (!Terminal.#initializing) {
            throw new Error('Terminal must be initialized using Terminal.getInstance()');
        }

        // Initialize state
        this.initialized = false;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.elements = {
            container: null,
            input: null,
            inputCursor: null,
            history: null
        };

        try {
            // Use Map for better performance with frequent updates
            this.typewriters = new Map();
            this.animations = new Map();
            
            // Optimize canvas setup
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d', { alpha: false });
            this.cachedFont = null;
            this.pendingUpdates = new Set();
            
            // Create an optimized RAF callback
            this.rafCallback = () => {
                if (this.pendingUpdates.size > 0) {
                    this.updateCursorPosition();
                    this.pendingUpdates.clear();
                }
            };

            // Wait for DOM to be fully loaded before initialization
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                // If DOM is already loaded, initialize on next frame
                requestAnimationFrame(() => this.init());
            }
        } catch (error) {
            console.error('Terminal initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    static getInstance() {
        if (!Terminal.#instance) {
            console.log('Creating new Terminal instance...');
            try {
                Terminal.#initializing = true;
                Terminal.#instance = new Terminal();
            } finally {
                Terminal.#initializing = false;
            }
        } else {
            console.log('Returning existing Terminal instance...');
        }
        return Terminal.#instance;
    }

    static hasInstance() {
        return !!Terminal.#instance;
    }

    init() {
        if (this.initialized) {
            console.warn('Terminal already initialized');
            return;
        }

        try {
            // Check for terminal container first
            const container = document.querySelector('.terminal-container');
            if (!container) {
                throw new Error('Terminal container not found in DOM');
            }

            // Initialize in sequence
            this.initializeElements();
            this.initializeCanvas();
            this.initializeCommands();
            this.setupEventListeners();
            
            // Defer non-critical initializations using requestIdleCallback
            const initNonCritical = () => {
                try {
                    this.updateFontSettings();
                    this.initTerminalBackground();
                    this.initializeTypewriter();
                } catch (error) {
                    console.warn('Non-critical initialization failed:', error);
                }
            };

            if ('requestIdleCallback' in window) {
                requestIdleCallback(initNonCritical, { timeout: 2000 });
            } else {
                setTimeout(initNonCritical, 0);
            }

            this.initialized = true;
        } catch (error) {
            console.error('Terminal initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    handleInitializationError(error) {
        const container = document.querySelector('.terminal-container');
        if (container) {
            container.innerHTML = `
                <div class="terminal-error">
                    <p>Terminal failed to initialize.</p>
                    <p class="error-details">Error: ${error.message}</p>
                    <p class="error-help">Please check the console for more details and try refreshing the page.</p>
                    <button onclick="window.location.reload()">Refresh Page</button>
                </div>
            `;
        } else {
            console.error('Could not display error message: Terminal container not found');
        }
    }

    initializeElements() {
        // Get all required elements
        const elements = {
            container: document.querySelector('.terminal-container'),
            input: document.querySelector('.terminal-input'),
            inputCursor: document.querySelector('.input-text'),
            history: document.querySelector('.terminal-history')
        };

        // Check if all required elements are present
        const missingElements = Object.entries(elements)
            .filter(([, element]) => !element)
            .map(([name]) => name);

        if (missingElements.length > 0) {
            throw new Error(`Required terminal elements not found: ${missingElements.join(', ')}`);
        }

        // Store elements if all are present
        this.elements = elements;

        // Initialize input cursor with TypewriterJS
        try {
            const inputTypewriter = new Typewriter(this.elements.inputCursor, {
                delay: 75,
                cursor: '█',
                wrapperClassName: 'typewriter-wrapper',
                loop: false,
                autoStart: true,
                cursorClassName: 'input-cursor',
                strings: ['']  // Initialize with empty string to show just cursor
            });

            this.typewriters.set('input', inputTypewriter);
        } catch (error) {
            console.error('Failed to initialize input typewriter:', error);
            throw error;
        }
    }

    initializeCanvas() {
        try {
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
            this.cachedFont = null;

            if (!this.context) {
                throw new Error('Failed to get canvas context');
            }
        } catch (error) {
            throw new Error('Canvas initialization failed: ' + error.message);
        }
    }

    initializeCommands() {
        this.commands = {
            'help': () => this.showHelp(),
            'clear': () => this.clearHistory(),
            'about': () => this.navigateTo('/about.html'),
            'projects': () => this.navigateTo('/projects.html'),
            'contact': () => this.navigateTo('/contact.html'),
            'ls': () => this.listSections(),
            'whoami': () => this.showWhoami(),
            'date': () => this.showDate(),
            'echo': (args) => this.echo(args),
            'skills': () => this.showSkills(),
            'social': () => this.showSocial(),
            'pwd': () => this.showCurrentPath(),
            'cat': (args) => this.catFile(args),
            'cd': (args) => this.changeDirectory(args)
        };
    }

    navigateTo(path) {
        try {
            window.location.href = path;
        } catch (error) {
            this.addToHistory(`Navigation failed: ${error.message}`, 'error');
        }
    }

    setupEventListeners() {
        if (this.elements.input) {
            // Optimize input event handling
            this.elements.input.addEventListener('input', () => {
                this.pendingUpdates.add('cursor');
                this.rafCallback();
            });

            this.elements.input.addEventListener('keydown', (e) => this.handleKeydown(e));
            
            // Optimize blur handling
            const refocusInput = this.debounce(() => this.elements.input?.focus(), 10);
            this.elements.input.addEventListener('blur', refocusInput);
        }

        if (this.elements.container) {
            // Use event delegation for container clicks
            this.elements.container.addEventListener('click', (e) => {
                if (this.elements.input && e.target.closest('.terminal-container')) {
                    this.elements.input.focus();
                }
            });
        }
    }

    updateFontSettings() {
        try {
            if (!this.elements.input || !this.context) return;
            
            const computedFont = getComputedStyle(this.elements.input).font;
            if (this.cachedFont !== computedFont) {
                this.cachedFont = computedFont;
                this.context.font = computedFont;
            }
        } catch (error) {
            console.error('Font settings update failed:', error);
        }
    }

    getTextWidth(text) {
        try {
            if (!this.context) return 0;
            
            // Cache and reuse font settings
            const currentFont = getComputedStyle(this.elements.input).font;
            if (this.cachedFont !== currentFont) {
                this.cachedFont = currentFont;
                this.context.font = currentFont;
            }
            
            return this.context.measureText(text || '').width;
        } catch (error) {
            console.error('Text width calculation failed:', error);
            return 0;
        }
    }

    debounce(func, wait) {
        let timeout;
        let lastArgs;
        let lastThis;
        let result;

        function later() {
            timeout = null;
            result = func.apply(lastThis, lastArgs);
        }

        function debounced(...args) {
            lastArgs = args;
            lastThis = this;

            if (timeout) {
                clearTimeout(timeout);
            }

            timeout = setTimeout(later, wait);
            return result;
        }

        debounced.cancel = function() {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
        };

        return debounced;
    }

    initTerminalBackground() {
        const terminal = document.querySelector('.terminal-bg');
        if (!terminal) return;

        // Use object pooling for better performance
        const linePool = new Set();
        const maxLines = 10;
        const lines = new Array(maxLines).fill(null).map(() => {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            return line;
        });

        const createLine = () => {
            const line = lines.find(l => !l.isConnected) || lines[0];
            const startY = 100 + Math.random() * 20;
            const endY = -20 - Math.random() * 20;

            line.style.left = `${Math.random() * 100}%`;
            line.textContent = terminalLines[Math.floor(Math.random() * terminalLines.length)];
            
            if (!terminal.contains(line)) {
                terminal.appendChild(line);
            }

            // Optimize animation
            anime({
                targets: line,
                translateY: [`${startY}%`, `${endY}%`],
                opacity: {
                    value: [0.1, 0],
                    easing: 'linear'
                },
                duration: 3000 + Math.random() * 2000,
                easing: 'linear',
                complete: () => {
                    if (terminal.contains(line)) {
                        terminal.removeChild(line);
                    }
                }
            });
        };

        // Use requestAnimationFrame for smoother scheduling
        const scheduleNextLine = () => {
            requestAnimationFrame(() => {
                createLine();
                setTimeout(scheduleNextLine, 2000 + Math.random() * 1000);
            });
        };

        // Initial lines
        for (let i = 0; i < 5; i++) {
            setTimeout(createLine, i * 500);
        }

        scheduleNextLine();
    }

    handleKeydown(e) {
        try {
            if (e.key === 'Enter') {
                e.preventDefault();
                const command = this.elements.input?.value.trim() || '';
                if (command) {
                    this.commandHistory.unshift(command);
                    this.historyIndex = -1;
                }
                this.executeCommand();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.elements.input.value = this.commandHistory[this.historyIndex];
                    this.rafCallback();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex > -1) {
                    this.historyIndex--;
                    this.elements.input.value = this.historyIndex === -1 ? '' : this.commandHistory[this.historyIndex];
                    this.rafCallback();
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabCompletion();
            }
        } catch (error) {
            console.error('Keydown handling failed:', error);
            this.addToHistory('Command execution failed', 'error');
        }
    }

    handleTabCompletion() {
        const input = this.elements.input?.value.trim() || '';
        const [partialCommand] = input.split(' ');
        
        const matches = Object.keys(this.commands).filter(cmd => 
            cmd.startsWith(partialCommand.toLowerCase())
        );

        if (matches.length === 1) {
            this.elements.input.value = matches[0];
        } else if (matches.length > 1) {
            this.addToHistory('Possible commands:');
            matches.forEach(match => this.addToHistory(`  ${match}`));
        }
    }

    executeCommand() {
        try {
            const input = this.elements.input?.value.trim() || '';
            if (!input) return;

            this.addToHistory(input);
            
            const [command, ...args] = input.split(' ');
            const cmd = this.commands[command.toLowerCase()];
            
            if (cmd) {
                cmd(args);
            } else {
                this.addToHistory(`Command not found: ${command}`, 'error');
                this.addToHistory('Type "help" for available commands');
            }

            if (this.elements.input) {
                this.elements.input.value = '';
                this.rafCallback();
            }
        } catch (error) {
            console.error('Command execution failed:', error);
            this.addToHistory('Failed to execute command', 'error');
        }
    }

    addToHistory(text, type = '') {
        try {
            if (!this.elements.history) return;
            
            const fragment = document.createDocumentFragment();
            const line = document.createElement('div');
            line.className = `terminal-history-line ${type}`;
            line.textContent = text;
            
            // Optimize animation setup
            line.style.opacity = '0';
            line.style.transform = 'translateX(-10px)';
            fragment.appendChild(line);
            
            this.elements.history.appendChild(fragment);

            // Use optimized animation
            requestAnimationFrame(() => {
                anime({
                    targets: line,
                    opacity: 1,
                    translateX: 0,
                    duration: 300,
                    easing: 'easeOutCubic',
                    complete: () => {
                        line.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        } catch (error) {
            console.error('History update failed:', error);
        }
    }

    clearHistory() {
        try {
            if (this.elements.history) {
                this.elements.history.innerHTML = '';
            }
        } catch (error) {
            console.error('History clear failed:', error);
        }
    }

    showHelp() {
        const commands = [
            'Available commands:',
            'help     - Show this help message',
            'clear    - Clear terminal history',
            'about    - Go to About page',
            'projects - Go to Projects page',
            'contact  - Go to Contact page',
            'ls       - List all sections',
            'whoami   - Display user info',
            'date     - Show current date/time',
            'echo     - Echo back your text',
            'skills   - List my technical skills',
            'social   - Show social media links',
            'pwd      - Print working directory',
            'cat      - Read a file',
            'cd       - Change directory'
        ];
        commands.forEach(cmd => this.addToHistory(cmd));
    }

    listSections() {
        const sections = [
            'about.html',
            'projects.html',
            'contact.html'
        ];
        this.addToHistory('Available sections:');
        sections.forEach(section => this.addToHistory(`  ${section}`));
    }

    showSkills() {
        const skills = [
            '[SECURITY]',
            '  ├── Penetration Testing',
            '  ├── Network Security',
            '  ├── Active Directory',
            '  └── Cloud Security',
            '',
            '[DEVELOPMENT]',
            '  ├── Python',
            '  ├── PowerShell',
            '  ├── Bash',
            '  └── Web Development',
            '',
            '[CERTIFICATIONS]',
            '  ├── OSCP',
            '  └── OSEP (In Progress)'
        ];
        skills.forEach(skill => this.addToHistory(skill));
    }

    showSocial() {
        const social = [
            'Social Links:',
            '  GitHub:   https://github.com/rileymxyz',
            '  LinkedIn: https://www.linkedin.com/in/riley-mcgowen',
            '  Twitter:  https://x.com/rileymxyz'
        ];
        social.forEach(link => this.addToHistory(link));
    }

    showCurrentPath() {
        this.addToHistory('/home/riley/web-app' + window.location.pathname);
    }

    catFile(args) {
        if (!args || args.length === 0) {
            this.addToHistory('Usage: cat <filename>', 'error');
            return;
        }

        const filename = args[0];
        const fileContents = {
            'readme.md': [
                '# Riley McGowen',
                'IT Professional & Security Specialist',
                '',
                'Welcome to my portfolio website!',
                'Type "help" to see available commands.'
            ],
            'skills.txt': [
                'Technical Skills:',
                '- Penetration Testing',
                '- Network Security',
                '- Python Development',
                '- Cloud Security'
            ]
        };

        if (fileContents[filename]) {
            fileContents[filename].forEach(line => this.addToHistory(line));
        } else {
            this.addToHistory(`File not found: ${filename}`, 'error');
        }
    }

    changeDirectory(args) {
        if (!args || args.length === 0) {
            this.addToHistory('Usage: cd <directory>', 'error');
            return;
        }

        const dir = args[0];
        if (dir === '/' || dir === '~') {
            window.location.href = '/';
        } else if (dir === 'about') {
            this.navigateTo('/about.html');
        } else if (dir === 'projects') {
            this.navigateTo('/projects.html');
        } else if (dir === 'contact') {
            this.navigateTo('/contact.html');
        } else {
            this.addToHistory(`Directory not found: ${dir}`, 'error');
        }
    }

    showWhoami() {
        const info = [
            'Riley McGowen',
            'IT Professional & Security Specialist',
            'Location: Seattle, WA',
            'Status: Available for Security Projects'
        ];
        info.forEach(line => this.addToHistory(line));
    }

    showDate() {
        this.addToHistory(new Date().toLocaleString());
    }

    echo(args) {
        if (args && args.length > 0) {
            this.addToHistory(args.join(' '));
        }
    }

    initializeTypewriter() {
        const typewriterElement = document.querySelector('.typing-text');
        if (!typewriterElement) return;

        // Enhanced typewriter settings with cursor management
        const typewriterSettings = {
            delay: 75,
            cursor: '█',
            wrapperClassName: 'typewriter-wrapper',
            loop: false,
            cursorClassName: 'command-cursor',
            // Add cursor state management
            onInit: (typewriter) => {
                this.typewriters.set('command', typewriter);
            }
        };

        const commandTypewriter = new Typewriter(typewriterElement, typewriterSettings);

        // Start typing sequence in next frame
        requestAnimationFrame(() => {
            commandTypewriter
                .typeString('cat menu.md')
                .pauseFor(500)
                .callFunction(() => {
                    this.animateMenuReveal();
                    // Hide command cursor after typing completes
                    const commandCursor = document.querySelector('.command-cursor');
                    if (commandCursor) {
                        commandCursor.style.opacity = '0';
                        commandCursor.style.visibility = 'hidden';
                    }
                })
                .pauseFor(500)
                .callFunction(() => {
                    this.animateInputLineReveal();
                })
                .start();
        });
    }

    animateMenuReveal() {
        const menu = document.querySelector('.command-output');
        if (!menu) return;

        // Clear any existing animation
        if (this.animations.has('menu')) {
            this.animations.get('menu').pause();
        }

        // Create new animation
        const animation = anime({
            targets: menu,
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 800,
            easing: 'easeOutExpo',
            begin: () => {
                menu.style.display = 'block';
                menu.style.opacity = 0;
            }
        });

        this.animations.set('menu', animation);
    }

    animateInputLineReveal() {
        const inputLine = document.querySelector('.terminal-input-line');
        if (!inputLine) return;

        // Clear any existing animation
        if (this.animations.has('input')) {
            this.animations.get('input').pause();
        }

        // Create new animation
        const animation = anime({
            targets: inputLine,
            opacity: [0, 1],
            translateY: [5, 0],
            duration: 600,
            easing: 'easeOutCubic',
            begin: () => {
                inputLine.style.display = 'flex';
                inputLine.style.opacity = 0;
                
                // Reset and show input cursor
                const inputCursor = document.querySelector('.input-cursor');
                if (inputCursor) {
                    inputCursor.style.display = 'inline-block';
                    inputCursor.style.opacity = '1';
                    inputCursor.style.visibility = 'visible';
                }
            },
            complete: () => {
                if (this.elements.input) {
                    this.elements.input.focus();
                    this.rafCallback();
                }
            }
        });

        this.animations.set('input', animation);
    }

    updateCursorPosition() {
        if (!this.elements.input || !this.elements.inputCursor) return;
        
        // Cache DOM reads
        const inputValue = this.elements.input.value;
        const cursorPosition = this.getTextWidth(inputValue);
        
        // Batch DOM writes
        requestAnimationFrame(() => {
            const typewriterWrapper = this.elements.inputCursor.closest('.typewriter-wrapper');
            if (typewriterWrapper) {
                typewriterWrapper.style.transform = `translateX(${cursorPosition}px)`;
            }
        });
    }

    // Add static method to reset instance
    static resetInstance() {
        Terminal.#instance = null;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    const instance = Terminal.getInstance();
    if (instance) {
        // Cleanup resources
        instance.typewriters.forEach(typewriter => typewriter.stop());
        instance.animations.forEach(animation => animation.pause());
        instance.pendingUpdates.clear();
        
        // Reset the instance using a static method
        Terminal.resetInstance();
    }
}); 

