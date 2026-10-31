/* projects.js — three small 2D particle visuals, one per project. Each only animates while on screen. */
(function () {
  const SD = window.SD, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, TAU = Math.PI * 2;
  const mouse = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  const C = { s: "170,184,204", c: "92,214,242", w: "240,245,250", o: "225,160,80" };

  const visuals = {
    /* Eyes of Truth — an iris of rings that breathes, scatters and reforms; the pupil follows the cursor; it blinks */
    eye(cv, g) {
      const rings = 15, pts = [];
      for (let r = 0; r < rings; r++) { const n = 14 + r * 7; for (let i = 0; i < n; i++) pts.push({ r: 0.1 + r * 0.032, a: (i / n) * TAU, k: r, j: Math.random() }); }
      const lid = []; for (let i = 0; i < 160; i++) lid.push({ u: i / 159 });
      return (t, w, h, rect) => {
        const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.46, blink = 1 - Math.pow(Math.max(0, Math.sin(t * 0.7 - 1)), 60) * 0.92, cyc = (Math.sin(t * 0.5) + 1) / 2, scat = Math.pow(cyc, 6);
        const lx = (mouse.x - rect.left - cx) / w, ly = (mouse.y - rect.top - cy) / h, ox = Math.max(-1, Math.min(1, lx)) * R * 0.14, oy = Math.max(-1, Math.min(1, ly)) * R * 0.1;
        for (const q of lid) { const x = (q.u * 2 - 1) * R * 1.55, e = 1 - Math.pow(q.u * 2 - 1, 2); for (const s of [-1, 1]) dot(g, cx + x, cy + s * e * R * 0.62 * blink, 1.3, "w", 0.55); }
        for (const p of pts) {
          const a = p.a + t * (0.12 + p.k * 0.02) * (p.k % 2 ? 1 : -1), rr = (p.r * R * 2.1) * (1 + Math.sin(t * 1.2 + p.k) * 0.03), d = scat * (30 + p.j * 40);
          const x = cx + ox * (1 - p.r * 1.2) + Math.cos(a) * rr + Math.cos(p.j * 99) * d, y = cy + oy * (1 - p.r * 1.2) + Math.sin(a) * rr * blink + Math.sin(p.j * 77) * d;
          if (p.r < 0.17) continue; dot(g, x, y, 1.2 + p.j, p.k > 11 ? "c" : "s", 0.65);
        }
        for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU + t * 0.8, rr = R * 0.1; dot(g, cx + ox * 1.2 + Math.cos(a) * rr, cy + oy * 1.2 + Math.sin(a) * rr * blink, 1.6, "w", 0.9); }
        dot(g, cx + ox * 1.2 + R * 0.05, cy + oy * 1.2 - R * 0.05, 2.4, "o", 0.9);
      };
    },
    /* Network Field Notes — drifting nodes, links by proximity, packets travelling along them */
    net(cv, g) {
      const n = 26, nodes = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.02, vy: (Math.random() - 0.5) * 0.02 })), pk = [];
      let last = 0;
      return (t, w, h) => {
        const dt = Math.min(0.05, t - last); last = t;
        nodes.forEach((p) => { p.x += p.vx * dt * 6; p.y += p.vy * dt * 6; if (p.x < 0.05 || p.x > 0.95) p.vx *= -1; if (p.y < 0.08 || p.y > 0.92) p.vy *= -1; });
        const links = [];
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const d = Math.hypot((nodes[i].x - nodes[j].x) * w, (nodes[i].y - nodes[j].y) * h); if (d < Math.min(w, h) * 0.3) { links.push([i, j]); g.strokeStyle = `rgba(${C.s},${0.22 * (1 - d / (Math.min(w, h) * 0.3))})`; g.lineWidth = 1; g.beginPath(); g.moveTo(nodes[i].x * w, nodes[i].y * h); g.lineTo(nodes[j].x * w, nodes[j].y * h); g.stroke(); } }
        if (links.length && Math.random() < 0.14 && pk.length < 14) pk.push({ l: links[(Math.random() * links.length) | 0], u: 0, o: Math.random() < 0.15 });
        for (let k = pk.length - 1; k >= 0; k--) { const q = pk[k]; q.u += dt * 0.7; if (q.u >= 1) { pk.splice(k, 1); continue; } const a = nodes[q.l[0]], b = nodes[q.l[1]]; dot(g, (a.x + (b.x - a.x) * q.u) * w, (a.y + (b.y - a.y) * q.u) * h, 2.6, q.o ? "o" : "w", 0.95); }
        nodes.forEach((p, i) => dot(g, p.x * w, p.y * h, i % 6 ? 2 : 3.2, i % 6 ? "s" : "c", 0.9));
      };
    },
    /* Security Learning Journey — a path that keeps extending; the fog of points clears around its head */
    path(cv, g) {
      const fog = Array.from({ length: 420 }, () => ({ x: Math.random(), y: Math.random(), j: Math.random() }));
      const pathAt = (u, w, h) => [w * (0.08 + u * 0.84), h * (0.5 + Math.sin(u * 7) * 0.2 * (0.3 + u) - u * 0.12)];
      return (t, w, h) => {
        const u = (t * 0.07) % 1.15, head = Math.min(1, u);
        const hp = pathAt(head, w, h);
        fog.forEach((p) => { const d = Math.hypot(p.x * w - hp[0], p.y * h - hp[1]), px = p.x * w, py = p.y * h + Math.sin(t + p.j * 9) * 3, vis = Math.max(0.12, 1 - d / (Math.min(w, h) * 0.6)); dot(g, px, py, 1.1 + p.j, p.j > 0.92 ? "c" : "s", 0.55 * vis); });
        for (let i = 0; i <= 120; i++) { const v = (i / 120) * head, p = pathAt(v, w, h); dot(g, p[0], p[1], 1.6, "w", 0.5 + 0.5 * (i / 120)); }
        [0.25, 0.5, 0.75].forEach((m, k) => { if (head >= m) { const p = pathAt(m, w, h); dot(g, p[0], p[1], 4.5, k === 2 ? "o" : "c", 0.9); } });
        dot(g, hp[0], hp[1], 5, "w", 1);
      };
    },
  };
  function dot(g, x, y, r, c, a) { g.fillStyle = `rgba(${C[c]},${a})`; g.fillRect(x - r / 2, y - r / 2, r, r); }

  SD.projects = function () {
    document.querySelectorAll("canvas[data-vis]").forEach((cv) => {
      const g = cv.getContext("2d"), draw = visuals[cv.dataset.vis](cv, g); let on = false, raf = 0, dpr = 1, w = 0, h = 0;
      const size = () => { dpr = Math.min(devicePixelRatio || 1, 1.5); const r = cv.getBoundingClientRect(); w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; };
      const frame = (ms) => { raf = 0; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); draw(reduce ? 4 : ms / 1000, w, h, cv.getBoundingClientRect()); if (on && !reduce && !document.hidden) raf = requestAnimationFrame(frame); };
      const go = () => { if (!raf && on) raf = requestAnimationFrame(frame); };
      size(); addEventListener("resize", () => { size(); go(); });
      new IntersectionObserver((es) => { on = es[0].isIntersecting; if (on) { size(); go(); } }, { threshold: 0.05 }).observe(cv);
      document.addEventListener("visibilitychange", go);
    });
  };
})();
