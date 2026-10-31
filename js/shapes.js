/* shapes.js — procedural point clouds. Each generator returns Float32Array(n*4): x,y,z,tag.
   tag: 0 base · 1 bright silver (glasses, nodes) · 2 white (tilak) · 3 muted saffron */
(function () {
  const SD = (window.SD = window.SD || {});
  const TAU = Math.PI * 2;
  const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => (r() + r() + r() + r() - 2) * 1.732;

  function spread(v) { v &= 1023; v = (v | (v << 16)) & 0x030000ff; v = (v | (v << 8)) & 0x0300f00f; v = (v | (v << 4)) & 0x030c30c3; v = (v | (v << 2)) & 0x09249249; return v; }
  const q = (v) => Math.max(0, Math.min(1023, ((v + 2.8) / 5.6 * 1023) | 0));
  /* Morton-sort so neighbouring indices are spatially close: gives coherent flow between shapes
     and lets index-based "connections" land on genuinely nearby particles. */
  function coherent(a, n) {
    const idx = new Uint32Array(n), key = new Uint32Array(n);
    for (let i = 0; i < n; i++) { idx[i] = i; key[i] = spread(q(a[i * 4])) | (spread(q(a[i * 4 + 1])) << 1) | (spread(q(a[i * 4 + 2])) << 2); }
    const order = Array.from(idx).sort((x, y) => key[x] - key[y]);
    const o = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { const s = order[i] * 4; o.set([a[s], a[s + 1], a[s + 2], a[s + 3]], i * 4); }
    return o;
  }
  function writer(n) {
    const a = new Float32Array(n * 4); let k = 0;
    return { a, P(x, y, z, t) { if (k < n) { a[k * 4] = x; a[k * 4 + 1] = y; a[k * 4 + 2] = z; a[k * 4 + 3] = t || 0; k++; } }, get k() { return k; } };
  }
  function tilt(x, y, z, ax, az) {
    let c = Math.cos(ax), s = Math.sin(ax); let y1 = y * c - z * s, z1 = y * s + z * c;
    c = Math.cos(az); s = Math.sin(az); return [x * c - y1 * s, x * s + y1 * c, z1];
  }
  function fill(w, n, r) { while (w.k < n) w.P(gauss(r) * 1.4, gauss(r) * 1.0, gauss(r) * 0.8, 0); }

  /* Rasterise a 2D drawing, then sample particles from it. Colour channels carry tags:
     pure red → tag 1, pure blue → tag 2, pure yellow → tag 3, grey luminance → density. */
  function sampleCanvas(draw, n, W, H, map, quotas) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H); draw(g);
    const d = g.getImageData(0, 0, W, H).data, base = [], t1 = [], t2 = [], t3 = [];
    for (let i = 0; i < W * H; i++) {
      const r = d[i * 4], gr = d[i * 4 + 1], b = d[i * 4 + 2];
      if (r + gr + b < 45) continue;
      if (r > 170 && gr < 90 && b < 90) t1.push(i); else if (b > 170 && r < 90 && gr < 90) t2.push(i);
      else if (r > 170 && gr > 120 && b < 80) t3.push(i); else base.push(i);
    }
    const rnd = rng(7), w = writer(n);
    const take = (list, count, tag) => { if (!list.length) return; for (let k = 0; k < count; k++) w.P(...map(list[(rnd() * list.length) | 0], rnd), tag); };
    const [q1 = 0, q2 = 0, q3 = 0] = quotas || [];
    take(t1, Math.round(n * q1), 1); take(t2, Math.round(n * q2), 2); take(t3, Math.round(n * q3), 3);
    let guard = 0;
    while (w.k < n && base.length && guard++ < n * 40) { const i = base[(rnd() * base.length) | 0]; if (rnd() < (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 765) w.P(...map(i, rnd), 0); }
    fill(w, n, rnd);
    return w.a;
  }

  const S = (SD.shapes = {
    dust(n) { const r = rng(1), w = writer(n); for (let i = 0; i < n; i++) w.P((r() * 2 - 1) * 2.6, (r() * 2 - 1) * 1.7, (r() * 2 - 1) * 1.6, 0); return w.a; },

    rings(n) {
      const r = rng(2), w = writer(n), R = [0.5, 0.82, 1.14, 1.46], T = [[.0, .0], [1.1, .3], [.55, -.6], [1.35, .9]];
      const ticks = Math.floor(n * 0.08);
      for (let i = 0; i < n - ticks; i++) { const k = i % 4, a = r() * TAU, rad = R[k] + gauss(r) * 0.008, p = tilt(Math.cos(a) * rad, Math.sin(a) * rad, gauss(r) * .006, T[k][0], T[k][1]); w.P(p[0], p[1], p[2], r() < .03 ? 1 : 0); }
      for (let i = 0; i < ticks; i++) { const a = Math.floor(r() * 36) / 36 * TAU, rad = R[3] + 0.04 + r() * 0.1, p = tilt(Math.cos(a) * rad, Math.sin(a) * rad, 0, T[3][0], T[3][1]); w.P(p[0], p[1], p[2], 0); }
      return coherent(w.a, n);
    },

    sphere(n) {
      const r = rng(3), w = writer(n), nr = Math.floor(n * 0.14), ns = n - nr;
      for (let i = 0; i < ns; i++) {
        const y = 1 - 2 * (i + 0.5) / ns, rad = Math.sqrt(1 - y * y), th = i * 2.399963, o = 0.93 * (1 + 0.12 * Math.sin(3 * th + y * 4) + 0.07 * Math.cos(5 * y + th * 2));
        w.P(Math.cos(th) * rad * o, y * o, Math.sin(th) * rad * o, r() < .01 ? 1 : 0);
      }
      for (let i = 0; i < nr; i++) { const a = r() * TAU, rad = 1.36 + (i % 2) * 0.26, p = tilt(Math.cos(a) * rad, 0, Math.sin(a) * rad, i % 2 ? -.5 : .45, i % 2 ? .35 : -.25); w.P(p[0], p[1], p[2], 0); }
      return coherent(w.a, n);
    },

    network(n) {
      const r = rng(4), w = writer(n), nodes = []; let g = 0;
      while (nodes.length < 44 && g++ < 5000) {
        const p = [(r() * 2 - 1) * 1.55, (r() * 2 - 1) * 0.95, (r() * 2 - 1) * 0.8];
        if (p[0] * p[0] / 2.4 + p[1] * p[1] / 0.9 + p[2] * p[2] / 0.64 > 1) continue;
        if (nodes.every((o) => Math.hypot(o[0] - p[0], o[1] - p[1], o[2] - p[2]) > 0.44)) nodes.push(p);
      }
      const edges = [], seen = new Set();
      nodes.forEach((a, i) => {
        nodes.map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])]).filter((e) => e[0] !== i).sort((x, y) => x[1] - y[1]).slice(0, 3).forEach(([j]) => { const key = i < j ? i + "-" + j : j + "-" + i; if (!seen.has(key)) { seen.add(key); edges.push([i, j]); } });
      });
      const nn = Math.floor(n * 0.24);
      for (let i = 0; i < nn; i++) { const p = nodes[i % nodes.length]; w.P(p[0] + gauss(r) * 0.035, p[1] + gauss(r) * 0.035, p[2] + gauss(r) * 0.035, i % 5 === 0 ? 1 : 0); }
      while (w.k < n) { const e = edges[(r() * edges.length) | 0], a = nodes[e[0]], b = nodes[e[1]], t = r(); w.P(a[0] + (b[0] - a[0]) * t + gauss(r) * 0.008, a[1] + (b[1] - a[1]) * t + gauss(r) * 0.008, a[2] + (b[2] - a[2]) * t + gauss(r) * 0.008, r() < 0.015 ? 3 : 0); }
      return coherent(w.a, n);
    },

    geo(n) {
      const r = rng(5), w = writer(n), ph = (1 + Math.sqrt(5)) / 2, V = [];
      [[0, 1, ph], [0, -1, ph], [0, 1, -ph], [0, -1, -ph], [1, ph, 0], [-1, ph, 0], [1, -ph, 0], [-1, -ph, 0], [ph, 0, 1], [-ph, 0, 1], [ph, 0, -1], [-ph, 0, -1]].forEach((v) => { const l = Math.hypot(...v); V.push(v.map((x) => x / l * 1.05)); });
      const O = [[.55, 0, 0], [-.55, 0, 0], [0, .55, 0], [0, -.55, 0], [0, 0, .55], [0, 0, -.55]];
      const edges = [], add = (A, B, L) => { for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) if (Math.abs(Math.hypot(A[i][0] - A[j][0], A[i][1] - A[j][1], A[i][2] - A[j][2]) - L) < 0.02) edges.push([A[i], A[j]]); };
      add(V, V, 1.05 * 2 / Math.hypot(1, ph)); add(O, O, 0.55 * Math.SQRT2);
      const nr = Math.floor(n * 0.2);
      for (let i = 0; i < n - nr; i++) { const e = edges[(r() * edges.length) | 0], t = r(); w.P(e[0][0] + (e[1][0] - e[0][0]) * t + gauss(r) * 0.006, e[0][1] + (e[1][1] - e[0][1]) * t + gauss(r) * 0.006, e[0][2] + (e[1][2] - e[0][2]) * t + gauss(r) * 0.006, r() < .01 ? 3 : 0); }
      for (let i = 0; i < nr; i++) { const a = r() * TAU, p = tilt(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 0, 1.2, 0.2); w.P(p[0], p[1], p[2], 0); }
      V.forEach((v) => { for (let k = 0; k < 6; k++) w.P(v[0] + gauss(r) * .02, v[1] + gauss(r) * .02, v[2] + gauss(r) * .02, 1); });
      fill(w, n, r);
      return coherent(w.a, n);
    },

    /* the final composition: a corona around a dark disc — an eclipse (nods to the old "Project: Eclipse" name) */
    eclipse(n) {
      const r = rng(6), w = writer(n), nc = Math.floor(n * 0.5), nr = Math.floor(n * 0.3);
      for (let i = 0; i < nc; i++) { const a = r() * TAU, rad = 0.86 + gauss(r) * 0.018, sat = a > 0.7 && a < 1.25; w.P(Math.cos(a) * rad, Math.sin(a) * rad, gauss(r) * 0.03, sat && r() < .35 ? 3 : 0); }
      for (let i = 0; i < nr; i++) { const a = r() * TAU, d = Math.pow(r(), 2.2), rad = 0.9 + d * 0.8; w.P(Math.cos(a) * rad, Math.sin(a) * rad, gauss(r) * 0.05 * (1 + d * 3), 0); }
      while (w.k < n) { const a = r() * TAU, rad = 1.0 + r() * 1.5, p = tilt(Math.cos(a) * rad, 0, Math.sin(a) * rad, .15, 0); w.P(p[0], p[1] * 0.6 + gauss(r) * 0.1, p[2] * 0.6, 0); }
      return coherent(w.a, n);
    },

    /* abstract bust: head, shoulders, glasses (red→tag1) and a small white tilak (blue→tag2) */
    human(n) {
      const draw = (g) => {
        g.fillStyle = "#4a4a4a"; g.beginPath(); g.ellipse(180, 392, 158, 118, 0, 0, TAU); g.fill();
        g.strokeStyle = "#cfcfcf"; g.lineWidth = 3; g.beginPath(); g.ellipse(180, 392, 158, 118, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke();
        g.fillStyle = "#3c3c3c"; g.fillRect(156, 226, 48, 70);
        const hg = g.createRadialGradient(180, 150, 10, 180, 150, 95); hg.addColorStop(0, "#5c5c5c"); hg.addColorStop(1, "#9a9a9a");
        g.fillStyle = hg; g.beginPath(); g.ellipse(180, 150, 62, 80, 0, 0, TAU); g.fill();
        g.strokeStyle = "#e6e6e6"; g.lineWidth = 3.2; g.stroke();
        g.fillStyle = "#c4c4c4"; g.beginPath(); g.ellipse(180, 112, 66, 56, 0, Math.PI, TAU); g.fill();
        g.fillStyle = "#7a7a7a"; [[116, 156], [244, 156]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 7, 15, 0, 0, TAU); g.fill(); });
        g.strokeStyle = "rgb(255,0,0)"; g.lineWidth = 3.4;
        [[154, 154], [206, 154]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 21, 17, 0, 0, TAU); g.stroke(); });
        g.beginPath(); g.moveTo(174, 151); g.quadraticCurveTo(180, 146, 186, 151); g.moveTo(133, 150); g.lineTo(118, 148); g.moveTo(227, 150); g.lineTo(242, 148); g.stroke();
        g.fillStyle = "rgb(0,0,255)"; g.beginPath(); g.ellipse(180, 120, 4.2, 9.5, 0, 0, TAU); g.fill();
        g.strokeStyle = "#8a8a8a"; g.lineWidth = 2; g.beginPath(); g.moveTo(180, 160); g.lineTo(177, 178); g.lineTo(184, 178); g.moveTo(166, 198); g.quadraticCurveTo(180, 205, 194, 198); g.stroke();
      };
      return coherent(sampleCanvas(draw, n, 360, 420, (i, r) => { const x = ((i % 360) - 180) / 135, y = -(((i / 360) | 0) - 200) / 135; return [x, y, (r() - .5) * 0.18 + 0.32 * Math.max(0, 1 - x * x * 1.1 - Math.max(0, y - .1) * Math.max(0, y - .1) * .5)]; }, [0.07, 0.012]), n);
    },

    /* abstract serpentine dragon: tapering body, dorsal spines, horned head, whiskers */
    dragon(n) {
      const draw = (g) => {
        const sp = (t) => [40 + t * 380, 160 + Math.sin(t * 7.2 + .4) * 62 * (.35 + t * .65) - t * 18];
        const rad = (t) => 2.5 + 20 * Math.pow(Math.sin(Math.min(1, t * 1.08) * Math.PI * .5), 1.2);
        g.fillStyle = "#6b6b6b";
        for (let i = 0; i <= 260; i++) { const t = i / 260, p = sp(t); g.beginPath(); g.arc(p[0], p[1], rad(t), 0, TAU); g.fill(); }
        g.strokeStyle = "#e8e8e8"; g.lineWidth = 2;
        for (let i = 4; i < 70; i++) { const t = i / 70, p = sp(t), p2 = sp(t + .01), a = Math.atan2(p2[1] - p[1], p2[0] - p[0]) - Math.PI / 2, r0 = rad(t), L = 6 + r0 * .8; g.beginPath(); g.moveTo(p[0] + Math.cos(a) * r0, p[1] + Math.sin(a) * r0); g.lineTo(p[0] + Math.cos(a - .5) * (r0 + L), p[1] + Math.sin(a - .5) * (r0 + L)); g.stroke(); }
        [.3, .5, .68].forEach((t) => { const p = sp(t), a = 1.9; g.lineWidth = 3; g.beginPath(); g.moveTo(p[0], p[1] + rad(t) * .6); g.quadraticCurveTo(p[0] + 8, p[1] + 34, p[0] + 26, p[1] + 38); g.stroke(); });
        const h = sp(1), h2 = sp(.985), ang = Math.atan2(h[1] - h2[1], h[0] - h2[0]);
        g.save(); g.translate(h[0], h[1]); g.rotate(ang);
        g.fillStyle = "#b8b8b8"; g.beginPath(); g.moveTo(-14, -18); g.quadraticCurveTo(24, -26, 58, -9); g.lineTo(62, 4); g.quadraticCurveTo(30, 6, 8, 20); g.quadraticCurveTo(-16, 18, -14, -18); g.fill();
        g.strokeStyle = "#f2f2f2"; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-6, -17); g.quadraticCurveTo(-30, -36, -52, -34); g.moveTo(2, -19); g.quadraticCurveTo(-14, -48, -40, -58); g.stroke();
        g.lineWidth = 1.8; g.beginPath(); g.moveTo(52, -2); g.bezierCurveTo(82, 8, 96, 36, 130, 40); g.moveTo(50, 4); g.bezierCurveTo(78, 22, 90, 54, 116, 70); g.stroke();
        g.fillStyle = "rgb(255,0,0)"; g.beginPath(); g.arc(16, -7, 3.6, 0, TAU); g.fill();
        g.restore();
      };
      return coherent(sampleCanvas(draw, n, 560, 340, (i, r) => { const x = ((i % 560) - 270) / 150, y = -(((i / 560) | 0) - 150) / 150; return [x, y, (r() - .5) * 0.22 + 0.12 * Math.sin(x * 3)]; }, [0.008]), n);
    },
  });

  SD.shapeCache = {};
  SD.getShape = (name, n) => { const k = name + n; return SD.shapeCache[k] || (SD.shapeCache[k] = S[name](n)); };
})();
