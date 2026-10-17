// Lightweight Quantum Wave-Space Physics Engine with Scroll Interaction for Mobile & Desktop
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'quantum-overlay';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none'; // Ensures portfolio buttons/links remain clickable
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Track mouse or touch coordinates smoothly
    const pointer = {
        x: width / 2,
        y: height / 2,
        targetX: width / 2,
        targetY: height / 2,
        active: false
    };

    // Track scroll velocity / depth for physics modulation
    let scrollProgress = 0;
    let targetScrollProgress = 0;

    window.addEventListener('scroll', () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 0) {
            targetScrollProgress = window.scrollY / maxScroll;
        }
    }, { passive: true });

    // Mouse events
    window.addEventListener('mousemove', (e) => {
        pointer.targetX = e.clientX;
        pointer.targetY = e.clientY;
    });

    // Touch events for mobile users
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            pointer.targetX = e.touches[0].clientX;
            pointer.targetY = e.touches[0].clientY;
            pointer.active = true;
        }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            pointer.targetX = e.touches[0].clientX;
            pointer.targetY = e.touches[0].clientY;
            pointer.active = true;
        }
    }, { passive: true });

    let time = 0;

    // Optimized animation loop designed for high performance on mobile processors
    function animate() {
        // Smooth damping (lerp) for pointer movement and scroll progress
        pointer.x += (pointer.targetX - pointer.x) * 0.1;
        pointer.y += (pointer.targetY - pointer.y) * 0.1;
        scrollProgress += (targetScrollProgress - scrollProgress) * 0.1;

        // Dynamic wave speed scaled by how far down the user has scrolled
        let dynamicSpeed = 0.03 + (scrollProgress * 0.05);
        time += dynamicSpeed;

        ctx.clearRect(0, 0, width, height);

        // Draw interactive quantum harmonic nodes
        const cols = Math.floor(width / 50) + 1;
        const rows = Math.floor(height / 50) + 1;
        const spacingX = width / cols;
        const spacingY = height / rows;

        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                let baseX = i * spacingX;
                let baseY = j * spacingY;

                // Distance calculation from pointer (finger/cursor)
                let dx = pointer.x - baseX;
                let dy = pointer.y - baseY;
                let dist = Math.sqrt(dx * dx + dy * dy);

                // Quantum wave displacement formula modulated by scroll depth amplitude
                let amplitude = 15 + (scrollProgress * 15); // Waves get taller/stronger as you scroll down
                let wave = Math.sin(dist * 0.02 - time * 2) * amplitude;
                let influence = Math.max(0, 1 - dist / 250); // Localized interaction range

                // Displace nodes based on pointer proximity and wave functions
                let currentX = baseX + (dx / (dist || 1)) * wave * influence;
                let currentY = baseY + (dy / (dist || 1)) * wave * influence;

                // Render lightweight node points (color shifts toward violet/cyan based on scroll)
                let alpha = (0.2 + influence * 0.8);
                let size = 1 + influence * 2;
                let hue = 190 + (scrollProgress * 90); // Shifts from electric blue to deep purple on scroll

                ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(currentX, currentY, size, 0, Math.PI * 2);
                ctx.fill();

                // Connect close nodes with subtle web lines
                if (i < cols && j < rows) {
                    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${influence * 0.15})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(currentX, currentY);
                    ctx.lineTo(currentX + spacingX, currentY);
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
})();
