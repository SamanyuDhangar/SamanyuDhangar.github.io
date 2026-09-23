const canvas = document.getElementById('cyber-particles');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
}
window.addEventListener('resize', resizeCanvas);

// Configuration Settings
const particleCount = 100;       
const connectionDistance = 140;  
let particles = [];

// Mouse tracking context for interactive hacking element
const mouse = {
    x: null,
    y: null,
    radius: 150 // Distance where mouse pushes particles away
};

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 1; 
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        
        // Dynamic binary-stream tag attachment
        this.isBinaryNode = Math.random() > 0.85;
        this.binaryChar = Math.random() > 0.5 ? "1" : "0";
        this.charTimer = 0;
    }

    update() {
        // Interactive Mouse Repel Force
        if (mouse.x != null && mouse.y != null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < mouse.radius) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxForce = (mouse.radius - distance) / mouse.radius;
                let force = maxForce * 3; // Push speed multiplier
                
                this.x -= forceDirectionX * force;
                this.y -= forceDirectionY * force;
            } else {
                // Return gracefully to trajectory
                this.x += this.speedX;
                this.y += this.speedY;
            }
        } else {
            this.x += this.speedX;
            this.y += this.speedY;
        }

        // Screen wrap around bounds check
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Animate digital values on nodes
        if (this.isBinaryNode) {
            this.charTimer++;
            if (this.charTimer > 40) {
                this.binaryChar = Math.random() > 0.5 ? "1" : "0";
                this.charTimer = 0;
            }
        }
    }

    draw() {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff88';
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // If it's a binary stream node, overlay code numbers onto it
        if (this.isBinaryNode) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
            ctx.font = '10px monospace';
            ctx.fillText(this.binaryChar, this.x + 6, this.y + 4);
        }
        ctx.shadowBlur = 0; // Clear blur layer
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function drawLines() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
                const opacity = 1 - (distance / connectionDistance);
                
                // Draw digital matrix grid green wires
                ctx.strokeStyle = `rgba(0, 255, 136, ${opacity * 0.35})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    drawLines();
    requestAnimationFrame(animate);
}

resizeCanvas();
animate();
