/* CINEMATIC LAYER — a canvas road that you travel as you scroll.
   Perspective lane lines, drifting light trails, depth particles, per-section lighting.
   Single rAF loop, pauses when hidden, adaptive quality, static frame for reduced motion. */
(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js-cine");
  const cv = document.getElementById("cine");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = innerWidth < 760;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---- scenes: environment colour + fog density per section ---- */
  const SCENES = {
    home:           { c: [92, 190, 215],  fog: .55, name: "Threshold" },
    about:          { c: [105, 150, 245], fog: .50, name: "Signal" },
    mission:        { c: [130, 135, 245], fog: .60, name: "Target" },
    skills:         { c: [150, 125, 235], fog: .55, name: "Orbit" },
    journey:        { c: [205, 160, 115], fog: .75, name: "Long Road" },
    projects:       { c: [85, 205, 180],  fog: .45, name: "Laboratory" },
    certifications: { c: [215, 188, 125], fog: .50, name: "Vault" },
    shell:          { c: [100, 190, 250], fog: .45, name: "Terminal" },
    contact:        { c: [205, 125, 170], fog: .70, name: "Horizon" }
  };
  const SHIFT = { about: -.2, mission: .2, skills: -.2, journey: .2, projects: 0, certifications: -.2, shell: .2, contact: 0, home: 0 };
  let vxo = 0, vxt = 0;
  let cur = [...SCENES.home.c], tgt = [...SCENES.home.c], fogT = .55;

  /* ---- sizing / quality ---- */
  let W = 0, H = 0, dpr = 1, VX = 0, VY = 0;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    VX = W / 2; VY = H * .4;
  };
  resize();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { resize(); draw(0, true); }, 120); });

  /* ---- world ---- */
  const N_TRAIL = small ? 9 : 16, N_DUST = small ? 38 : 80;
  const trails = Array.from({ length: N_TRAIL }, () => ({ x: (Math.random() * 2 - 1) * 1.6, z: Math.random(), s: .12 + Math.random() * .22, a: .25 + Math.random() * .5 }));
  const dust = Array.from({ length: N_DUST }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), r: .4 + Math.random() * 1.1 }));
  const stars = Array.from({ length: small ? 40 : 90 }, () => ({ x: Math.random(), y: Math.random() * .42, t: Math.random() * 6.28, r: Math.random() * .9 + .2 }));

  /* ---- scroll state ---- */
  let sp = 0, spS = 0, vel = 0, lastY = scrollY, dist = 0;
  const max = () => Math.max(1, root.scrollHeight - innerHeight);

  /* ---- drawing ---- */
  const rgba = (a) => `rgba(${cur[0] | 0},${cur[1] | 0},${cur[2] | 0},${a})`;
  const proj = (z) => z * z; // perspective curve: 0 = horizon, 1 = camera

  function draw(dt, still) {
    ctx.clearRect(0, 0, W, H);
    const horizon = ctx.createLinearGradient(0, 0, 0, H);
    horizon.addColorStop(0, "#02040a"); horizon.addColorStop(.4, "#050912"); horizon.addColorStop(1, "#03050a");
    ctx.fillStyle = horizon; ctx.fillRect(0, 0, W, H);

    // distant glow at the vanishing point
    const g = ctx.createRadialGradient(VX, VY, 0, VX, VY, Math.max(W, H) * .5);
    g.addColorStop(0, rgba(.16 + vel * .15)); g.addColorStop(.35, rgba(.05)); g.addColorStop(1, "transparent");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // stars
    const now = performance.now() / 1000;
    for (const s of stars) {
      ctx.globalAlpha = .25 + .35 * Math.sin(now * .8 + s.t);
      ctx.fillStyle = "#cfe3f2"; ctx.fillRect(s.x * W, s.y * H, s.r, s.r);
    }
    ctx.globalAlpha = 1;

    // road lane lines converge on the horizon
    const lanes = small ? 5 : 9, span = W * 1.9;
    ctx.lineWidth = 1;
    for (let i = -lanes; i <= lanes; i++) {
      const bx = VX + (i / lanes) * span * .5;
      const edge = Math.abs(i) / lanes;
      const lg = ctx.createLinearGradient(VX, VY, bx, H);
      lg.addColorStop(0, "transparent"); lg.addColorStop(.35, rgba(.05 + (1 - edge) * .06)); lg.addColorStop(1, rgba(.2 * (1 - edge * .6)));
      ctx.strokeStyle = lg; ctx.beginPath(); ctx.moveTo(VX, VY); ctx.lineTo(bx, H + 40); ctx.stroke();
    }
    // cross bars rush toward the camera as you scroll
    const rows = small ? 10 : 16, off = (dist * .0016) % 1;
    for (let k = 0; k < rows; k++) {
      const z = ((k / rows) + off) % 1, y = VY + (H - VY) * proj(z);
      const half = span * .5 * proj(z);
      ctx.strokeStyle = rgba(.03 + z * .14); ctx.beginPath(); ctx.moveTo(VX - half, y); ctx.lineTo(VX + half, y); ctx.stroke();
    }

    // maze door-frames glide toward you down the corridor
    for (let k = 0; k < 6; k++) {
      const z = ((k / 6) + off) % 1, p = proj(z), y = VY + (H - VY) * p, hw = W * .34 * p, hh = H * .5 * p;
      ctx.strokeStyle = rgba(.04 + z * .32); ctx.lineWidth = .8 + z * 1.6;
      ctx.strokeRect(VX - hw, y - hh, hw * 2, hh);
      ctx.beginPath(); ctx.moveTo(VX - hw, y - hh * .5); ctx.lineTo(VX - hw * 1.5, y - hh * .5); ctx.moveTo(VX + hw, y - hh * .5); ctx.lineTo(VX + hw * 1.5, y - hh * .5); ctx.stroke();
    }
    // light trails
    ctx.lineCap = "round";
    for (const t of trails) {
      const prev = t.z;
      t.z += (t.s * .12 + vel * t.s * 1.6) * dt;
      if (t.z > 1.02) { t.z = 0; t.x = (Math.random() * 2 - 1) * 1.6; }
      if (t.z < 0) t.z = 0;
      const p0 = proj(Math.max(0, prev - .05 - vel * .05)), p1 = proj(t.z);
      const x0 = VX + t.x * span * .3 * p0, y0 = VY + (H - VY) * p0;
      const x1 = VX + t.x * span * .3 * p1, y1 = VY + (H - VY) * p1;
      ctx.strokeStyle = rgba(t.a * Math.min(1, t.z * 2.4) * (.55 + vel));
      ctx.lineWidth = .6 + p1 * 2.2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }

    // dust with depth parallax
    ctx.fillStyle = rgba(1);
    for (const d of dust) {
      d.z += (.015 + vel * .5) * dt; if (d.z > 1) { d.z = 0; d.x = Math.random() * 2 - 1; d.y = Math.random() * 2 - 1; }
      const p = proj(d.z), x = VX + d.x * W * .75 * p, y = VY + d.y * H * .7 * p;
      if (x < 0 || x > W || y < 0 || y > H) continue;
      ctx.globalAlpha = Math.min(.55, p * .9); ctx.beginPath(); ctx.arc(x, y, d.r * (.4 + p * 1.6), 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- scenes + HUD ---- */
  const hud = document.createElement("div"); hud.className = "hud";
  hud.innerHTML = 'SCENE <b id="hud-n">Threshold</b><br>DISTANCE <b id="hud-d">000</b> M';
  const gate = document.createElement("div"); gate.className = "gate";
  document.body.append(hud, gate);
  const hn = hud.querySelector("#hud-n"), hd = hud.querySelector("#hud-d");
  let sceneId = "";
  const setScene = (id) => {
    const s = SCENES[id]; if (!s || id === sceneId) return;
    const first = !sceneId; sceneId = id;
    tgt = [...s.c]; fogT = s.fog; vxt = SHIFT[id] || 0; hn.textContent = s.name;
    document.body.dataset.scene = id;
    if (!first && !reduce) { gate.classList.remove("go"); void gate.offsetWidth; gate.classList.add("go"); }
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setScene(e.target.id)), { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
  setScene("home");
  addEventListener("eclipse:ready", () => hud.classList.add("on"));
  setTimeout(() => hud.classList.add("on"), 5000);

  /* ---- loop ---- */
  let last = performance.now(), run = true, hudT = 0;
  const frame = (now) => {
    if (!run) return;
    const dt = Math.min((now - last) / 1000, .05); last = now;
    sp = clamp(scrollY / max(), 0, 1);
    vxo += (vxt - vxo) * (1 - Math.exp(-dt * 1.4)); VX = W / 2 + vxo * W;
    const dy = Math.abs(scrollY - lastY); lastY = scrollY;
    dist += dy;
    vel += (clamp(dy / (dt * 1000 + 1) * .5, 0, 1.4) - vel) * (1 - Math.exp(-dt * 6));
    for (let i = 0; i < 3; i++) cur[i] = lerp(cur[i], tgt[i], 1 - Math.exp(-dt * 1.6));
    const fogNow = lerp(parseFloat(getComputedStyle(root).getPropertyValue("--fog")) || .5, fogT, .04);
    hudT += dt;
    if (hudT > .12) { hudT = 0; root.style.setProperty("--scene", `${cur[0] | 0},${cur[1] | 0},${cur[2] | 0}`); root.style.setProperty("--fog", fogNow.toFixed(3)); hd.textContent = String(Math.round(dist / 12)).padStart(3, "0"); }
    draw(dt);
    requestAnimationFrame(frame);
  };
  document.addEventListener("visibilitychange", () => { run = !document.hidden && !reduce; if (run) { last = performance.now(); requestAnimationFrame(frame); } });
  if (reduce) { draw(0, true); hud.classList.add("on"); } else requestAnimationFrame(frame);
})();
