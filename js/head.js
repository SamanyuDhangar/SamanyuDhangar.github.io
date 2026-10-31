/* head.js — real 3D head geometry (triangle mesh), built at runtime. No flat image, no cutout.
   Units: eye line y=0, chin y=-1, hair top y≈+1.1, face half-width ≈ .6. Proportions were measured from
   the reference photo (cheek/jaw widths, lens spacing, nose width, mouth height, beard line, hair volume).
   It is a hand-parameterised sculpt guided by those measurements — not an ML/photogrammetry scan — see README.
   Vertex layout (8 floats): px py pz nx ny nz  mat aux
   mat: 0 skin · 1 hair · 2 facial hair/brows · 3 glasses frame · 4 lens · 5 tilak.  aux: shell thickness (hair/beard) */
(function () {
  const SD = (window.SD = window.SD || {});
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const sgp = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
  const g = (x, y, a, b, sx, sy) => Math.exp(-(((x - a) * (x - a)) / (2 * sx * sx) + ((y - b) * (y - b)) / (2 * sy * sy)));

  function crom(tab, y) {
    let i = 0; while (i < tab.length - 2 && y > tab[i + 1][0]) i++;
    const a = tab[i], b = tab[i + 1], t = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
    const p0 = (tab[i - 1] || a)[1], p1 = a[1], p2 = b[1], p3 = (tab[i + 2] || b)[1];
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  }
  /* cross-section tables (y → value), measured: wide cheekbones, strong squared jaw, neck ≈ .38 half-width */
  const TW = [[-1.7, .52], [-1.3, .40], [-1.1, .36], [-1.04, .31], [-1.0, .22], [-.93, .28], [-.8, .38], [-.67, .46], [-.5, .53], [-.33, .58], [-.15, .62], [0, .64], [.2, .63], [.5, .6], [.7, .55], [.85, .44], [.94, .28], [.99, .0]];
  const TF = [[-1.7, .02], [-1.1, .06], [-1.04, .1], [-1.0, .48], [-.9, .57], [-.75, .6], [-.57, .6], [-.4, .56], [-.25, .55], [-.1, .53], [0, .52], [.15, .57], [.3, .56], [.55, .52], [.75, .42], [.9, .25], [.99, .0]];
  const TB = [[-1.7, -.32], [-1.1, -.28], [-.8, -.5], [-.5, -.72], [-.2, -.86], [.2, -.9], [.6, -.84], [.8, -.62], [.93, -.3], [.99, 0]];
  const HAIRLINE = [[0, .52], [.6, .46], [1.0, .3], [1.45, .17], [1.9, -.05], [2.5, -.38], [Math.PI, -.5]];

  function prof(y) {
    const w = crom(TW, y), zf = crom(TF, y), zb = crom(TB, y);
    return { w, c: (zf + zb) / 2, h: Math.max(0.001, (zf - zb) / 2), n: 2.1 + 0.55 * sm(0.2, -0.5, y) };
  }
  /* facial relief: nose, brow ridge, cheekbones, lips, chin */
  function feat(x, y) {
    let f = 0;
    f += 0.17 * g(x, y, 0, -0.24, 0.085, 0.075) + 0.1 * g(x, y, 0, -0.12, 0.06, 0.14) + 0.07 * g(x, y, 0, -0.02, 0.05, 0.2);
    f += 0.05 * (g(x, y, 0.14, -0.22, 0.06, 0.05) + g(x, y, -0.14, -0.22, 0.06, 0.05));
    f += 0.06 * g(x, y, 0, 0.17, 0.52, 0.07) - 0.045 * (g(x, y, 0.33, 0, 0.15, 0.12) + g(x, y, -0.33, 0, 0.15, 0.12));
    f += 0.05 * (g(x, y, 0.43, -0.2, 0.14, 0.13) + g(x, y, -0.43, -0.2, 0.14, 0.13)) - 0.03 * (g(x, y, 0.4, -0.45, 0.15, 0.15) + g(x, y, -0.4, -0.45, 0.15, 0.15));
    f += 0.045 * g(x, y, 0, -0.52, 0.16, 0.045) + 0.05 * g(x, y, 0, -0.64, 0.15, 0.045) - 0.025 * g(x, y, 0, -0.585, 0.2, 0.012);
    f += 0.06 * g(x, y, 0, -0.9, 0.16, 0.07) + 0.02 * g(x, y, 0, 0.45, 0.4, 0.2);
    return f;
  }
  function surfaceZ(x, y) { const p = prof(y), t = Math.min(1, Math.abs(x) / p.w); return p.c + p.h * Math.pow(1 - Math.pow(t, p.n), 1 / p.n) + feat(x, y); }
  const noise = (x, y, z) => 0.5 + 0.5 * Math.sin(x * 9.1 + Math.sin(y * 7.3) * 1.7 + z * 5.7) * Math.sin(y * 11.7 + z * 3.1 + Math.sin(x * 6.9) * 1.3);

  function build(quality) {
    const NA = quality === "low" ? 56 : 88, NR = quality === "low" ? 60 : 88, YMAX = 0.99, YMIN = -1.7;
    const P = [], Nn = [], TH = [], A = [], Yy = [];
    for (let j = 0; j < NR; j++) {
      const y = YMAX - (j * (YMAX - YMIN)) / (NR - 1), pr = prof(y);
      for (let i = 0; i < NA; i++) {
        const th = (i / NA) * Math.PI * 2 - 0, s = Math.sin(th), c = Math.cos(th);
        let x = pr.w * sgp(s, 2 / pr.n), z = pr.c + pr.h * sgp(c, 2 / pr.n);
        z += sm(0.1, 0.7, c) * feat(x, y);
        x += Math.sign(s) * 0.075 * g(y, 0, -0.14, 0, 0.11, 1) * Math.exp(-Math.pow((c + 0.12) / 0.22, 2)); /* ears */
        P.push(x, y, z); A.push(Math.abs(Math.atan2(s, c))); Yy.push(y);
      }
    }
    const idx = [], at = (i, j) => (j * NA + ((i + NA) % NA));
    for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NA; i++) { const a = at(i, j), b = at(i + 1, j), c = at(i, j + 1), d = at(i + 1, j + 1); idx.push(a, c, b, b, c, d); }
    const normals = (pos, ind) => {
      const n = new Float32Array(pos.length);
      for (let t = 0; t < ind.length; t += 3) {
        const a = ind[t] * 3, b = ind[t + 1] * 3, c = ind[t + 2] * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        for (const k of [a, b, c]) { n[k] += nx; n[k + 1] += ny; n[k + 2] += nz; }
      }
      for (let k = 0; k < n.length; k += 3) { const l = Math.hypot(n[k], n[k + 1], n[k + 2]) || 1; n[k] /= l; n[k + 1] /= l; n[k + 2] /= l; }
      return n;
    };
    let N = normals(P, idx);
    /* make winding outward-facing (not relied on at runtime, but keeps normals consistent) */
    { let d = 0; for (let k = 0; k < N.length; k += 3) { const px = P[k], pz = P[k + 2] - 0.0; d += N[k] * px + N[k + 2] * pz * 0.5; } if (d < 0) { for (let t = 0; t < idx.length; t += 3) { const q = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = q; } N = normals(P, idx); } }

    const V = [], I = [];
    const push = (x, y, z, nx, ny, nz, m, a) => { V.push(x, y, z, nx, ny, nz, m, a); return V.length / 8 - 1; };
    const NV = P.length / 3;
    for (let k = 0; k < NV; k++) push(P[k * 3], P[k * 3 + 1], P[k * 3 + 2], N[k * 3], N[k * 3 + 1], N[k * 3 + 2], 0, 1);
    for (const t of idx) I.push(t);

    /* shells: hair and facial hair share the head topology; thickness 0 ⇒ discarded in the shader */
    const shell = (mat, thick) => {
      const base = V.length / 8, th = [];
      for (let k = 0; k < NV; k++) {
        const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2], t = thick(x, y, z, A[k], N[k * 3], N[k * 3 + 1], N[k * 3 + 2]); th.push(t);
        push(x + N[k * 3] * t, y + N[k * 3 + 1] * t, z + N[k * 3 + 2] * t, N[k * 3], N[k * 3 + 1], N[k * 3 + 2], mat, t);
      }
      for (let t = 0; t < idx.length; t += 3) if (th[idx[t]] > 0.004 || th[idx[t + 1]] > 0.004 || th[idx[t + 2]] > 0.004) I.push(base + idx[t], base + idx[t + 1], base + idx[t + 2]);
    };
    shell(1, (x, y, z, a) => {
      const yh = crom(HAIRLINE, a), m = sm(yh - 0.07, yh + 0.1, y); if (m <= 0.001) return 0;
      const n = noise(x, y, z), top = sm(0.3, 0.95, y), front = sm(0.9, 0.2, a) * sm(0.4, 0.85, y);
      return m * (0.05 + 0.085 * top + 0.07 * front + 0.04 * n + 0.012 * Math.sin(y * 46 + x * 18 + n * 3.5));
    });
    shell(2, (x, y, z, a) => {
      const yb = -0.38 + 0.34 * sm(0.7, 1.5, a), m0 = sm(yb, yb - 0.1, y) * sm(2.4, 1.5, a) * sm(-1.18, -1.04, y);
      const hole = clamp(g(x, y, 0, -0.6, 0.15, 0.065) * 1.8, 0, 1);
      let b = m0 * (1 - hole) * (0.032 + 0.03 * noise(x * 1.3, y, z) + 0.05 * sm(-0.8, -1.0, y));
      const brow = g(x, y, 0.3, 0.2, 0.2, 0.035) + g(x, y, -0.3, 0.2, 0.2, 0.035), bz = sm(0.2, 0.6, Math.cos(a));
      b = Math.max(b, clamp(brow, 0, 1) * bz * 0.022);
      return b;
    });

    /* ---------- glasses: real tube sweeps + lens discs, following the face surface ---------- */
    const tube = (pts, r, closed, mat, seg = 8) => {
      const n = pts.length, base = V.length / 8;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)], o = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
        let tx = q[0] - o[0], ty = q[1] - o[1], tz = q[2] - o[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        const ref = Math.abs(tz) > 0.8 ? [0, 1, 0] : [0, 0, 1];
        let nx = ty * ref[2] - tz * ref[1], ny = tz * ref[0] - tx * ref[2], nz = tx * ref[1] - ty * ref[0]; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
        for (let s = 0; s < seg; s++) { const a = (s / seg) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), ux = nx * ca + bx * sa, uy = ny * ca + by * sa, uz = nz * ca + bz * sa; push(p[0] + ux * r, p[1] + uy * r, p[2] + uz * r, ux, uy, uz, mat, 1); }
      }
      const last = closed ? n : n - 1;
      for (let i = 0; i < last; i++) for (let s = 0; s < seg; s++) { const a = base + i * seg + s, b = base + i * seg + ((s + 1) % seg), c = base + ((i + 1) % n) * seg + s, d = base + ((i + 1) % n) * seg + ((s + 1) % seg); I.push(a, c, b, b, c, d); }
    };
    const disc = (cx, cy, rx, ry, n, mat, lift, bulge) => {
      const base = V.length / 8, ring = 36, rows = 5, pos = [];
      for (let r = 0; r <= rows; r++) for (let k = 0; k < ring; k++) {
        const u = r / rows, a = (k / ring) * Math.PI * 2, x = cx + rx * u * sgp(Math.cos(a), 2 / n), y = cy + ry * u * sgp(Math.sin(a), 2 / n);
        pos.push(x, y, surfaceZ(x, y) + lift + bulge * (1 - u * u));
      }
      const ii = [];
      for (let r = 0; r < rows; r++) for (let k = 0; k < ring; k++) { const a = r * ring + k, b = r * ring + ((k + 1) % ring), c = (r + 1) * ring + k, d = (r + 1) * ring + ((k + 1) % ring); ii.push(a, c, b, b, c, d); }
      const nn = normals(pos, ii);
      for (let k = 0; k < pos.length; k += 3) { const nz = Math.abs(nn[k + 2]) < 0.05 ? 1 : nn[k + 2], s = nz < 0 ? -1 : 1; push(pos[k], pos[k + 1], pos[k + 2], nn[k] * s, nn[k + 1] * s, nn[k + 2] * s, mat, 1); }
      for (const t of ii) I.push(base + t);
    };
    const RX = 0.245, RY = 0.222, CY = -0.02, SUPER = 2.5;
    for (const sx of [-1, 1]) {
      const cx = sx * 0.33, pts = [];
      for (let k = 0; k < 96; k++) { const a = (k / 96) * Math.PI * 2, x = cx + RX * sgp(Math.cos(a), 2 / SUPER), y = CY + RY * sgp(Math.sin(a), 2 / SUPER); pts.push([x, y, surfaceZ(x, y) + 0.055]); }
      tube(pts, 0.02, true, 3);
      disc(cx, CY, RX * 0.985, RY * 0.985, SUPER, 4, 0.05, 0.03);
      const zr = surfaceZ(sx * 0.575, 0.03) + 0.05;
      const arm = [[sx * 0.575, 0.03, zr], [sx * 0.625, 0.03, 0.2], [sx * 0.665, 0.02, -0.02], [sx * 0.675, 0.0, -0.22], [sx * 0.66, -0.09, -0.4]];
      const dense = []; for (let k = 0; k < 24; k++) { const t = (k / 23) * (arm.length - 1), i = Math.min(arm.length - 2, Math.floor(t)), u = t - i, a = arm[Math.max(0, i - 1)], b = arm[i], c = arm[i + 1], d = arm[Math.min(arm.length - 1, i + 2)]; dense.push([0, 1, 2].map((q) => 0.5 * (2 * b[q] + (-a[q] + c[q]) * u + (2 * a[q] - 5 * b[q] + 4 * c[q] - d[q]) * u * u + (-a[q] + 3 * b[q] - 3 * c[q] + d[q]) * u * u * u))); }
      tube(dense, 0.016, false, 3, 6);
    }
    const bridge = []; for (let k = 0; k < 14; k++) { const u = k / 13, x = -0.09 + 0.18 * u, y = 0.015 + 0.06 * Math.sin(u * Math.PI); bridge.push([x, y, surfaceZ(x, y + 0.01) + 0.05]); }
    tube(bridge, 0.017, false, 3, 6);
    disc(0.02, 0.215, 0.032, 0.042, 2, 5, 0.012, 0.004); /* tilak */

    return { v: new Float32Array(V), i: new Uint16Array(I), tris: I.length / 3 };
  }
  SD.head = { build, surfaceZ };
})();
