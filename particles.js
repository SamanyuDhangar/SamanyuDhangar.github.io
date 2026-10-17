/* PROJECT : ECLIPSE — relativistic space-physics background
   ------------------------------------------------------------------
   Everything on the canvas is simulated, nothing is a pre-drawn sprite
   animation. Units: G = c = M = 1  →  length unit Rg = GM/c², time unit GM/c³.

   PHYSICS INSIDE
   • Orbits       Exact Schwarzschild timelike geodesics (equatorial-plane
                  Binet form, r'' = −M/r² + L²/r³ − 3ML²/r⁴) integrated with
                  a symplectic velocity-Verlet scheme and per-body adaptive
                  time-steps. This yields real GR effects for free: perihelion
                  precession (6πM/p per orbit), an ISCO at r = 6M (below
                  L = 2√3·M no stable circular orbit exists → plunge), and a
                  capture radius at the horizon r = 2M.
   • Accretion    Shakura–Sunyaev T(r) ∝ r^-3/4 (1−√(r_in/r))^1/4 temperature
                  profile, blackbody colours, and a viscous torque that bleeds
                  angular momentum so the disk really spirals inward.
   • Light        g = f / [E (1 − n·v)] — gravitational redshift and relativistic
                  Doppler in one factor. Approaching side beams brighter/bluer
                  (intensity ∝ g³), receding side dims/reddens.
   • Lensing      Thin point-lens equation θ² − βθ − θE² = 0 with both images
                  and their magnifications μ± = (u²+2)/(2u√(u²+4)) ± ½. Stars
                  become tangentially stretched arcs, the far side of the disk
                  is lifted over the hole, and the 3√3·M photon-capture shadow
                  hides what is behind it.
   • Jets         Bipolar relativistic jets: Doppler-boosted approaching jet,
                  dimmed counter-jet.
   • Cursor       Acts as a third gravitating body (restricted 3-body problem,
                  Plummer-softened) → real gravitational slingshots.
   • Scroll       Changes the observer's inclination to the disk plane.
   ------------------------------------------------------------------ */
