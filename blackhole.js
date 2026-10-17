// Lightweight Quantum Wave-Space Physics Engine for Mobile & Desktop
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
        time += 0.03;

        // Smooth damping (lerp) for pointer movement
        pointer.x += (pointer.targetX - pointer.x) * 0.1;
        pointer.y += (pointer.targetY - pointer.y) * 0.1;

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

                // Quantum wave displacement formula (Ripple effect)
                let wave = Math.sin(dist * 0.02 - time * 2) * 15;
                let influence = Math.max(0, 1 - dist / 250); // Localized interaction range

                // Displace nodes based on pointer proximity
                let currentX = baseX + (dx / (dist || 1)) * wave * influence;
                let currentY = baseY + (dy / (dist || 1)) * wave * influence;

                // Render lightweight node points
                let alpha = (0.2 + influence * 0.8);
                let size = 1 + influence * 2;

                ctx.fillStyle = `rgba(100, 200, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(currentX, currentY, size, 0, Math.PI * 2);
                ctx.fill();

                // Connect close nodes with subtle lines to form a space-grid web
                if (i < cols && j < rows) {
                    ctx.strokeStyle = `rgba(100, 150, 255, ${influence * 0.15})`;
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
