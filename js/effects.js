// Wedding floating effects — hearts & flower petals
(function() {
    const container = document.getElementById('effectsContainer');
    if (!container) return;

    const SYMBOLS = ['❤', '🌸', '🌺', '✿', '♡', '🌷', '🌼', '💕', '💗'];
    let paused = false;
    let intervalId = null;

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createParticle() {
        if (paused || document.hidden) return;

        const el = document.createElement('span');
        el.className = 'fp';
        el.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        el.style.cssText = [
            `left: ${rand(2, 98)}%`,
            `font-size: ${rand(12, 28)}px`,
            `animation-duration: ${rand(7, 14)}s`,
            `animation-delay: ${rand(0, 1)}s`,
            `opacity: ${rand(0.4, 0.85)}`,
        ].join(';');

        container.appendChild(el);

        el.addEventListener('animationend', () => el.remove(), { once: true });
    }

    // Spawn initial burst
    for (let i = 0; i < 18; i++) {
        setTimeout(createParticle, i * 120);
    }

    // Continuous spawn
    intervalId = setInterval(createParticle, 400);

    // Pause when tab hidden (save resources)
    document.addEventListener('visibilitychange', () => {
        paused = document.hidden;
    });

    // Slow down on mobile to save battery
    if (window.innerWidth < 600) {
        clearInterval(intervalId);
        intervalId = setInterval(createParticle, 800);
    }
})();
