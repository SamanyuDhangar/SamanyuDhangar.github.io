// Combined Relativistic Black Hole & Quantum Wave Grid Physics Engine
(function () {
    const canvas = document.createElement('canvas');
    canvas.id = 'space-engine-overlay';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none'; // Keeps portfolio fully clickable
    canvas.style.zIndex = '2147483647';   // Forced to the absolute top
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Mouse / Touch pointer tracker with smooth physics damping (lerp)
    const pointer = {
        x: width / 2,
        y: height / 2,
        targetX: width / 2,
        targetY: height / 2
    };

    // Scroll progress tracker
    let scrollProgress = 0;
    let targetScrollProgress = 0;

    window.addEventListener('scroll', () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 0) {
            targetScrollProgress = window.scrollY / maxScroll;
        }
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
        pointer.targetX = e.clientX;
        pointer.targetY = e.clientY;
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            pointer.targetX = e.touches[0].clientX;
            pointer.targetY = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            pointer.targetX = e.touches[0].clientX;
            pointer.targetY = e.touches[0].clientY;
        }
    }, { passive: true });

    // Generate Accretion Disk Particles for the Black Hole Cursor
    const particles = [];
    const particleCount = 150; // Optimized count for smooth mobile/desktop performance
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            radius: Math.random() * 90 + 30,
            angle: Math.random() * Math.PI * 2,
            speed: (Math.random() * 0.03 + 0.015) * (Math.random() < 0.5 ? 1 : -1),
            size: Math.random() * 1.5 + 0.5,
            colorHue: Math.random() > 0.4 ? 30 : 200 // Orange plasma vs Blue shift
        });
    }

    let time = 0;

    function animate() {
        // Smooth interpolation for pointer and scroll
        pointer.x += (pointer.targetX - pointer.x) * 0.1;
        pointer.y += (pointer.targetY - pointer.y) * 0.1;
        scrollProgress += (targetScrollProgress - scrollProgress) * 0.1;

        time += 0.03 + (scrollProgress * 0.04);

        ctx.clearRect(0, 0, width, height);

        // --- PART 1: Background Quantum Wave-Space Grid ---
        const cols = Math.floor(width / 60) + 1;
        const rows = Math.floor(height / 60) + 1;
        const spacingX = width / cols;
        const spacingY = height / rows;

        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                let baseX = i * spacingX;
                let baseY = j * spacingY;

                let dx = pointer.x - baseX;
                let dy = pointer.y - baseY;
                let dist = Math.sqrt(dx * dx + dy * dy);

                let amplitude = 12 + (scrollProgress * 15);
                let wave = Math.sin(dist * 0.02 - time * 2) * amplitude;
                let influence = Math.max(0, 1 - dist / 220);

                let currentX = baseX + (dx / (dist || 1)) * wave * influence;
                let currentY = baseY + (dy / (dist || 1)) * wave * influence;

                let alpha = 0.2 + influence * 0.5;
                let hue = 190 + (scrollProgress * 90);

                // Draw background grid nodes
                ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(currentX, currentY, 1, 0, Math.PI * 2);
                ctx.fill();

                // Draw connecting cosmic web lines
                if (i < cols && j < rows) {
                    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${influence * 0.12})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(currentX, currentY);
                    ctx.lineTo(currentX + spacingX, currentY);
                    ctx.stroke();
                }
            }
        }

        // --- PART 2: Relativistic Black Hole Cursor & Accretion Disk ---
        const eventHorizonRadius = 35;
        const photonSphereRadius = 50;

        // Photon Sphere Glow Ring
        let gradient = ctx.createRadialGradient(pointer.x, pointer.y, eventHorizonRadius, pointer.x, pointer.y, photonSphereRadius * 1.4);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 140, 40, 0.85)'); // High-energy gravitational lensing glow
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, photonSphereRadius * 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Absolute Event Horizon Black Core
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, eventHorizonRadius, 0, Math.PI * 2);
        ctx.fill();

        // Accretion Disk Orbital Plasma Particles
        for (let p of particles) {
            p.angle += p.speed * (120 / p.radius);

            let x = pointer.x + Math.cos(p.angle) * p.radius;
            // Flatten Y axis to create a 3D tilted accretion disk look
            let y = pointer.y + Math.sin(p.angle) * (p.radius * 0.35);

            let isTowardViewer = Math.sin(p.angle) > 0;
            let pAlpha = Math.min(1, (p.radius / 100)) * (isTowardViewer ? 0.9 : 0.4);

            ctx.fillStyle = `hsla(${p.colorHue}, 100%, 60%, ${pAlpha})`;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }

    animate();
})();