(() => {
  "use strict";

  const canvas = document.getElementById("cyber-particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = window.innerWidth < 768;

  /* ============================ CONSTANTS ============================ */
  const RS = 2;                          // Schwarzschild radius (2GM/c²)
  const R_SHADOW = 3 * Math.sqrt(3);     // critical impact parameter ≈ 5.196
  const R_ISCO = 6;                      // innermost stable circular orbit
  const R_DISK_OUT = 36;                 // outer edge of the simulated disk
  const D_OBS = 60;                      // observer distance (Rg) for lensing
  const RE_INF = 2 * Math.sqrt(D_OBS);   // Einstein radius for sources at ∞
  const TIME_SCALE = 60;                 // sim time units per real second

  const N_DISK = isSmall ? 520 : 1700;
  const N_HALO = isSmall ? 80 : 240;
  const N_JET = isSmall ? 0 : 90;
  const STAR_CAP = isSmall ? 420 : 1500;

  // viscous torque: γ = α·(H/r)²·Ω × time-lapse
  const ALPHA_H2 = 2.5e-4;
  const VISC_LAPSE = 35;

  // cursor = third body
  const GM_CURSOR = 0.03;
  const CURSOR_SOFT2 = 25;
  const CURSOR_RANGE2 = 50 * 50;

  // real-world scale for the HUD (Sgr A*-like, M = 4.3×10⁶ M☉)
  const T_UNIT_S = 4.925491e-6 * 4.3e6;  // GM/c³ in seconds ≈ 21.2 s

  /* ============================== HELPERS ============================ */
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.7;

  /* ======================= BLACKBODY COLOUR LUT ====================== */
  function kelvinToRGB(K) {
    const t = K / 100;
    let r, g, b;
    if (t <= 66) { r = 255; g = 99.4708025861 * Math.log(t) - 161.1195681661; }
    else { r = 329.698727446 * Math.pow(t - 60, -0.1332047592); g = 288.1221695283 * Math.pow(t - 60, -0.0755148492); }
    if (t >= 66) b = 255; else if (t <= 19) b = 0; else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return [clamp(r, 0, 255) | 0, clamp(g, 0, 255) | 0, clamp(b, 0, 255) | 0];
  }

  const NB = 72, T_MIN = 1400, T_MAX = 32000;
  const LN0 = Math.log(T_MIN), LNR = Math.log(T_MAX) - LN0;
  const binOf = (T) => clamp(((Math.log(T) - LN0) / LNR * (NB - 1) + 0.5) | 0, 0, NB - 1);
  const sprites = [];
  const css = [];
  for (let i = 0; i < NB; i++) {
    const T = Math.exp(LN0 + (LNR * i) / (NB - 1));
    const [r, g, b] = kelvinToRGB(T);
    css.push(`rgb(${r},${g},${b})`);
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const s = c.getContext("2d");
    const grad = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, `rgba(${(r * 0.7 + 76) | 0},${(g * 0.7 + 76) | 0},${(b * 0.7 + 76) | 0},1)`);
    grad.addColorStop(0.2, `rgba(${r},${g},${b},0.7)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    s.fillStyle = grad;
    s.fillRect(0, 0, 32, 32);
    sprites.push(c);
  }

  // soft bloom sprite for the integrated disk glow
  const bloom = document.createElement("canvas");
  bloom.width = bloom.height = 128;
  {
    const s = bloom.getContext("2d");
    const grad = s.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,214,170,0.85)");
    grad.addColorStop(0.25, "rgba(255,150,70,0.32)");
    grad.addColorStop(0.6, "rgba(120,110,200,0.08)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    s.fillStyle = grad;
    s.fillRect(0, 0, 128, 128);
  }

  /* =================== SHAKURA–SUNYAEV EMISSION TABLE ================ */
  const T_PEAK = 9500;
  const ssRaw = (r) => {
    const x = r / R_ISCO;
    return Math.pow(x, -0.75) * Math.pow(Math.max(0, 1 - 1 / Math.sqrt(x)), 0.25);
  };
  let ssMax = 0;
  for (let x = 1.01; x < 12; x += 0.01) ssMax = Math.max(ssMax, ssRaw(x * R_ISCO));

  const TAB_N = 256;                     // r = 2 … 66 in 0.25 steps
  const tabT = new Float32Array(TAB_N);
  const tabI = new Float32Array(TAB_N);
  for (let i = 0; i < TAB_N; i++) {
    const r = 2 + i * 0.25;
    const n = Math.max(ssRaw(Math.max(r, R_ISCO)) / ssMax, 0.28);
    const fade = clamp((r - 2.3) / 3.7, 0, 1);       // dims into the horizon
    tabT[i] = T_PEAK * n * (0.35 + 0.65 * fade);
    tabI[i] = (0.2 + 0.8 * n * n) * fade * 0.55;
  }

  /* ============================= STATE =============================== */
  const DISK = 0, HALO = 1, JET = 2;
  const bodies = [];

  function newBody(kind) {
    return {
      kind,
      r: 10, phi: 0, pr: 0, L: 3.5,
      e1x: 1, e1y: 0, e1z: 0, e2x: 0, e2y: 1, e2z: 0,
      T0: 6000, I0: 0.5,
      jz: 0, jb: 0.8, jg: 1.7, jrho: 0, jpsi: 0, jsg: 1, jtan: 0.07,
      vis: false, behind: false, sx: 0, sy: 0, a: 0, bin: 0, sz: 8,
      tx: 0, ty: 0, psx: 0, psy: 0, hasPrev: false,
      vis2: false, sx2: 0, sy2: 0, a2: 0
    };
  }

  function setPlane(b, nx, ny, nz) {
    let ex = -ny, ey = nx, ez = 0;
    const m = Math.hypot(ex, ey);
    if (m < 1e-6) { ex = 1; ey = 0; } else { ex /= m; ey /= m; }
    b.e1x = ex; b.e1y = ey; b.e1z = ez;
    b.e2x = ny * ez - nz * ey;
    b.e2y = nz * ex - nx * ez;
    b.e2z = nx * ey - ny * ex;
  }

  function randomUnit() {
    const z = rand(-1, 1), p = rand(0, TAU), q = Math.sqrt(1 - z * z);
    return [q * Math.cos(p), q * Math.sin(p), z];
  }

  function spawnDisk(b, initial) {
    // steady-state accretion flow has dN/dr ∝ r^½ → sample r^1.5 uniformly
    // initial: half steady-state (dN/dr ∝ r^½), half log-uniform; later: turbulent
    // mass injection spread log-uniformly through the outer/mid disk
    if (initial && Math.random() < 0.5) {
      const a = Math.pow(6.9, 1.5), z = Math.pow(R_DISK_OUT, 1.5);
      b.r = Math.pow(lerp(a, z, Math.random()), 2 / 3);
    } else {
      const lo = initial ? 7 : 12;
      b.r = Math.exp(rand(Math.log(lo), Math.log(R_DISK_OUT)));
    }
    const tilt = Math.abs(gauss()) * 0.03, az = rand(0, TAU);
    setPlane(b, Math.sin(tilt) * Math.cos(az), Math.sin(tilt) * Math.sin(az), Math.cos(tilt));
    b.phi = rand(0, TAU);
    b.L = (b.r / Math.sqrt(b.r - 3)) * (1 + 0.004 * gauss());   // circular geodesic
    b.pr = 0.0015 * gauss();
    b.hasPrev = false;
  }

  function spawnHalo(b) {
    // bound debris on eccentric orbits (apoapsis start), isotropic orientation
    const r = Math.exp(rand(Math.log(24), Math.log(230)));
    const vc = 1 / Math.sqrt(r - 2);                              // local circular speed
    const fmin = Math.min(0.97, Math.sqrt(18 / (r + 9)) * 1.15);  // keep periapsis ≳ 9 Rg
    const vloc = rand(fmin, 1) * vc;
    b.r = r;
    b.L = (r * vloc) / Math.sqrt(1 - vloc * vloc);                // L = r·γ·v
    b.pr = 0;
    b.phi = rand(0, TAU);
    const n = randomUnit();
    setPlane(b, n[0], n[1], n[2]);
    b.T0 = rand(3200, 9000);
    b.I0 = rand(0.35, 0.85);
    b.hasPrev = false;
  }

  function spawnJet(b, initial) {
    b.jsg = Math.random() < 0.5 ? -1 : 1;
    b.jb = rand(0.55, 0.95);
    b.jg = 1 / Math.sqrt(1 - b.jb * b.jb);
    b.jz = initial ? Math.exp(rand(Math.log(6), Math.log(220))) : rand(4, 7);
    b.jtan = rand(0.04, 0.09);
    b.jpsi = rand(0, TAU);
    b.hasPrev = false;
  }

  for (let i = 0; i < N_DISK; i++) { const b = newBody(DISK); spawnDisk(b, true); bodies.push(b); }
  for (let i = 0; i < N_HALO; i++) { const b = newBody(HALO); spawnHalo(b); bodies.push(b); }
  for (let i = 0; i < N_JET; i++) { const b = newBody(JET); spawnJet(b, true); bodies.push(b); }

  /* ============================ INTEGRATOR =========================== */
  const acc = (r, L2) => -1 / (r * r) + L2 / (r * r * r) - (3 * L2) / (r * r * r * r);

  // returns false if the body crossed the horizon
  function stepGeodesic(b, dt) {
    let r = b.r, pr = b.pr, L = b.L, phi = b.phi;
    let f = 1 - RS / r;
    let E = Math.sqrt(pr * pr + f * (1 + (L * L) / (r * r)));
    const lim = 0.04 * r * Math.sqrt(r);
    let n = Math.ceil((dt * f) / (E * lim));
    n = n < 1 ? 1 : n > 16 ? 16 : n;
    const h = dt / n;

    for (let i = 0; i < n; i++) {
      f = 1 - RS / r;
      if (b.kind === DISK && r < 60) L *= 1 - ALPHA_H2 * VISC_LAPSE * Math.pow(r, -1.5) * h;
      E = Math.sqrt(pr * pr + f * (1 + (L * L) / (r * r)));
      const dtau = (h * f) / E;
      const L2 = L * L;
      const prh = pr + 0.5 * dtau * acc(r, L2);
      const rn = r + dtau * prh;
      if (!(rn > 2.15)) return false;
      pr = prh + 0.5 * dtau * acc(rn, L2);
      const rm = 0.5 * (r + rn);
      phi += (dtau * L) / (rm * rm);
      r = rn;
    }
    b.r = r; b.pr = pr; b.L = L; b.phi = phi;
    return true;
  }

  // Cartesian position / coordinate velocity of a body (reused scratch vars)
  let PX = 0, PY = 0, PZ = 0, VX = 0, VY = 0, VZ = 0, KFE = 1;
  function kin(b) {
    const r = b.r, c = Math.cos(b.phi), s = Math.sin(b.phi);
    const rx = c * b.e1x + s * b.e2x, ry = c * b.e1y + s * b.e2y, rz = c * b.e1z + s * b.e2z;
    const tx = -s * b.e1x + c * b.e2x, ty = -s * b.e1y + c * b.e2y, tz = -s * b.e1z + c * b.e2z;
    const f = 1 - RS / r;
    const E = Math.sqrt(b.pr * b.pr + f * (1 + (b.L * b.L) / (r * r)));
    const fE = f / E;
    const vr = b.pr * fE, vt = (b.L * fE) / r;
    PX = r * rx; PY = r * ry; PZ = r * rz;
    VX = vr * rx + vt * tx; VY = vr * ry + vt * ty; VZ = vr * rz + vt * tz;
    KFE = fE;
  }

  // rebuild geodesic state (E, L, plane) from Cartesian state after a kick
  function fromCartesian(b, px, py, pz, vx, vy, vz) {
    const r = Math.hypot(px, py, pz);
    if (r < 2.3) return;
    const rx = px / r, ry = py / r, rz = pz / r;
    const vr = vx * rx + vy * ry + vz * rz;
    let tx = vx - vr * rx, ty = vy - vr * ry, tz = vz - vr * rz;
    const vt = Math.hypot(tx, ty, tz);
    if (vt < 1e-8) return;
    tx /= vt; ty /= vt; tz /= vt;
    const f = 1 - RS / r;
    let den = f - (vr * vr) / f - vt * vt;
    if (den < 0.02) den = 0.02;
    const ut = 1 / Math.sqrt(den);
    b.r = r; b.phi = 0;
    b.pr = vr * ut;
    b.L = r * vt * ut;
    b.e1x = rx; b.e1y = ry; b.e1z = rz;
    b.e2x = tx; b.e2y = ty; b.e2z = tz;
  }

  /* ============================== VIEW =============================== */
  let w = 0, h = 0, dpr = 1, S = 8;         // S = css pixels per Rg
  let baseCx = 0, baseCy = 0, cx = 0, cy = 0;
  let incl = (80 * Math.PI) / 180, ci = Math.cos(incl), si = Math.sin(incl);
  let master = 1, scrollSc = 0;
  let starAngle = 0, simClock = 0, swallowed = 0;
  const mouse = { x: 0, y: 0, active: false };

  /* ============================== STARS ============================== */
  let stars = [];
  const STAR_T = [11000, 7000, 5200, 3600];
  const STAR_CSS = STAR_T.map((T) => { const c = kelvinToRGB(T); return `rgb(${c[0]},${c[1]},${c[2]})`; });
  let starStart = [0, 0, 0, 0, 0];

  function buildStars() {
    const Rf = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 40;
    const n = Math.min(STAR_CAP, Math.floor((Math.PI * Rf * Rf) / (isSmall ? 3200 : 2200)));
    const list = [];
    for (let i = 0; i < n; i++) {
      const rr = Rf * Math.sqrt(Math.random()), a = rand(0, TAU);
      const q = Math.random();
      const cls = q < 0.15 ? 0 : q < 0.5 ? 1 : q < 0.8 ? 2 : 3;
      const m = Math.random();
      list.push({
        dx: rr * Math.cos(a), dy: rr * Math.sin(a), cls,
        al: 0.14 + 0.8 * m * m * m, sz: 0.9 + 1.5 * m * m
      });
    }
    list.sort((p, q) => p.cls - q.cls);
    starStart = [0, 0, 0, 0, list.length];
    for (let c = 1; c < 4; c++) starStart[c] = list.findIndex((s) => s.cls >= c) < 0 ? list.length : list.findIndex((s) => s.cls >= c);
    stars = list;
  }

  /* ============================ RESIZE =============================== */
  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mobile = w < 768;
    S = mobile ? clamp(w / 72, 4.5, 6) : clamp(Math.min(w, h * 1.5) / 170, 5, 9.5);
    baseCx = mobile ? w * 0.5 : w * 0.72;
    baseCy = mobile ? h * 0.14 : h * 0.205;
    cx = baseCx; cy = baseCy;
    buildStars();
  }

  /* ======================== LENSING + PLACEMENT ====================== */
  // Thin point-lens: returns primary-image position and (optionally) the
  // secondary image. X,Y in Rg (screen-plane), d = depth (+ toward observer).
  function place(b, X, Y, d, I, bin, sizeBase, sizeGain) {
    let px = X, py = Y, mu = 1;
    b.vis2 = false;
    if (d < -1e-3) {
      const Ld = -d;
      const RE2 = (4 * D_OBS * Ld) / (D_OBS + Ld);
      const bb = Math.max(Math.hypot(X, Y), 0.02);
      const sq = Math.sqrt(bb * bb + 4 * RE2);
      const u = bb / Math.sqrt(RE2);
      const mg = (u * u + 2) / (2 * u * Math.sqrt(u * u + 4));
      mu = Math.min(mg + 0.5, 4.5);
      const k = (0.5 * (bb + sq)) / bb;
      px = X * k; py = Y * k;
      if (bb < 3 * Math.sqrt(RE2)) {
        const mu2 = mg - 0.5;
        if (mu2 > 0.015) {
          const k2 = (-0.5 * (sq - bb)) / bb;
          b.sx2 = cx + X * k2 * S;
          b.sy2 = cy + Y * k2 * S;
          b.a2 = Math.min(1, I * mu2) * master;
          b.vis2 = true;
        }
      }
    }
    const sx = cx + px * S, sy = cy + py * S;
    if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) { b.vis = false; b.hasPrev = false; b.vis2 = false; return; }
    b.vis = true;
    b.behind = d < 0;
    b.bin = bin;
    b.a = Math.min(1, I * mu) * master;
    b.sz = sizeBase + sizeGain * Math.sqrt(Math.min(I * mu, 1.6));
    if (b.hasPrev) {
      const dx = sx - b.psx, dy = sy - b.psy;
      if (dx * dx + dy * dy < 4900) { b.tx = sx - dx * 2.5; b.ty = sy - dy * 2.5; }
      else { b.tx = sx; b.ty = sy; }
    } else { b.tx = sx; b.ty = sy; }
    b.psx = sx; b.psy = sy; b.hasPrev = true;
    b.sx = sx; b.sy = sy;
    if (b.vis2) b.sz2 = b.sz;
  }

  function project(b) {
    if (b.kind === JET) {
      const z = b.jz * b.jsg;
      const rho = b.jz * b.jtan + 0.4;
      const ps = b.jpsi + 0.07 * b.jz;
      const x = rho * Math.cos(ps), y = rho * Math.sin(ps);
      const X = x, Y = y * ci - z * si, d = y * si + z * ci;
      const nv = b.jsg * b.jb * ci;
      const g = clamp(1 / (b.jg * (1 - nv)), 0.05, 3);
      const I = 0.9 * Math.pow(g, 2.7) / (1 + b.jz / 28);
      place(b, X, Y, d, I, binOf(15000 * Math.pow(Math.min(g, 1.6), 0.7)), 3.5, 5);
      return;
    }
    const nv = VY * si + VZ * ci;
    const g = clamp(KFE / (1 - nv), 0.04, 2.6);
    const X = PX, Y = PY * ci - PZ * si, d = PY * si + PZ * ci;
    if (b.kind === DISK) {
      let idx = ((b.r - 2) * 4) | 0;
      idx = idx < 0 ? 0 : idx >= TAB_N ? TAB_N - 1 : idx;
      const I = tabI[idx] * Math.pow(g, 3.2);
      place(b, X, Y, d, I, binOf(tabT[idx] * g), 3.4, 6);
    } else {
      const I = b.I0 * (0.3 + 14 / (1 + (b.r * b.r) / 36)) * Math.pow(g, 3);
      place(b, X, Y, d, Math.min(I, 1.4), binOf(b.T0 * g), 3.2, 4.5);
    }
  }

  /* ============================ SIMULATION =========================== */
  function respawn(b) {
    swallowed++;
    if (b.kind === DISK) spawnDisk(b, false); else spawnHalo(b);
  }

  function simulate(dt, real) {
    // observer inclination follows scroll (smoothed)
    const tgt = ((lerp(80, 60, scrollSc)) * Math.PI) / 180;
    incl += (tgt - incl) * (1 - Math.exp(-real * 3));
    ci = Math.cos(incl); si = Math.sin(incl);

    // cursor body in the plane perpendicular to the line of sight
    let kx = 0, ky = 0, kz = 0;
    const kick = mouse.active && !reduceMotion;
    if (kick) {
      const Xm = (mouse.x - cx) / S, Ym = (mouse.y - cy) / S;
      kx = Xm; ky = Ym * ci; kz = -Ym * si;
    }

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.kind === JET) {
        b.jz += b.jb * dt;
        if (b.jz > 240) spawnJet(b, false);
        project(b);
        continue;
      }
      if (dt > 0) {
        if (!stepGeodesic(b, dt) || b.r > 320) { respawn(b); }
      }
      kin(b);
      if (kick) {
        const dx = PX - kx, dy = PY - ky, dz = PZ - kz;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < CURSOR_RANGE2) {
          const a = (-GM_CURSOR * dt) / Math.pow(d2 + CURSOR_SOFT2, 1.5);
          const nvx = VX + a * dx, nvy = VY + a * dy, nvz = VZ + a * dz;
          if (nvx * nvx + nvy * nvy + nvz * nvz < 0.95) {
            fromCartesian(b, PX, PY, PZ, nvx, nvy, nvz);
            VX = nvx; VY = nvy; VZ = nvz;
          }
        }
      }
      project(b);
    }
    simClock += dt;
    starAngle += real * 0.008;
  }

  /* ============================== RENDER ============================= */
  function drawStars() {
    const cr = Math.cos(starAngle), sr = Math.sin(starAngle);
    const RE = RE_INF, RE2 = RE * RE;
    ctx.lineCap = "round";
    for (let c = 0; c < 4; c++) {
      ctx.fillStyle = STAR_CSS[c];
      ctx.strokeStyle = STAR_CSS[c];
      for (let i = starStart[c], e = starStart[c + 1]; i < e; i++) {
        const st = stars[i];
        const X0 = st.dx * cr - st.dy * sr, Y0 = st.dx * sr + st.dy * cr;
        const bb = Math.hypot(X0, Y0) / S;
        if (bb > 10 * RE) {
          const x = cx + X0, y = cy + Y0;
          if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
          ctx.globalAlpha = st.al * master;
          ctx.fillRect(x, y, st.sz, st.sz);
          continue;
        }
        const b0 = Math.max(bb, 0.02);
        const bx = X0 / S, by = Y0 / S;
        const sq = Math.sqrt(b0 * b0 + 4 * RE2);
        const Rp = 0.5 * (b0 + sq);
        const kp = Rp / b0;
        const x = cx + bx * kp * S, y = cy + by * kp * S;
        const near = b0 < 3.2 * RE;
        if (!near) {
          if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
          ctx.globalAlpha = st.al * master;
          ctx.fillRect(x, y, st.sz, st.sz);
          continue;
        }
        const u = b0 / RE;
        const mg = (u * u + 2) / (2 * u * Math.sqrt(u * u + 4));
        // primary image — tangentially stretched by Rp/β, radially by 1/|1−(θE/θ)⁴|
        if (x > -80 && x < w + 80 && y > -80 && y < h + 80) {
          const mt = Rp / b0;
          const mr = 1 / Math.abs(1 - Math.pow(RE / Rp, 4));
          const len = clamp(st.sz * mt, st.sz, 70);
          const wid = clamp(st.sz * mr, 0.8, 3);
          const px = bx * kp, py = by * kp, pm = Math.hypot(px, py) || 1;
          const tx = (-py / pm) * len * 0.5, ty = (px / pm) * len * 0.5;
          ctx.globalAlpha = Math.min(1, st.al * (0.6 + 0.4 * (mg + 0.5))) * master;
          ctx.lineWidth = wid;
          ctx.beginPath(); ctx.moveTo(x - tx, y - ty); ctx.lineTo(x + tx, y + ty); ctx.stroke();
        }
        // secondary image on the opposite side of the lens
        const mu2 = mg - 0.5;
        if (mu2 > 0.012) {
          const Rm = 0.5 * (sq - b0), k2 = -Rm / b0;
          const x2 = cx + bx * k2 * S, y2 = cy + by * k2 * S;
          if (x2 > -80 && x2 < w + 80 && y2 > -80 && y2 < h + 80) {
            const mt = Rm / b0;
            const mr = 1 / Math.abs(1 - Math.pow(RE / Rm, 4));
            const len = clamp(st.sz * mt, st.sz, 70);
            const wid = clamp(st.sz * mr, 0.8, 3);
            const px = bx * k2, py = by * k2, pm = Math.hypot(px, py) || 1;
            const tx = (-py / pm) * len * 0.5, ty = (px / pm) * len * 0.5;
            ctx.globalAlpha = Math.min(1, st.al * (0.5 + mu2 * 2)) * master;
            ctx.lineWidth = wid;
            ctx.beginPath(); ctx.moveTo(x2 - tx, y2 - ty); ctx.lineTo(x2 + tx, y2 + ty); ctx.stroke();
          }
        }
      }
    }
  }

  function drawBodies(back) {
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (!b.vis || b.behind !== back) continue;
      const s = b.sz;
      if (b.hasPrev && (b.tx !== b.sx || b.ty !== b.sy)) {
        ctx.globalAlpha = b.a * 0.5;
        ctx.strokeStyle = css[b.bin];
        ctx.beginPath(); ctx.moveTo(b.tx, b.ty); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      }
      ctx.globalAlpha = b.a;
      ctx.drawImage(sprites[b.bin], b.sx - s / 2, b.sy - s / 2, s, s);
      if (b.vis2) {
        ctx.globalAlpha = b.a2;
        ctx.drawImage(sprites[b.bin], b.sx2 - s / 2, b.sy2 - s / 2, s, s);
      }
    }
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    drawStars();

    // integrated disk bloom, flattened by the viewing inclination
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, Math.max(ci, 0.3));
    ctx.globalAlpha = 0.24 * master;
    const bs = R_DISK_OUT * S * 1.5;
    ctx.drawImage(bloom, -bs, -bs, bs * 2, bs * 2);
    ctx.restore();

    drawBodies(true);

    // photon-capture shadow (b_crit = 3√3 GM/c²) hides everything behind it
    const Rsh = R_SHADOW * S;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000";
    ctx.beginPath(); ctx.arc(cx, cy, Rsh, 0, TAU); ctx.fill();

    // photon ring, Doppler-asymmetric (approaching side brighter and bluer)
    ctx.globalCompositeOperation = "lighter";
    const pg = ctx.createLinearGradient(cx - Rsh, 0, cx + Rsh, 0);
    pg.addColorStop(0, "rgba(255,120,60,0.22)");
    pg.addColorStop(1, "rgba(190,225,255,0.85)");
    ctx.globalAlpha = master;
    ctx.strokeStyle = pg;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, Rsh * 1.012, 0, TAU); ctx.stroke();
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.14 * master;
    ctx.beginPath(); ctx.arc(cx, cy, Rsh * 1.06, 0, TAU); ctx.stroke();

    drawBodies(false);

    // cursor body marker
    if (mouse.active && !reduceMotion) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "rgb(125,199,255)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 12, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgb(190,230,255)";
      ctx.fillRect(mouse.x - 1.5, mouse.y - 1.5, 3, 3);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /* ============================== HUD ================================ */
  let hud = null;
  if (!isSmall) {
    hud = document.createElement("div");
    hud.className = "phys-hud";
    hud.setAttribute("aria-hidden", "true");
    document.body.appendChild(hud);
  }
  const rsAU = (2 * 1476.625 * 4.3e6) / 1.495978707e11;
  const isco_min = (TAU * Math.pow(6, 1.5) * T_UNIT_S) / 60;
  let hudTimer = 0;
  function updateHud(now) {
    if (!hud || now - hudTimer < 400) return;
    hudTimer = now;
    const t = Math.floor(simClock * T_UNIT_S);
    const hh = String(Math.floor(t / 3600)).padStart(2, "0");
    const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const ss = String(t % 60).padStart(2, "0");
    hud.innerHTML =
      `<b>ECLIPSE // PHYSICS</b>  schwarzschild · a=0\n` +
      `M 4.3e6 M☉ · r<sub>s</sub> ${rsAU.toFixed(3)} AU\n` +
      `ISCO 6 Rg · T ${isco_min.toFixed(1)} min\n` +
      `shadow ${R_SHADOW.toFixed(3)} Rg · incl ${((incl * 180) / Math.PI).toFixed(1)}°\n` +
      `bodies ${bodies.length} · swallowed ${swallowed}\n` +
      `t<sub>sim</sub> ${hh}:${mm}:${ss} (×${Math.round(TIME_SCALE * T_UNIT_S)})`;
    hud.style.opacity = String(clamp(1 - window.scrollY / (h * 0.45), 0, 1) * 0.9);
  }

  /* ============================== LOOP =============================== */
  let rafId = 0, lastT = 0;

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const real = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    updateScroll();
    simulate(real * TIME_SCALE, real);
    render();
    updateHud(now);
  }

  function updateScroll() {
    scrollSc = clamp(window.scrollY / (h * 1.2), 0, 1);
    cx = baseCx;
    cy = baseCy - scrollSc * h * 0.14;
    master = lerp(isSmall ? 0.75 : 0.95, isSmall ? 0.4 : 0.5, scrollSc);
  }

  const start = () => { if (!rafId && !reduceMotion) { lastT = performance.now(); rafId = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(rafId); rafId = 0; };

  function staticFrame() {
    updateScroll();
    // let the disk settle for a moment so the still frame is already in motion-state
    for (let i = 0; i < 40; i++) simulate(10, 0.05);
    render();
    updateHud(1e9);
  }

  /* ============================= EVENTS ============================== */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); if (reduceMotion) staticFrame(); }, 150);
  });
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { mouse.active = false; });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  resize();
  if (reduceMotion) staticFrame(); else start();
})();
