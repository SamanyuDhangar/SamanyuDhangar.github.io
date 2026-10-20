/* PROJECT : ECLIPSE — AURORA LATTICE
   ------------------------------------------------------------------
   A background that mixes several worlds into one living scene:

   • Flow field     ~500 particles ride an invisible, slowly evolving magnetic
                    field and leave fading ribbons — the aurora's "wind".
   • Packet network a drifting mesh of nodes links up when close; data packets
                    hop from node to node. Now and then a rose "threat" packet
                    sneaks in and is blocked with a shield pulse.
   • Glyph rain     hex characters fall along both screen edges.
   • Star field     quietly twinkling points.
   • Cursor         acts as a magnet: it bends the ribbons into a swirl, pulls
                    nearby nodes into a tight mesh and links to them.
   • Click / tap    sends a shockwave through the network.

   SCROLL: this file never reads the scroll position and never listens to scroll
   events. The scene is identical wherever the page is scrolled.

   PERFORMANCE: one rAF loop (capped near 60fps), no shadowBlur, no per-frame
   allocations, batched strokes, sprites instead of gradients, an adaptive
   quality ladder, and it pauses while the tab is hidden. It also stays idle
   until the loader's doors open so the loader itself runs smoothly.
   ------------------------------------------------------------------ */
(() => {
  "use strict";

  const host = document.getElementById("cosmos");
  if (!host) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = innerWidth < 768;
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* ------------------------------ palette ------------------------------ */
  const GREEN = [109, 255, 179], CYAN = [123, 199, 255], VIOLET = [165, 139, 255], ROSE = [255, 122, 184];
  const COLS = [GREEN, CYAN, VIOLET];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function glowSprite(c, size = 32) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const g = cv.getContext("2d");
    const r = size / 2;
    const grad = g.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, `rgba(${(c[0] * 0.5 + 128) | 0},${(c[1] * 0.5 + 128) | 0},${(c[2] * 0.5 + 128) | 0},1)`);
    grad.addColorStop(0.18, rgba(c, 0.75));
    grad.addColorStop(0.5, rgba(c, 0.16));
    grad.addColorStop(1, rgba(c, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return cv;
  }
  const SPR = [glowSprite(GREEN), glowSprite(CYAN), glowSprite(VIOLET), glowSprite(ROSE)];

  // glyph atlas (hex rain)
  const GLYPHS = "01ABCDEF<>/{}#$%";
  const GW = 14, GH = 18;
  const atlas = document.createElement("canvas");
  atlas.width = GW * GLYPHS.length;
  atlas.height = GH;
  {
    const g = atlas.getContext("2d");
    g.font = '12px "JetBrains Mono", ui-monospace, Menlo, monospace';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = rgba(GREEN, 1);
    for (let i = 0; i < GLYPHS.length; i++) g.fillText(GLYPHS[i], i * GW + GW / 2, GH / 2 + 1);
  }

  /* ------------------------------ canvases ----------------------------- */
  const mk = (cls) => {
    const c = document.createElement("canvas");
    c.className = cls;
    c.setAttribute("aria-hidden", "true");
    host.appendChild(c);
    return c;
  };
  const flowCv = mk("cosmos-flow");
  const netCv = mk("cosmos-net");
  const fx = flowCv.getContext("2d");
  const nx = netCv.getContext("2d");

  let w = 0, h = 0, S = 1000;
  let dprF = 1, dprN = 1;
  const mouse = { x: -9999, y: -9999, active: false };

  /* quality ladder: 0 best … 3 lightest */
  let level = 0;
  const LV_FLOW = [1, 0.72, 0.48, 0.3];
  const LV_DPR = [1.5, 1.25, 1, 0.85];

  /* =============================== FLOW =============================== */
  const H = 16;                               // history points per ribbon
  const N_MAX = small ? 190 : 520;
  let nFlow = N_MAX;
  const PX = new Float32Array(N_MAX), PY = new Float32Array(N_MAX);
  const PSP = new Float32Array(N_MAX), PLIFE = new Float32Array(N_MAX), PAGE = new Float32Array(N_MAX);
  const HX = new Float32Array(N_MAX * H), HY = new Float32Array(N_MAX * H);
  let hp = 0, sampleAcc = 0;
  const SAMPLE = 0.042;                       // seconds between stored trail points

  function respawn(i, initial) {
    const x = rand(0, w), y = rand(0, h);
    PX[i] = x; PY[i] = y;
    PSP[i] = rand(55, 125) * (small ? 0.8 : 1);
    PLIFE[i] = rand(4, 11);
    PAGE[i] = initial ? rand(0, PLIFE[i]) : 0;
    const b = i * H;
    for (let k = 0; k < H; k++) { HX[b + k] = x; HY[b + k] = y; }
  }

  // smooth, slowly evolving angle field
  function field(x, y, t) {
    const u = x / S, v = y / S;
    return Math.sin(u * 2.7 + t * 0.10) * 1.35
         + Math.cos(v * 3.3 - t * 0.08) * 1.35
         + Math.sin((u + v) * 2.1 + t * 0.06) * 0.9
         + Math.sin(u * 1.3 + Math.cos(v * 2.0 + t * 0.05) * 1.5) * 0.8
         - 0.35;
  }

  function stepFlow(dt, t) {
    const act = mouse.active, mx = mouse.x, my = mouse.y;
    const R = Math.min(250, S * 0.2), R2 = R * R;
    for (let i = 0; i < nFlow; i++) {
      const x = PX[i], y = PY[i];
      const a = field(x, y, t);
      let vx = Math.cos(a), vy = Math.sin(a);
      if (act) {
        const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          const k = 1 - d / R;
          const m = Math.min(1, k * k * 1.7);
          const tx = -dy / d, ty = dx / d;                 // swirl around the cursor
          vx = vx * (1 - m) + (tx - (dx / d) * 0.3) * m;
          vy = vy * (1 - m) + (ty - (dy / d) * 0.3) * m;
        }
      }
      const nxp = x + vx * PSP[i] * dt, nyp = y + vy * PSP[i] * dt;
      PX[i] = nxp; PY[i] = nyp;
      PAGE[i] += dt;
      if (PAGE[i] > PLIFE[i] || nxp < -30 || nxp > w + 30 || nyp < -30 || nyp > h + 30) respawn(i, false);
    }
    sampleAcc += dt;
    if (sampleAcc >= SAMPLE) {
      sampleAcc = 0;
      hp = (hp + 1) % H;
      for (let i = 0; i < nFlow; i++) { HX[i * H + hp] = PX[i]; HY[i * H + hp] = PY[i]; }
    }
  }

  // 3 colours × 3 age tiers (bright head → faint tail)
  const TIERS = [[0, 5, 0.55], [5, 10, 0.28], [10, 15, 0.12]];
  const FLOW_STYLE = COLS.map((c, ci) => TIERS.map((tr) => rgba(c, tr[2] * (ci === 2 ? 0.85 : 1))));

  function drawFlow() {
    fx.setTransform(dprF, 0, 0, dprF, 0, 0);
    fx.clearRect(0, 0, w, h);
    fx.globalCompositeOperation = "lighter";
    fx.lineCap = "round";
    fx.lineWidth = 1.15;
    for (let c = 0; c < 3; c++) {
      for (let ti = 0; ti < 3; ti++) {
        const k0 = TIERS[ti][0], k1 = TIERS[ti][1];
        fx.beginPath();
        for (let i = c; i < nFlow; i += 3) {
          const b = i * H;
          if (k0 === 0) fx.moveTo(PX[i], PY[i]);
          else { const j = b + ((hp - (k0 - 1) + H * 2) % H); fx.moveTo(HX[j], HY[j]); }
          for (let k = k0; k <= k1; k++) {
            const j = b + ((hp - k + H * 2) % H);
            fx.lineTo(HX[j], HY[j]);
          }
        }
        fx.strokeStyle = FLOW_STYLE[c][ti];
        fx.stroke();
      }
    }
    fx.globalCompositeOperation = "source-over";
  }

  /* ============================== NETWORK ============================= */
  const N_NODES = small ? 30 : 68;
  const nodes = [];
  let D = 150, D2 = D * D;
  const segCap = (N_NODES * (N_NODES - 1)) / 2 * 4;
  const SEG = [0, 1, 2, 3].map(() => new Float32Array(segCap));
  const segN = [0, 0, 0, 0];
  const LINK_STYLE = [0.05, 0.1, 0.16, 0.24].map((a) => rgba([150, 232, 224], a));

  function initNodes() {
    nodes.length = 0;
    for (let i = 0; i < N_NODES; i++) {
      nodes.push({
        x: rand(0, w), y: rand(0, h), vx: rand(-12, 12), vy: rand(-12, 12),
        r: rand(1.6, 3.2), c: (Math.random() * 3) | 0, ph: rand(0, TAU)
      });
    }
  }

  function stepNet(dt) {
    const act = mouse.active, mx = mouse.x, my = mouse.y;
    const R = Math.min(300, S * 0.26);
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.vx += (Math.random() - 0.5) * 16 * dt;
      n.vy += (Math.random() - 0.5) * 16 * dt;
      if (act) {
        const dx = mx - n.x, dy = my - n.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R && d2 > 400) {
          const d = Math.sqrt(d2), k = 1 - d / R;
          n.vx += (dx / d) * 70 * k * dt;
          n.vy += (dy / d) * 70 * k * dt;
        }
      }
      const damp = 1 - 0.45 * dt;
      n.vx *= damp; n.vy *= damp;
      const sp = Math.hypot(n.vx, n.vy);
      if (sp > 38) { n.vx *= 38 / sp; n.vy *= 38 / sp; }
      n.x += n.vx * dt; n.y += n.vy * dt;
      if (n.x < -30) n.x = w + 30; else if (n.x > w + 30) n.x = -30;
      if (n.y < -30) n.y = h + 30; else if (n.y > h + 30) n.y = -30;
    }
    // ripples push nodes outward as the ring passes
    for (let r = 0; r < ripples.length; r++) {
      const rp = ripples[r];
      rp.t += dt / 1.15;
      const rad = rp.t * 300;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const dx = n.x - rp.x, dy = n.y - rp.y, d = Math.hypot(dx, dy) || 1;
        if (Math.abs(d - rad) < 22) { n.vx += (dx / d) * 130 * dt; n.vy += (dy / d) * 130 * dt; }
      }
    }
    for (let r = ripples.length - 1; r >= 0; r--) if (ripples[r].t >= 1) ripples.splice(r, 1);
  }

  /* packets */
  const packets = [];
  const pulses = [];
  const ripples = [];
  let spawnAcc = 0;
  const PKT_CAP = small ? 8 : 18;

  function neighbours(i, exclude) {
    const a = nodes[i], out = [];
    for (let j = 0; j < nodes.length; j++) {
      if (j === i || j === exclude) continue;
      const dx = nodes[j].x - a.x, dy = nodes[j].y - a.y;
      if (dx * dx + dy * dy < D2) out.push(j);
    }
    return out;
  }

  function spawnPacket() {
    const a = (Math.random() * nodes.length) | 0;
    const nb = neighbours(a, -1);
    if (!nb.length) return;
    packets.push({
      a, b: nb[(Math.random() * nb.length) | 0], from: a, t: 0,
      sp: rand(110, 210), hops: 0, c: Math.random() < 0.16 ? 3 : (Math.random() * 3) | 0
    });
  }

  function stepPackets(dt) {
    spawnAcc += dt;
    if (spawnAcc > 0.32) { spawnAcc = 0; if (packets.length < PKT_CAP) spawnPacket(); }
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      const A = nodes[p.a], B = nodes[p.b];
      const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
      if (len > D * 1.3) { packets.splice(i, 1); continue; }
      p.t += (p.sp * dt) / len;
      if (p.t < 1) continue;
      // arrived at B
      if (p.c === 3 && p.hops >= 1) {                    // threat gets blocked
        pulses.push({ x: B.x, y: B.y, t: 0 });
        packets.splice(i, 1);
        continue;
      }
      const nb = p.hops >= 5 ? [] : neighbours(p.b, p.a);
      if (!nb.length) { packets.splice(i, 1); continue; }
      p.from = p.a; p.a = p.b; p.b = nb[(Math.random() * nb.length) | 0]; p.t = 0; p.hops++;
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      pulses[i].t += dt / 0.7;
      if (pulses[i].t >= 1) pulses.splice(i, 1);
    }
  }

  /* ============================== STARS / RAIN ======================== */
  let stars = [];
  function buildStars() {
    const n = clamp(Math.floor((w * h) / (small ? 9000 : 7000)), 60, 260);
    stars = [];
    for (let i = 0; i < n; i++) {
      const m = Math.random();
      stars.push({ x: rand(0, w), y: rand(0, h), s: m > 0.93 ? 2 : 1, a: 0.2 + 0.6 * m * m, ph: rand(0, TAU), tw: rand(0.5, 2.2), c: Math.random() < 0.2 ? 1 : 0 });
    }
  }

  let cols = [];
  function buildRain() {
    cols = [];
    if (small) return;
    const zone = Math.max(60, w * 0.07), count = 14;
    for (let i = 0; i < count; i++) {
      const left = i % 2 === 0;
      cols.push({
        x: left ? rand(8, zone) : rand(w - zone, w - 20),
        y: rand(-h, h), sp: rand(55, 130), len: (7 + Math.random() * 7) | 0, seed: (Math.random() * 97) | 0
      });
    }
  }
  function stepRain(dt) {
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      c.y += c.sp * dt;
      if (c.y - c.len * GH > h) { c.y = -rand(0, h * 0.5); c.sp = rand(55, 130); c.len = (7 + Math.random() * 7) | 0; }
    }
  }

  /* ============================== RENDER NET ========================== */
  function drawNet(t) {
    nx.setTransform(dprN, 0, 0, dprN, 0, 0);
    nx.clearRect(0, 0, w, h);

    // stars
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      nx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(t * s.tw + s.ph));
      nx.fillStyle = s.c ? "#bcd8ff" : "#ffffff";
      nx.fillRect(s.x, s.y, s.s, s.s);
    }

    // glyph rain
    if (level < 2) {
      for (let i = 0; i < cols.length; i++) {
        const c = cols[i];
        for (let k = 0; k < c.len; k++) {
          const gy = c.y - k * GH;
          if (gy < -GH || gy > h) continue;
          nx.globalAlpha = (k === 0 ? 0.7 : 0.42 * (1 - k / c.len));
          const gi = (c.seed + k * 7 + ((t * 2.2 + k) | 0)) % GLYPHS.length;
          nx.drawImage(atlas, gi * GW, 0, GW, GH, c.x, gy, GW, GH);
        }
      }
    }

    // links (bucketed by strength → 4 strokes total)
    segN[0] = segN[1] = segN[2] = segN[3] = 0;
    const L = nodes.length;
    for (let i = 0; i < L; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < L; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 >= D2) continue;
        const q = Math.min(3, ((1 - Math.sqrt(d2) / D) * 4) | 0);
        const arr = SEG[q], n = segN[q];
        arr[n] = a.x; arr[n + 1] = a.y; arr[n + 2] = b.x; arr[n + 3] = b.y;
        segN[q] = n + 4;
      }
    }
    nx.globalAlpha = 1;
    nx.lineWidth = 1;
    for (let q = 0; q < 4; q++) {
      if (!segN[q]) continue;
      nx.beginPath();
      const arr = SEG[q];
      for (let k = 0; k < segN[q]; k += 4) { nx.moveTo(arr[k], arr[k + 1]); nx.lineTo(arr[k + 2], arr[k + 3]); }
      nx.strokeStyle = LINK_STYLE[q];
      nx.stroke();
    }

    // cursor links
    if (mouse.active) {
      const R = D * 1.15;
      nx.beginPath();
      for (let i = 0; i < L; i++) {
        const n = nodes[i], dx = n.x - mouse.x, dy = n.y - mouse.y;
        if (dx * dx + dy * dy < R * R) { nx.moveTo(mouse.x, mouse.y); nx.lineTo(n.x, n.y); }
      }
      nx.strokeStyle = rgba(CYAN, 0.28);
      nx.stroke();
    }

    // nodes
    nx.globalCompositeOperation = "lighter";
    for (let i = 0; i < L; i++) {
      const n = nodes[i];
      const tw = 0.7 + 0.3 * Math.sin(t * 1.3 + n.ph);
      const s = n.r * 7 * (0.9 + 0.1 * tw);
      nx.globalAlpha = 0.85 * tw;
      nx.drawImage(SPR[n.c], n.x - s / 2, n.y - s / 2, s, s);
    }

    // packets
    for (let i = 0; i < packets.length; i++) {
      const p = packets[i], A = nodes[p.a], B = nodes[p.b];
      const x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t;
      const t0 = Math.max(0, p.t - 0.14);
      const tx = A.x + (B.x - A.x) * t0, ty = A.y + (B.y - A.y) * t0;
      nx.globalAlpha = 0.55;
      nx.lineWidth = 1.6;
      nx.strokeStyle = p.c === 3 ? rgba(ROSE, 0.9) : rgba(COLS[p.c], 0.9);
      nx.beginPath(); nx.moveTo(tx, ty); nx.lineTo(x, y); nx.stroke();
      nx.globalAlpha = 1;
      nx.drawImage(SPR[p.c], x - 9, y - 9, 18, 18);
    }
    nx.globalCompositeOperation = "source-over";

    // shield pulses (blocked threats)
    nx.lineWidth = 1.4;
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      nx.globalAlpha = (1 - p.t) * 0.85;
      nx.strokeStyle = rgba(ROSE, 1);
      nx.beginPath(); nx.arc(p.x, p.y, 4 + p.t * 34, 0, TAU); nx.stroke();
    }

    // click shockwaves
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      const k = 1 - r.t;
      nx.globalAlpha = k * k * 0.55;
      nx.lineWidth = 1.5;
      nx.strokeStyle = rgba(CYAN, 1);
      nx.beginPath(); nx.arc(r.x, r.y, r.t * 300, 0, TAU); nx.stroke();
      nx.globalAlpha = k * k * 0.22;
      nx.strokeStyle = rgba(GREEN, 1);
      nx.beginPath(); nx.arc(r.x, r.y, r.t * 300 * 0.72, 0, TAU); nx.stroke();
    }
    nx.globalAlpha = 1;
  }

  /* ============================== SIZING ============================== */
  function applyDpr() {
    const real = window.devicePixelRatio || 1;
    dprF = Math.min(1, real) * (level >= 3 ? 0.85 : 1);
    dprN = Math.min(real, LV_DPR[level]);
    flowCv.width = Math.round(w * dprF); flowCv.height = Math.round(h * dprF);
    netCv.width = Math.round(w * dprN);  netCv.height = Math.round(h * dprN);
  }

  function applyLevel() {
    nFlow = Math.max(40, Math.round(N_MAX * LV_FLOW[level]));
    applyDpr();
  }

  function resize() {
    const ow = w, oh = h;
    w = innerWidth; h = innerHeight;
    S = Math.max(w, h) / 1.15;
    D = clamp(Math.min(w, h) * 0.2, 105, 185); D2 = D * D;
    applyDpr();
    if (!nodes.length) initNodes();
    else if (ow && oh) nodes.forEach((n) => { n.x *= w / ow; n.y *= h / oh; });
    for (let i = 0; i < N_MAX; i++) respawn(i, true);
    buildStars();
    buildRain();
  }

  /* ============================== LOOP ================================ */
  let raf = 0, lastDraw = 0, T = 0, emaDt = 16.7, cool = 0, running = false;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const gap = now - lastDraw;
    if (gap < 14.5) return;                        // cap near 60fps on 90/120/144Hz screens
    lastDraw = now;
    const dt = Math.min(gap / 1000, 0.05);
    T += dt;
    stepFlow(dt, T);
    stepNet(dt);
    stepPackets(dt);
    stepRain(dt);
    drawFlow();
    drawNet(T);

    // adaptive quality: step down when frames run long, back up when there is plenty of room
    emaDt += (gap - emaDt) * 0.06;
    if (now < cool) return;
    if (emaDt > 25 && level < 3) { level++; applyLevel(); cool = now + 1800; }
    else if (emaDt < 17.6 && level > 0) { level--; applyLevel(); cool = now + 6000; }
  }

  const start = () => { if (running && !raf && !reduce) { lastDraw = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  function staticFrame() {
    // settle the ribbons for a moment, then draw a single still image
    for (let i = 0; i < 90; i++) { stepFlow(0.05, T); stepNet(0.05); T += 0.05; sampleAcc = SAMPLE; }
    for (let i = 0; i < 6; i++) spawnPacket();
    drawFlow();
    drawNet(T);
  }

  /* ============================== EVENTS ============================== */
  let resizeTimer = 0;
  addEventListener("resize", () => {
    if (innerWidth === w && Math.abs(innerHeight - h) < 160) return;   // mobile URL-bar show/hide
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reduce && running) staticFrame(); }, 150);
  });
  addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { mouse.active = false; });
  addEventListener("pointerdown", (e) => {
    if (!running || reduce) return;
    if (ripples.length < 4) ripples.push({ x: e.clientX, y: e.clientY, t: 0 });
  }, { passive: true });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  /* ============================== BOOT ================================ */
  resize();                                        // sized and ready, but idle until the doors open
  let began = false;
  function begin() {
    if (began) return;
    began = true;
    running = true;
    host.classList.add("live");
    if (reduce) staticFrame(); else start();
  }
  addEventListener("eclipse:ready", begin);
  setTimeout(begin, 6000);                          // fallback if the loader never fires its event
})();
