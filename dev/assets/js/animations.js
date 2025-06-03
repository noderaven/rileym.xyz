// Page-level animations using Anime.js
export class PageAnimations {
    constructor() {
        this.initializeAnimations();
        this.setupBackgroundEffects();
        this.initializeEyeAnimations();
    }

    initializeAnimations() {
        // Initial page load animation sequence
        this.animateHeroTitle();
        this.animateTerminal();
        this.animateScrollIndicator();
        this.animateAccentLines();
        this.animateGridBackground();
    }

    animateHeroTitle() {
        const title = document.querySelector('.hero-title');
        if (!title) return;

        // Create glitch effect for the title
        anime({
            targets: title,
            opacity: [0, 1],
            translateY: [-20, 0],
            duration: 1200,
            easing: 'easeOutExpo',
            begin: () => {
                title.style.opacity = '0';
                title.style.transform = 'translateY(-20px)';
            }
        });

        // Add enhanced hover effect for title
        title.addEventListener('mouseenter', () => {
            anime({
                targets: title,
                scale: 1.03,
                textShadow: [
                    '0 0 12px rgba(80, 250, 123, 0.8)',
                    '0 0 24px rgba(80, 250, 123, 0.6)',
                    '0 0 36px rgba(80, 250, 123, 0.4)',
                    '0 0 48px rgba(80, 250, 123, 0.3)',
                    '0 0 60px rgba(80, 250, 123, 0.2)'
                ],
                duration: 400,
                easing: 'easeOutExpo'
            });
        });

        title.addEventListener('mouseleave', () => {
            anime({
                targets: title,
                scale: 1,
                textShadow: '0 0 0 rgba(80, 250, 123, 0)',
                duration: 400,
                easing: 'easeOutExpo'
            });
        });

        // Add hover effect to menu items
        document.querySelectorAll('.menu-items li a').forEach(item => {
            item.addEventListener('mouseenter', () => {
                anime({
                    targets: item,
                    translateX: 10,
                    textShadow: [
                        '0 0 12px rgba(255, 0, 255, 0.8)',
                        '0 0 24px rgba(255, 0, 255, 0.6)',
                        '0 0 36px rgba(255, 0, 255, 0.4)',
                        '0 0 48px rgba(255, 0, 255, 0.3)',
                        '0 0 60px rgba(255, 0, 255, 0.2)'
                    ],
                    color: '#ff00ff',
                    duration: 400,
                    easing: 'easeOutExpo'
                });
            });

            item.addEventListener('mouseleave', () => {
                anime({
                    targets: item,
                    translateX: 0,
                    textShadow: '0 0 0 rgba(255, 0, 255, 0)',
                    color: 'var(--text-color)',
                    duration: 400,
                    easing: 'easeOutExpo'
                });
            });
        });
    }

