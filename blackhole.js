// Relativistic Black Hole & Gravitational Lensing Engine for Portfolio
(function () {
    // 1. Create and inject overlay canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'blackhole-overlay';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none'; // Keeps your portfolio clickable
    canvas.style.zIndex = '9999';        // Renders on top of everything
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // 2. Mouse tracker for the singularity center
    const mouse = {
        x: width / 2,
        y: height / 2,
        targetX: width / 2,
        targetY: height / 2
    };

    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
    });

    // 3. Generate background starfield (to show gravitational bending)
    const stars = [];
    const starCount = 300;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5,
            baseAlpha: Math.random() * 0.7 + 0.3
        });
    }

    // 4. Generate Accretion Disk Plasma Particles
    const particles = [];
    const particleCount = 400;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            radius: Math.random() * 120 + 40, // Distance from black hole center
            angle: Math.random() * Math.PI * 2,
            speed: (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1),
            size: Math.random() * 2 + 0.5,
            colorHue: Math.random() > 0.3 ? 30 : 200 // Orange plasma vs Blue Doppler shift
        });
    }

    // 5. Main Render Loop (Physics & General Relativity Approximation)
    function animate() {
        // Smooth mouse following (inertia / momentum)
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;

        ctx.clearRect(0, 0, width, height);

        // --- PART A: Draw Background Stars with Gravitational Lensing ---
        for (let star of stars) {
            let dx = mouse.x - star.x;
            let dy = mouse.y - star.y;
            let distSq = dx * dx + dy * dy;
            let dist = Math.sqrt(distSq);

            let renderX = star.x;
            let renderY = star.y;

            // Schwarzschild-inspired gravitational lensing deflection
            // Light bends more the closer it gets to the event horizon
            const eventHorizon = 70;
            if (dist < 350 && dist > eventHorizon) {
                let lensingForce = (15000 / distSq); 
                renderX -= (dx / dist) * lensingForce;
                renderY -= (dy / dist) * lensingForce;
            } else if (dist <= eventHorizon) {
                // Light captured by event horizon (invisible)
                continue;
            }

            ctx.fillStyle = `rgba(255, 255, 255, ${star.baseAlpha})`;
            ctx.beginPath();
            ctx.arc(renderX, renderY, star.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- PART B: Draw Event Horizon Core (The Black Void) ---
        const eventHorizonRadius = 45;
        const photonSphereRadius = 65;

        // Photon Sphere Glow (Einstein Ring Ring)
        let gradient = ctx.createRadialGradient(mouse.x, mouse.y, eventHorizonRadius, mouse.x, mouse.y, photonSphereRadius * 1.5);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.4, 'rgba(255, 140, 40, 0.8)'); // High-energy photon ring
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, photonSphereRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Absolute Black Hole Center
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, eventHorizonRadius, 0, Math.PI * 2);
        ctx.fill();

        // --- PART C: Accretion Disk Physics (Orbital Mechanics & Doppler Beaming) ---
        for (let p of particles) {
            // Keplerian-like orbital velocity (faster closer to center)
            p.angle += p.speed * (150 / p.radius);

            // Calculate current 3D-projected coordinates
            let x = mouse.x + Math.cos(p.angle) * p.radius;
            // Flatten Y to create a tilted 3D accretion disk perspective
            let y = mouse.y + Math.sin(p.angle) * (p.radius * 0.35);

            // Doppler Beaming Effect: Side rotating towards viewer is brighter/bluer, away is dimmer/redder
            let isMovingTowardViewer = Math.sin(p.angle) > 0;
            let alpha = Math.min(1, (p.radius / 160)) * (isMovingTowardViewer ? 0.9 : 0.4);

            ctx.fillStyle = `hsla(${p.colorHue}, 100%, 60%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }

    animate();
})();
