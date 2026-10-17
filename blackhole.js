/* Black-hole accent drawn behind the hero.
   Lightweight: gradients are created once, no shadowBlur, 30fps cap,
   and it only animates while the hero is on screen. */
(() => {
  "use strict";

  const container = document.querySelector(".blackhole-container") || document.querySelector(".hero");
  if (!container) return;

  const SIZE = 350;
  const FRAME_MS = 1000 / 30;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  canvas.className = "blackhole";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    right: "6vw",
    top: "12%",
    width: `${SIZE}px`,
    height: `${SIZE}px`,
    opacity: "0.35",
    pointerEvents: "none",
    zIndex: "0"
  });
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const c = SIZE / 2;

  // Gradients created once and reused every frame
  const halo = ctx.createRadialGradient(c, c, 30, c, c, 140);
  halo.addColorStop(0, "rgba(0, 0, 0, 1)");
  halo.addColorStop(0.3, "rgba(0, 255, 120, 0.8)");
  halo.addColorStop(0.6, "rgba(0, 180, 255, 0.2)");
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");

  const disk = ctx.createLinearGradient(-100, 0, 100, 0);
  disk.addColorStop(0, "rgba(0, 255, 100, 0)");
  disk.addColorStop(0.5, "rgba(200, 255, 240, 0.9)");
  disk.addColorStop(1, "rgba(0, 150, 255, 0)");

  const glow = ctx.createRadialGradient(c, c, 30, c, c, 64);
  glow.addColorStop(0, "rgba(0, 255, 136, 0.55)");
  glow.addColorStop(1, "rgba(0, 255, 136, 0)");

  let angle = 0;
  let last = 0;
  let rafId = 0;
  let heroVisible = true;

  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE);

    // 1. Lensing halo
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // 2. Accretion disk
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    ctx.strokeStyle = disk;
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, 120, 45, Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Event horizon
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(c, c, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(c, c, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop(now) {
    rafId = requestAnimationFrame(loop);
    if (now - last < FRAME_MS) return;
    last = now;
    angle += 0.06; // 0.03 per frame at 60fps, doubled for 30fps
    draw();
  }

  const start = () => { if (!rafId && heroVisible && !document.hidden && !reduceMotion) rafId = requestAnimationFrame(loop); };
  const stop = () => { cancelAnimationFrame(rafId); rafId = 0; };

  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    heroVisible ? start() : stop();
  }).observe(container);

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // Hide on small screens (saves battery, hero is crowded there)
  const mq = matchMedia("(max-width: 900px)");
  const applyMq = () => { canvas.style.display = mq.matches ? "none" : "block"; };
  mq.addEventListener("change", applyMq);
  applyMq();

  draw();
  start();
})();
