// particles.js - Advanced Quantum Gravitational Field Simulation
class QuantumField {
    constructor() {
        this.canvas = document.getElementById('particles-canvas') || this.createCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 30 : 70;
        this.mouse = { x: null, y: null, radius: 180, isPressed: false };
        
        this.init();
        this.setupListeners();
        this.animate();
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';
        document.body.prepend(canvas);
        return canvas;
    }

    init() {
        this.resize();
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                size: Math.random() * 2 + 1,
                baseAlpha: Math.random() * 0.7 + 0.3
            });
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupListeners() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];

            // Physics: Mouse gravitational pull / swirling vortex
            if (this.mouse.x !== null && this.mouse.y !== null) {
                let dx = this.mouse.x - p.x;
                let dy = this.mouse.y - p.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.mouse.radius && dist > 5) {
                    let force = (this.mouse.radius - dist) / this.mouse.radius;
                    // Gravitational acceleration + perpendicular tangential vortex force
                    p.vx += (dx / dist) * force * 0.4 - (dy / dist) * force * 0.2;
                    p.vy += (dy / dist) * force * 0.4 + (dx / dist) * force * 0.2;
                }
            }

            // Damping to prevent infinite acceleration
            p.vx *= 0.96;
            p.vy *= 0.96;

            p.x += p.vx;
            p.y += p.vy;

            // Screen boundary wrapping
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 128, ${p.baseAlpha})`;
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = '#00ff80';
            this.ctx.fill();

            // Quantum Entanglement Web Lines
            for (let j = i + 1; j < this.particles.length; j++) {
                let p2 = this.particles[j];
                let ndx = p.x - p2.x;
                let ndy = p.y - p2.y;
                let nDist = Math.sqrt(ndx * ndx + ndy * ndy);

                if (nDist < 100) {
                    let alpha = (1 - (nDist / 100)) * 0.25;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(0, 255, 150, ${alpha})`;
                    this.ctx.lineWidth = 0.6;
                    this.ctx.stroke();
                }
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    new QuantumField();
});
