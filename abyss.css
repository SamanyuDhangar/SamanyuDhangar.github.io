/* PROJECT : ECLIPSE — ABYSS background engine
   ------------------------------------------------------------------
   • Dark matter   a low-resolution domain-warped noise field, drawn as deep ink with
                   thin glowing contour veins. Scaled up by the browser, so it stays soft.
   • Hex lattice   a faint hexagon grid drawn once; random cells power up and fade.
   • Stars         slowly drifting, twinkling, with depth.
   • Data streaks  an occasional packet streaks across the sky.
   • Sparkles      little four-point stars that twinkle in and out.
   • Bubbles       soft pastel bubbles that float slowly upward.
   (The pearl planet and the orrery are CSS/SVG layers in abyss.css.)

   NO cursor listener, NO scroll listener. The scene is identical wherever the pointer
   is and wherever the page is scrolled.
   Performance: one rAF loop, ink updates at ~20fps, adaptive quality ladder, pauses
   when the tab is hidden, stays idle until the loader's doors open.
   ------------------------------------------------------------------ */
(() => {
  "use strict";

  const host = document.getElementById("abyss");
  if (!host) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = innerWidth < 768;
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ------------------------------ palette ------------------------------ */
  let PA = [109, 255, 179], PB = [123, 199, 255], PC = [165, 139, 255];
  const parse = (s) => s.split(",").map((n) => parseInt(n, 10));
  function readPalette() {
    const cs = getComputedStyle(document.documentElement);
    const a = cs.getPropertyValue("--ab-a"), b = cs.getPropertyValue("--ab-b"), c = cs.getPropertyValue("--ab-c");
    if (a.includes(",")) PA = parse(a);
    if (b.includes(",")) PB = parse(b);
    if (c.includes(",")) PC = parse(c);
  }
  readPalette();
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ------------------------------ canvases ----------------------------- */
  const mk = (cls) => {
    const c = document.createElement("canvas");
    c.className = cls;
    c.setAttribute("aria-hidden", "true");
    return c;
  };
  const inkCv = mk("abyss-ink"), hexCv = mk("abyss-hex"), fxCv = mk("abyss-fx");
  host.prepend(fxCv); host.prepend(hexCv); host.prepend(inkCv);       // order: ink, hex, fx, then CSS layers
  const ix = inkCv.getContext("2d");
  const hx = hexCv.getContext("2d");
  const fx = fxCv.getContext("2d");

  let w = 0, h = 0, dpr = 1;

  /* quality ladder: 0 best … 2 lightest */
  let level = 0;
  const LV_INK = small ? [120, 96, 72] : [200, 150, 104];
  const LV_DPR = [1.5, 1.15, 1];
  const LV_STAR = [1, 0.7, 0.45];
  const INK_MS = [48, 56, 70];

  /* =============================== INK ================================ */
  const TBL = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) TBL[i] = Math.random();

  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    let xf = x - xi, yf = y - yi;
    xf = xf * xf * (3 - 2 * xf);
    yf = yf * yf * (3 - 2 * yf);
    const x0 = xi & 255, y0 = yi & 255, x1 = (xi + 1) & 255, y1 = (yi + 1) & 255;
    const a = TBL[(y0 << 8) | x0], b = TBL[(y0 << 8) | x1], c = TBL[(y1 << 8) | x0], d = TBL[(y1 << 8) | x1];
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }
  const fbm = (x, y) =>
    (vnoise(x, y) * 0.5 + vnoise(x * 2.03 + 7.1, y * 2.03 + 3.7) * 0.25 + vnoise(x * 4.1 + 1.3, y * 4.1 + 9.2) * 0.125) / 0.875;

  let iw = 0, ih = 0, img = null, px = null;
  function sizeInk() {
    iw = LV_INK[level];
    ih = Math.max(40, Math.round((iw * h) / w));
    inkCv.width = iw;
    inkCv.height = ih;
    img = ix.createImageData(iw, ih);
    px = new Uint32Array(img.data.buffer);
  }

  function drawInk(t) {
    const sc = 3.4 / iw;
    const ax = PA[0], ay = PA[1], az = PA[2];
    const bx = PB[0], by = PB[1], bz = PB[2];
    const cx = PC[0], cy = PC[1], cz = PC[2];
    let o = 0;
    for (let y = 0; y < ih; y++) {
      for (let x = 0; x < iw; x++, o++) {
        const nx = x * sc, ny = y * sc;
        const q = fbm(nx + t * 0.045, ny - t * 0.032);
        const r = fbm(nx + 3.2 * q + 5.2 + t * 0.06, ny + 3.2 * q + 1.7 - t * 0.04);

        // contour veins
        const v = r * 6;
        const f = Math.abs(v - Math.floor(v) - 0.5) * 2;      // 1 on a contour line
        const f2 = f * f, f4 = f2 * f2, f8 = f4 * f4, f16 = f8 * f8;
        const m = smooth(0.40, 0.78, q);
        const line = f16 * f2 * m;                             // thin and bright
        const glow = f8 * m * 0.22;                            // soft halo around it
        const fog = q * q;

        const k = clamp(r * 1.4 - 0.2, 0, 1);                  // 0 → cool blue, 1 → violet
        const tr = bx + (cx - bx) * k, tg = by + (cy - by) * k, tb = bz + (cz - bz) * k;
        const lk = clamp(r * 1.6 - 0.3, 0, 1);                 // line colour: green → blue
        const lr = ax + (bx - ax) * lk, lg = ay + (by - ay) * lk, lb = az + (bz - az) * lk;

        const L = line * 0.85 + glow;
        const R = 3 + fog * (10 + tr * 0.07) + lr * L;
        const G = 5 + fog * (12 + tg * 0.06) + lg * L;
        const B = 12 + fog * (40 + tb * 0.10) + lb * L;
        px[o] = (255 << 24) | ((B > 255 ? 255 : B) << 16) | ((G > 255 ? 255 : G) << 8) | (R > 255 ? 255 : R);
      }
    }
    ix.putImageData(img, 0, 0);
  }

  /* ============================= HEX LATTICE ========================== */
  let HR = 44, hcols = 0, hrows = 0;
  const SQ3 = Math.sqrt(3);
  function hexPath(g, cx, cy, r) {
    for (let i = 0; i < 6; i++) {
      const a = TAU / 6 * i + TAU / 12;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
  }
  const hexCenter = (c, r) => [c * SQ3 * HR + (r & 1 ? (SQ3 * HR) / 2 : 0), r * 1.5 * HR];

  function drawHexStatic() {
    HR = small ? 34 : 44;
    hcols = Math.ceil(w / (SQ3 * HR)) + 2;
    hrows = Math.ceil(h / (1.5 * HR)) + 2;
    hx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hx.clearRect(0, 0, w, h);
    hx.beginPath();
    for (let r = 0; r < hrows; r++) for (let c = 0; c < hcols; c++) { const p = hexCenter(c, r); hexPath(hx, p[0], p[1], HR - 1); }
    hx.strokeStyle = rgba(PB, 0.16);
    hx.lineWidth = 1;
    hx.stroke();
    // fade the lattice: strongest low on the screen, nearly gone at the top
    hx.globalCompositeOperation = "destination-in";
    const g = hx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(0,0,0,.12)");
    g.addColorStop(0.55, "rgba(0,0,0,.5)");
    g.addColorStop(1, "rgba(0,0,0,1)");
    hx.fillStyle = g;
    hx.fillRect(0, 0, w, h);
    hx.globalCompositeOperation = "source-over";
  }

  /* ============================== FX LAYER ============================ */
  let T = 0;
  const stars = [];
  function initStars() {
    stars.length = 0;
    const n = Math.round((small ? 80 : 170) * LV_STAR[level]);
    for (let i = 0; i < n; i++) stars.push({ x: rand(0, w), y: rand(0, h), z: Math.random(), ph: rand(0, TAU), sp: rand(0.6, 2.2) });
  }
  function glowSprite(c, size = 48) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const g = cv.getContext("2d"), r = size / 2;
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, "rgba(255,255,255,.95)");
    gr.addColorStop(0.2, rgba(c, 0.55));
    gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    return cv;
  }
  let spr = glowSprite(PB);
  function bubbleSprite(c, size = 96) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const g = cv.getContext("2d"), r = size / 2;
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba(c, 0.10));
    gr.addColorStop(0.78, rgba(c, 0.22));
    gr.addColorStop(0.94, rgba(c, 0.6));
    gr.addColorStop(1, rgba(c, 0));
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    return cv;
  }
  let bub = [bubbleSprite(PA), bubbleSprite(PB), bubbleSprite(PC)];

  const bubbles = [];
  function initBubbles() {
    bubbles.length = 0;
    const n = small ? 7 : 13;
    for (let i = 0; i < n; i++) bubbles.push({ x: rand(0, w), y: rand(0, h), r: rand(12, 52), v: rand(5, 13), ph: rand(0, TAU), k: (Math.random() * 3) | 0, a: rand(0.35, 0.8) });
  }

  const sparks = [];                                  // twinkling four-point stars
  function spawnSpark(first) {
    return { x: rand(0, w), y: rand(0, h * 0.9), s: rand(5, small ? 10 : 15), t: first ? rand(0, 4) : 0, dur: rand(2.4, 5), k: (Math.random() * 3) | 0 };
  }
  function initSparks() { sparks.length = 0; for (let i = 0; i < (small ? 9 : 17); i++) sparks.push(spawnSpark(true)); }
  function starPath(g, x, y, s) {
    g.beginPath();
    g.moveTo(x, y - s);
    g.quadraticCurveTo(x, y, x + s, y);
    g.quadraticCurveTo(x, y, x, y + s);
    g.quadraticCurveTo(x, y, x - s, y);
    g.quadraticCurveTo(x, y, x, y - s);
    g.closePath();
  }

  const cells = [];       // powered hexes
  let cellTimer = 0;
  function spawnCell() {
    const c = (Math.random() * (hcols - 2)) | 0, r = (Math.random() * (hrows - 2)) | 0;
    const p = hexCenter(c, r);
    const bias = Math.random();                        // lean towards the lower half
    cells.push({ x: p[0], y: bias < 0.6 ? Math.max(p[1], h * 0.45) : p[1], t: 0, dur: rand(2.6, 5.2), col: Math.random() < 0.5 ? PA : Math.random() < 0.5 ? PB : PC });
    const last = cells[cells.length - 1];
    last.y = Math.round(last.y / (1.5 * HR)) * 1.5 * HR;
    const row = Math.round(last.y / (1.5 * HR));
    last.x = Math.round(last.x / (SQ3 * HR)) * SQ3 * HR + (row & 1 ? (SQ3 * HR) / 2 : 0);
  }

  const streaks = [];
  let streakTimer = 2.5;
  function spawnStreak() {
    const a = rand(0.32, 0.62);                         // radians below horizontal, travelling down-left
    streaks.push({
      x: rand(w * 0.35, w * 1.1), y: rand(-60, h * 0.3),
      dx: -Math.cos(a), dy: Math.sin(a),
      v: rand(750, 1150), len: rand(150, 280), life: 0, max: rand(0.9, 1.5),
      col: Math.random() < 0.6 ? PA : PB
    });
  }

  function stepFx(dt) {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= (3 + 14 * s.z) * dt;
      s.y += (1 + 3.5 * s.z) * dt;
      if (s.x < -4) { s.x = w + 4; s.y = rand(0, h); }
      if (s.y > h + 4) { s.y = -4; s.x = rand(0, w); }
    }
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.y -= b.v * dt; b.x += Math.sin(T * 0.4 + b.ph) * 6 * dt;
      if (b.y < -b.r * 2) { b.y = h + b.r * 2; b.x = rand(0, w); }
    }
    for (let i = 0; i < sparks.length; i++) { const p = sparks[i]; p.t += dt; if (p.t > p.dur) sparks[i] = spawnSpark(false); }
    cellTimer -= dt;
    if (cellTimer <= 0 && cells.length < (small ? 9 : 18)) { spawnCell(); cellTimer = rand(0.25, 0.7); }
    for (let i = cells.length - 1; i >= 0; i--) { cells[i].t += dt; if (cells[i].t > cells[i].dur) cells.splice(i, 1); }
    streakTimer -= dt;
    if (streakTimer <= 0 && streaks.length < 2) { spawnStreak(); streakTimer = rand(3, 7.5); }
    for (let i = streaks.length - 1; i >= 0; i--) {
      const s = streaks[i];
      s.life += dt; s.x += s.dx * s.v * dt; s.y += s.dy * s.v * dt;
      if (s.life > s.max || s.x < -300 || s.y > h + 300) streaks.splice(i, 1);
    }
  }

  function drawFx() {
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.clearRect(0, 0, w, h);

    // soft bubbles
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      fx.globalAlpha = b.a * (0.75 + 0.25 * Math.sin(T * 0.7 + b.ph));
      fx.drawImage(bub[b.k], b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    fx.globalAlpha = 1;

    // powered hex cells
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const k = Math.sin((Math.PI * c.t) / c.dur);
      const e = k * k;
      fx.beginPath(); hexPath(fx, c.x, c.y, HR - 1);
      fx.fillStyle = rgba(c.col, 0.10 * e); fx.fill();
      fx.strokeStyle = rgba(c.col, 0.55 * e); fx.lineWidth = 1; fx.stroke();
    }

    // stars
    fx.fillStyle = "#dbe8ff";
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = (0.22 + 0.6 * s.z) * (0.65 + 0.35 * Math.sin(T * s.sp + s.ph));
      const sz = 0.7 + 1.5 * s.z;
      fx.globalAlpha = a;
      fx.fillRect(s.x, s.y, sz, sz);
      if (s.z > 0.93) { fx.globalAlpha = a * 0.8; fx.drawImage(spr, s.x - 12, s.y - 12, 24, 24); }
    }
    fx.globalAlpha = 1;

    // sparkles
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      const k = Math.sin((Math.PI * p.t) / p.dur);
      const e = k * k * k;
      const c = p.k === 0 ? PA : p.k === 1 ? PB : PC;
      fx.globalAlpha = 0.9 * e;
      fx.fillStyle = `rgb(${Math.min(255, c[0] + 90)},${Math.min(255, c[1] + 90)},${Math.min(255, c[2] + 90)})`;
      starPath(fx, p.x, p.y, p.s * (0.5 + 0.5 * e));
      fx.fill();
      fx.globalAlpha = 0.5 * e;
      fx.drawImage(spr, p.x - p.s * 1.4, p.y - p.s * 1.4, p.s * 2.8, p.s * 2.8);
    }
    fx.globalAlpha = 1;

    // data streaks
    fx.lineCap = "round";
    for (let i = 0; i < streaks.length; i++) {
      const s = streaks[i];
      const f = Math.min(1, s.life / 0.15) * Math.min(1, (s.max - s.life) / 0.35);
      const tx = s.x - s.dx * s.len, ty = s.y - s.dy * s.len;
      const g = fx.createLinearGradient(tx, ty, s.x, s.y);
      g.addColorStop(0, rgba(s.col, 0));
      g.addColorStop(1, rgba(s.col, 0.85 * f));
      fx.strokeStyle = g; fx.lineWidth = 1.6;
      fx.beginPath(); fx.moveTo(tx, ty); fx.lineTo(s.x, s.y); fx.stroke();
      fx.globalAlpha = f; fx.drawImage(spr, s.x - 9, s.y - 9, 18, 18); fx.globalAlpha = 1;
    }
  }

  /* ============================== SIZING ============================== */
  function resize() {
    w = innerWidth; h = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, LV_DPR[level]);
    for (const c of [hexCv, fxCv]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    sizeInk();
    drawHexStatic();
    initStars(); initBubbles(); initSparks();
    cells.length = 0; streaks.length = 0;
  }

  /* ============================== LOOP ================================ */
  let raf = 0, running = false, last = 0, inkAcc = 1e6, emaDt = 16.7, cool = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const gap = now - last;
    if (gap < 14.5) return;                          // cap near 60fps
    last = now;
    const dt = Math.min(gap / 1000, 0.05);
    T += dt;
    inkAcc += gap;
    if (inkAcc >= INK_MS[level]) { inkAcc = 0; drawInk(T); }
    stepFx(dt);
    drawFx();

    emaDt += (gap - emaDt) * 0.06;                   // adaptive quality
    if (now < cool) return;
    if (emaDt > 25 && level < 2) { level++; resize(); cool = now + 2000; }
    else if (emaDt < 17.6 && level > 0) { level--; resize(); cool = now + 8000; }
  }
  const start = () => { if (running && !raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  function staticFrame() {
    T = 40;
    drawInk(T);
    for (let i = 0; i < 40; i++) { stepFx(0.1); }
    for (let i = 0; i < 8; i++) spawnCell();
    drawFx();
  }

  /* ============================== EVENTS ============================== */
  let resizeTimer = 0;
  addEventListener("resize", () => {
    if (innerWidth === w && Math.abs(innerHeight - h) < 160) return;   // mobile URL-bar show/hide
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reduce && running) staticFrame(); }, 150);
  });
  addEventListener("abyss:palette", () => {
    readPalette();
    spr = glowSprite(PB);
    bub = [bubbleSprite(PA), bubbleSprite(PB), bubbleSprite(PC)];
    drawHexStatic();
    if (reduce && running) staticFrame();
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  /* ============================== BOOT ================================ */
  resize();                                          // sized and ready, but idle until the doors open
  let began = false;
  function begin() {
    if (began) return;
    began = true; running = true;
    host.classList.add("live");
    if (reduce) staticFrame(); else start();
  }
  addEventListener("eclipse:ready", begin);
  setTimeout(begin, 6000);                           // fallback if the loader never fires its event
})();
