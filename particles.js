/* Background particle field — single canvas (#cyber-particles).
   Cheap glow via a pre-rendered sprite (no shadowBlur), pauses when the
   tab is hidden, respects reduced-motion. */
(() => {
  "use strict";

  const canvas = document.getElementById("cyber-particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COUNT = window.innerWidth < 768 ? 28 : 60;
  const LINK_DIST = 100;
  const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
  const MOUSE_RADIUS = 180;

  const mouse = { x: null, y: null };
  let particles = [];
  let width = 0;
  let height = 0;
  let rafId = 0;

  // Pre-rendered glowing dot
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 32;
  {
    const s = sprite.getContext("2d");
    const g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(0, 255, 128, 1)");
    g.addColorStop(0.25, "rgba(0, 255, 128, 0.55)");
    g.addColorStop(1, "rgba(0, 255, 128, 0)");
    s.fillStyle = g;
    s.fillRect(0, 0, 32, 32);
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.7 + 0.3
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = "rgb(0, 255, 150)";

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Mouse gravity + slight swirl
      if (mouse.x !== null) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < MOUSE_RADIUS * MOUSE_RADIUS && distSq > 25) {
          const dist = Math.sqrt(distSq);
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx += (dx / dist) * force * 0.4 - (dy / dist) * force * 0.2;
          p.vy += (dy / dist) * force * 0.4 + (dx / dist) * force * 0.2;
        }
      }

      p.vx *= 0.96;
      p.vy *= 0.96;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = width;
      else if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      else if (p.y > height) p.y = 0;

      // Dot (glow comes from the sprite)
      const d = p.size * 5;
      ctx.globalAlpha = p.alpha;
      ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);

      // Links to nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const ndx = p.x - q.x;
        const ndy = p.y - q.y;
        const nSq = ndx * ndx + ndy * ndy;
        if (nSq < LINK_DIST_SQ) {
          ctx.globalAlpha = (1 - Math.sqrt(nSq) / LINK_DIST) * 0.25;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    step();
    rafId = requestAnimationFrame(loop);
  }

  const start = () => { if (!rafId && !reduceMotion) loop(); };
  const stop = () => { cancelAnimationFrame(rafId); rafId = 0; };

  // Events
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (reduceMotion) step();
    }, 150);
  });
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => {
    mouse.x = mouse.y = null;
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  resize();
  createParticles();
  reduceMotion ? step() : start();
})();
