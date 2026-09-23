const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", () => {
  const boot = $("#boot-screen");
  const log = $("#boot-log");
  const bar = $("#boot-progress-bar");
  const percent = $("#boot-percent");

  const messages = [
    "loading kernel modules...",
    "checking network stack...",
    "mounting security protocols...",
    "loading user profile...",
    "eclipse interface ready."
  ];

  let progress = 0;
  let messageIndex = 0;

  const bootTimer = setInterval(() => {
    progress += Math.floor(Math.random() * 12) + 5;
    if (progress > 100) progress = 100;

    bar.style.width = `${progress}%`;
    percent.textContent = progress;

    if (messageIndex < messages.length && progress >= (messageIndex + 1) * 18) {
      const line = document.createElement("div");
      line.textContent = `[ OK ] ${messages[messageIndex]}`;
      log.appendChild(line);
      messageIndex++;
    }

    if (progress === 100) {
      clearInterval(bootTimer);
      setTimeout(() => {
        boot.classList.add("done");
        $$(".reveal").slice(0, 2).forEach(el => el.classList.add("visible"));
      }, 450);
    }
  }, 120);

  // Mouse-following glow
  const glow = $(".cursor-glow");
  window.addEventListener("pointermove", (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  });

  // Navbar background + active section
  const topbar = $(".topbar");
  const sections = $$("main section[id]");
  const navLinks = $$("nav a");

  const updateNav = () => {
    topbar.classList.toggle("scrolled", window.scrollY > 30);

    let current = "home";
    sections.forEach(section => {
      const top = section.offsetTop - 160;
      if (window.scrollY >= top) current = section.id;
    });

    navLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  };

  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

  // Mobile menu
  const menu = $("#menu-toggle");
  const nav = $("#nav");

  menu.addEventListener("click", () => {
    nav.classList.toggle("open");
    menu.textContent = nav.classList.contains("open") ? "CLOSE" : "MENU";
  });

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menu.textContent = "MENU";
    });
  });

  // Reveal on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  $$(".reveal").forEach(el => observer.observe(el));

  // Small parallax on the hero terminal
  const terminal = $(".terminal-window");
  window.addEventListener("pointermove", (event) => {
    if (window.innerWidth < 900) return;
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    terminal.style.transform =
      `perspective(1000px) rotateY(${-4 + x * 1.5}deg) rotateX(${2 - y * 1.2}deg)`;
  });

  // Placeholder project links
  const toast = $("#toast");
  $$(".project-link[data-placeholder]").forEach(link => {
    link.addEventListener("click", (event) => {
      if (link.getAttribute("href") === "#") {
        event.preventDefault();
        toast.textContent = `// ${link.dataset.placeholder}`;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2600);
      }
    });
  });

  // Footer year
  $("#year").textContent = new Date().getFullYear();
});
const canvas = document.getElementById('cyber-particles');
const ctx = canvas.getContext('2d');

// Track window dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
}
window.addEventListener('resize', resizeCanvas);

// Configuration Settings
const particleCount = 100;       // Total number of nodes
const connectionDistance = 120;  // Max distance to draw lines between particles
let particles = [];

// Particle Constructor
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1; // 1px to 3px dots
        
        // Random drift speed and direction (-0.5 to +0.5 pixels per frame)
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
    }

    // Move the particle and bounce off edges
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    // Render the particle dot
    draw() {
        ctx.fillStyle = 'rgba(0, 255, 170, 0.8)'; // Bright neon green/teal
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Generate the initial particle grid
function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

// Draw linking lines between close particles
function drawLines() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If particles are near each other, draw a fading line
            if (distance < connectionDistance) {
                // Opacity fades out the further away they get
                const opacity = 1 - (distance / connectionDistance);
                ctx.strokeStyle = `rgba(0, 255, 170, ${opacity * 0.25})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
}

// Primary Animation Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw nodes
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Draw connecting mesh
    drawLines();

    requestAnimationFrame(animate);
}

// Start everything up
resizeCanvas();
animate();
