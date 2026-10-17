// blackhole.js - Relativistic Event Horizon Simulator
class BlackHoleEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId) || document.body;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.style.position = 'absolute';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '0';
        this.container.appendChild(this.canvas);

        this.size = 350;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        
        this.angle = 0;
        this.init();
    }

    init() {
        this.animate();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.size, this.size);
        let cx = this.size / 2;
        let cy = this.size / 2;

        this.angle += 0.03;

        // 1. Gravitational Lensing Halo (Outer Glow)
        let gradient = this.ctx.createRadialGradient(cx, cy, 30, cx, cy, 140);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.3, 'rgba(0, 255, 120, 0.8)');
        gradient.addColorStop(0.6, 'rgba(0, 180, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.size, this.size);

        // 2. Accretion Disk (Rotating Matter Stream)
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(this.angle);

        for (let i = 0; i < 6; i++) {
            this.ctx.rotate(Math.PI / 3);
            let diskGrad = this.ctx.createLinearGradient(-100, 0, 100, 0);
            diskGrad.addColorStop(0, 'rgba(0, 255, 100, 0)');
            diskGrad.addColorStop(0.5, 'rgba(200, 255, 240, 0.9)');
            diskGrad.addColorStop(1, 'rgba(0, 150, 255, 0)');

            this.ctx.strokeStyle = diskGrad;
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 120, 45, Math.PI / 6, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // 3. Event Horizon (The Absolute Black Core)
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000000';
        this.ctx.shadowBlur = 30;
        this.ctx.shadowColor = '#00ff88';
        this.ctx.fill();

        requestAnimationFrame(() => this.animate());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Attach to a specific wrapper element if available, or initialize globally
    const target = document.querySelector('.blackhole-container') || document.body;
    if(target) new BlackHoleEngine(target.id || 'blackhole-container');
});