    animateAccentLines() {
        // Animate accent lines with glow effect
        anime({
            targets: ['.accent-line-1', '.accent-line-2'],
            scaleX: [0, 1],
            opacity: [0, 0.3],
            duration: 1500,
            delay: anime.stagger(200),
            easing: 'easeOutExpo',
            begin: (anim) => {
                anim.animatables.forEach(({ target }) => {
                    target.style.transformOrigin = 'left';
                    target.style.opacity = '0';
                });
            }
        });

        // Add subtle pulse animation
        anime({
            targets: ['.accent-line-1', '.accent-line-2'],
            opacity: [0.3, 0.1],
            duration: 2000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }

    animateGridBackground() {
        const gridBg = document.querySelector('.grid-bg');
        if (!gridBg) return;

        // Create matrix-like grid effect
        anime({
            targets: gridBg,
            opacity: [0, 0.15],
            duration: 2000,
            easing: 'easeOutExpo'
        });

        // Add subtle scale animation
        anime({
            targets: gridBg,
            scale: [1, 1.1],
            duration: 10000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }

    setupBackgroundEffects() {
        // Create floating particles in terminal background
        const terminalBg = document.querySelector('.terminal-bg');
        if (!terminalBg) return;

        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'terminal-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '100%';
            particle.style.opacity = '0';
            terminalBg.appendChild(particle);

            anime({
                targets: particle,
                translateY: [0, -window.innerHeight * 1.2],
                translateX: () => anime.random(-50, 50),
                opacity: {
                    value: [0, 0.3, 0],
                    duration: 4000,
                    easing: 'easeInOutQuad'
                },
                scale: {
                    value: [1, 0.1],
                    duration: 4000,
                    easing: 'easeInOutQuad'
                },
                duration: 4000,
                complete: () => {
                    particle.remove();
                }
            });
        };

        // Create particles periodically
        setInterval(createParticle, 300);
    }

    animateTerminal() {
        const terminal = document.querySelector('.terminal-container');
        if (!terminal) return;

        // Animate terminal container with matrix-like reveal
        anime({
            targets: terminal,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 1000,
            easing: 'easeOutCubic',
            begin: () => {
                terminal.style.opacity = '0';
                terminal.style.transform = 'translateY(20px)';
            }
        });

        // Add hover effect to menu items
        document.querySelectorAll('.menu-items li').forEach(item => {
            item.addEventListener('mouseenter', () => {
                anime({
                    targets: item,
                    translateX: 10,
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            });

            item.addEventListener('mouseleave', () => {
                anime({
                    targets: item,
                    translateX: 0,
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            });
        });

        // Animate menu items with stagger
        anime({
            targets: '.menu-items li',
            opacity: [0, 1],
            translateX: [-20, 0],
            delay: anime.stagger(100, { start: 1500 }),
            duration: 800,
            easing: 'easeOutCubic',
            begin: (anim) => {
                anim.animatables.forEach(({ target }) => {
                    target.style.opacity = '0';
                    target.style.transform = 'translateX(-20px)';
                });
            }
        });
    }

    animateScrollIndicator() {
        const indicator = document.querySelector('.scroll-indicator');
        if (!indicator) return;

        // Fade in scroll indicator
        anime({
            targets: indicator,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            delay: 2000,
            easing: 'easeOutCubic',
            begin: () => {
                indicator.style.opacity = '0';
                indicator.style.transform = 'translateY(20px)';
            }
        });

        // Continuous scroll line animation with glow effect
        anime({
            targets: '.scroll-line',
            scaleY: [0, 1],
            translateY: [0, 10],
            duration: 1500,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutQuad',
            update: (anim) => {
                const progress = anim.progress / 100;
                const target = anim.animatables[0].target;
                target.style.boxShadow = `0 0 ${10 * progress}px rgba(80, 250, 123, ${0.5 * progress})`;
            }
        });
    }

    initializeEyeAnimations() {
        const eyes = document.querySelectorAll('.eye');
        if (!eyes.length) return;

        // Add constant subtle pulse animation to eyes
        anime({
            targets: '.eye',
            scale: [1, 1.05],
            boxShadow: [
                '0 0 15px rgba(255, 0, 255, 0.5)',
                '0 0 25px rgba(255, 0, 255, 0.7)'
            ],
            duration: 1500,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine',
            update: function(anim) {
                // Preserve the original rotation while scaling
                eyes.forEach(eye => {
                    eye.style.transform = `rotate(180deg) scale(${1 + (0.05 * anim.progress / 100)})`;
                });
            }
        });

        // Add interactive hover effects
        eyes.forEach(eye => {
            eye.addEventListener('mouseenter', () => {
                anime({
                    targets: eye,
                    scale: 1.2,
                    boxShadow: [
                        '0 0 25px rgba(255, 0, 255, 0.8)',
                        '0 0 35px rgba(255, 0, 255, 0.6)',
                        '0 0 45px rgba(255, 0, 255, 0.4)',
                        '0 0 55px rgba(255, 0, 255, 0.2)'
                    ],
                    duration: 500,
                    easing: 'easeOutExpo',
                    update: function(anim) {
                        // Preserve the original rotation during hover
                        eye.style.transform = `rotate(180deg) scale(${1 + (0.2 * anim.progress / 100)})`;
                    }
                });

                // Add radial burst effect on hover
                const burst = document.createElement('div');
                burst.className = 'eye-burst';
                eye.appendChild(burst);

                anime({
                    targets: burst,
                    scale: [1, 2],
                    opacity: [0.5, 0],
                    duration: 1000,
                    easing: 'easeOutExpo',
                    complete: () => burst.remove()
                });
            });

            eye.addEventListener('mouseleave', () => {
                anime({
                    targets: eye,
                    scale: 1,
                    boxShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
                    duration: 500,
                    easing: 'easeOutExpo',
                    update: function(anim) {
                        // Preserve the original rotation during hover out
                        eye.style.transform = `rotate(180deg) scale(${1 + (0.2 * (100 - anim.progress) / 100)})`;
                    }
                });
            });

            // Add random "blink" effect
            setInterval(() => {
                if (Math.random() < 0.3) { // 30% chance to blink
                    anime({
                        targets: eye,
                        scaleY: [1, 0.1, 1],
                        duration: 200,
                        easing: 'easeInOutSine',
                        update: function(anim) {
                            // Maintain rotation and horizontal scale during blink
                            const currentScaleY = 1 - (0.9 * anim.progress / 100);
                            eye.style.transform = `rotate(180deg) scaleY(${currentScaleY})`;
                        }
                    });
                }
            }, 3000);

            // Animate pupil movement
            const pupil = eye.querySelector('.pupil');
            if (pupil) {
                anime({
                    targets: pupil,
                    translateX: [-15, 15],
                    duration: 3000,
                    direction: 'alternate',
                    loop: true,
                    easing: 'easeInOutSine'
                });
            }
        });
    }
}

// Add necessary CSS for new animations
const style = document.createElement('style');
style.textContent = `
    .terminal-particle {
        position: absolute;
        width: 2px;
        height: 2px;
        background: var(--accent-color);
        pointer-events: none;
        border-radius: 50%;
    }

    .hero-title {
        transition: text-shadow 0.3s ease;
    }

    .accent-line-1,
    .accent-line-2 {
        will-change: transform, opacity;
    }

    .grid-bg {
        will-change: transform, opacity;
    }

    .menu-items li {
        will-change: transform;
        transition: color 0.3s ease;
    }

    .menu-items li:hover {
        color: var(--accent-color);
    }

    .eye {
        position: absolute;
        will-change: transform, box-shadow;
        transition: all 0.3s ease;
        cursor: pointer;
        top: calc(var(--navbar-height) + 20px);
    }

    .eye-1 {
        left: 15%;
    }

    .eye-2 {
        left: calc(15% + 140px);
    }

    .eye-burst {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,0,255,0.5) 0%, rgba(255,0,255,0) 70%);
        pointer-events: none;
        z-index: -1;
    }

    .pupil {
        will-change: transform;
    }
`;
document.head.appendChild(style);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PageAnimations();
}); 