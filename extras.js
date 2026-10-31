/* PROJECT : ECLIPSE — surprise features
   • Command palette   Ctrl/⌘ + K  or  /   — jump anywhere, open links, run actions
   • Colour themes     4 palettes; the whole site and the background re-colour live
   • Sound             evolving ambient music + click/hover/open sounds (off by default)
   • Cinema mode       V — hide the interface and just watch the sky
   • Root access       Konami code, `matrix` in the shell, or click the logo 5 times
   • Lab               password strength estimator + hash generator (all local)
   Nothing here touches the background's behaviour with the cursor or scroll. */
(() => {
  "use strict";

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const isTyping = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };

  let toastTimer = 0;
  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = `// ${msg}`;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* =============================== THEMES ============================== */
  const THEMES = [
    { n: "EMERALD",  a: [109, 255, 179], b: [123, 199, 255], c: [165, 139, 255] },
    { n: "ICE",      a: [96, 220, 255],  b: [130, 160, 255], c: [190, 150, 255] },
    { n: "AMETHYST", a: [190, 150, 255], b: [255, 130, 200], c: [120, 200, 255] },
    { n: "EMBER",    a: [255, 170, 90],  b: [255, 120, 150], c: [255, 215, 120] }
  ];
  const hex = (c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
  let themeIx = Math.max(0, THEMES.findIndex((t) => t.n === store.get("eclipse-theme")));

  function applyTheme(i, announce) {
    const t = THEMES[i];
    root.style.setProperty("--accent", hex(t.a));
    root.style.setProperty("--accent-2", hex(t.b));
    root.style.setProperty("--accent-3", hex(t.c));
    root.style.setProperty("--ab-a", t.a.join(", "));
    root.style.setProperty("--ab-b", t.b.join(", "));
    root.style.setProperty("--ab-c", t.c.join(", "));
    dispatchEvent(new Event("abyss:palette"));
    store.set("eclipse-theme", t.n);
    if (announce) { toast(`theme → ${t.n}`); sfx("theme"); }
  }
  function nextTheme() { themeIx = (themeIx + 1) % THEMES.length; applyTheme(themeIx, true); return THEMES[themeIx].n; }

  // a saved theme is applied once the loader is gone, so the loader keeps its own look
  if (themeIx > 0) {
    let done = false;
    const go = () => { if (!done) { done = true; applyTheme(themeIx, false); } };
    addEventListener("eclipse:ready", go);
    setTimeout(go, 6500);
  }

  /* ================================ SOUND ==============================
     One switch (the SOUND button) turns on two things:
       1. evolving ambient music: pad chords that change, plucked notes with echo,
          a deep bass, slow sweeps. It also brightens as you scroll down the page.
       2. interface sounds: clicks, hovers, opening things, typing, section changes.
     Everything is generated in the browser (no audio files). Off by default. */
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const CHORDS = [
    [45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62],
    [45, 52, 57, 60, 64], [41, 48, 53, 57, 62], [48, 55, 59, 64, 67], [43, 50, 55, 59, 66]
  ];
  let ctx = null, bus = null, musicBus = null, sfxBus = null, noiseBuf = null, soundOn = false;
  let amb = null, energy = 0, scrollP = 0, lastSection = "", hoverEl = null, hoverAt = 0, userScrolled = false;

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();             // keeps loud moments from distorting
    comp.threshold.value = -12; comp.knee.value = 18; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.25;
    bus = ctx.createGain(); bus.gain.value = 0;
    musicBus = ctx.createGain(); musicBus.gain.value = 1.25;
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1.5;
    musicBus.connect(bus); sfxBus.connect(bus); bus.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }
  const panner = (p) => { if (!ctx.createStereoPanner) return null; const n = ctx.createStereoPanner(); n.pan.value = p; return n; };

  /* ---------- sound effects ---------- */
  function tone({ f, f2, type = "sine", a = 0.004, d = 0.12, v = 0.25, at = 0, pan = 0, dest }) {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    o.connect(g);
    const p = pan ? panner(pan) : null;
    if (p) { g.connect(p); p.connect(dest || sfxBus); } else g.connect(dest || sfxBus);
    o.start(t); o.stop(t + a + d + 0.05);
  }
  function noise({ d = 0.05, v = 0.2, f = 4000, f2, type = "highpass", q = 1, at = 0, dest }) {
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf; src.loopStart = 0;
    fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.02, d / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(fl); fl.connect(g); g.connect(dest || sfxBus);
    src.start(t, Math.random()); src.stop(t + d + 0.05);
  }
  const PENT = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7];
  const SFX = {
    hover: () => tone({ f: rnd(1500, 1900), d: 0.035, v: 0.06 }),
    click: () => { tone({ f: 950, f2: 480, type: "triangle", d: 0.08, v: 0.32 }); tone({ f: 1900, d: 0.05, v: 0.12 }); },
    key: () => { noise({ d: 0.03, v: 0.18, f: 2200 }); tone({ f: rnd(1000, 1500), type: "square", d: 0.025, v: 0.05 }); },
    enter: () => { tone({ f: 520, f2: 800, type: "triangle", d: 0.13, v: 0.3 }); tone({ f: 1040, d: 0.22, v: 0.14, at: 0.06 }); },
    open: () => { tone({ f: 260, f2: 1100, d: 0.3, v: 0.24 }); noise({ d: 0.3, v: 0.07, f: 500, f2: 4500, type: "bandpass", q: 2 }); tone({ f: 880, d: 0.6, v: 0.16, at: 0.12 }); tone({ f: 1318.5, d: 0.7, v: 0.12, at: 0.2 }); },
    close: () => { tone({ f: 900, f2: 240, d: 0.22, v: 0.22 }); noise({ d: 0.22, v: 0.05, f: 3000, f2: 400, type: "bandpass", q: 2 }); },
    chime: () => { const i = (Math.random() * 5) | 0; tone({ f: PENT[i], type: "sine", d: 0.9, v: 0.2 }); tone({ f: PENT[i + 2], type: "sine", d: 1.1, v: 0.14, at: 0.11 }); tone({ f: PENT[i] * 2.01, d: 0.5, v: 0.05 }); },
    theme: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => tone({ f, type: "triangle", d: 0.28, v: 0.22, at: k * 0.07 })),
    whoosh: () => { noise({ d: 0.9, v: 0.32, f: 250, f2: 5000, type: "bandpass", q: 1.4 }); tone({ f: 120, f2: 60, d: 0.7, v: 0.25 }); },
    level: () => tone({ f: 420 + rnd(0, 500), type: "triangle", d: 0.09, v: 0.16 }),
    power: () => {
      tone({ f: 90, f2: 32, d: 1.4, v: 0.55 });
      noise({ d: 1.2, v: 0.3, f: 200, f2: 6000, type: "bandpass", q: 1.2 });
      [783.99, 659.25, 523.25, 392, 329.63, 261.63].forEach((f, k) => tone({ f, type: "sawtooth", d: 0.35, v: 0.12, at: 0.15 + k * 0.1 }));
    },
    on: () => [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, k) => tone({ f, type: "triangle", d: 0.5, v: 0.24, at: k * 0.09 }))
  };
  Object.assign(SFX, {
    hover: () => tone({ f: rnd(2200, 3200), type: "square", d: 0.03, v: 0.05 }),
    click: () => { tone({ f: 880, type: "square", d: 0.05, v: 0.2 }); tone({ f: 1320, type: "square", d: 0.07, v: 0.16, at: 0.06 }); },
    chime: () => [0, 0.09, 0.18].forEach((a, k) => tone({ f: [660, 990, 1485][k], type: "sawtooth", d: 0.08, v: 0.14, at: a })),
    open: () => { tone({ f: 90, f2: 900, type: "sawtooth", d: 0.5, v: 0.22 }); noise({ d: 0.5, v: 0.1, f: 400, f2: 5000, type: "bandpass", q: 3 }); },
    on: () => { tone({ f: 55, f2: 440, type: "sawtooth", d: 1.1, v: 0.4 }); [440, 660, 880].forEach((f, k) => tone({ f, type: "square", d: 0.15, v: 0.16, at: 0.5 + k * 0.12 })); },
    blip: () => { tone({ f: 1200, f2: 600, type: "square", d: 0.06, v: 0.14 }); tone({ f: 600, f2: 1200, type: "square", d: 0.06, v: 0.12, at: 0.07 }); }
  });
  function sfx(name) { if (soundOn && ctx && SFX[name]) { try { SFX[name](); } catch (e) { /* audio hiccup */ } } }

  /* ---------- ambient music ---------- */
  function ambStart() {
    /* ROBOTIC CIVILIZATION: sub drone, ring-modulated metal, bit-crushed saw sequencer, machine kick, talking-robot formants */
    const A = { timers: [], osc: [], alive: true, step: 0 };
    const sat = ctx.createWaveShaper(), curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 3.4);
    sat.curve = curve; sat.connect(musicBus);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700; lp.Q.value = 7; lp.connect(sat); A.filter = lp;
    const start = (o) => { o.start(); A.osc.push(o); return o; };
    [[55, "sawtooth", 0.2], [55.5, "square", 0.1], [27.5, "sine", 0.55]].forEach(([f, t, g]) => {
      const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = t; o.frequency.value = f; gn.gain.value = g; o.connect(gn); gn.connect(lp); start(o);
    });
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 380; lfo.connect(lg); lg.connect(lp.frequency); start(lfo);
    const car = ctx.createOscillator(), rm = ctx.createGain(), mod = ctx.createOscillator(), rg = ctx.createGain();
    car.type = "sawtooth"; car.frequency.value = 110; rm.gain.value = 0; mod.frequency.value = 37; rg.gain.value = 0.14;
    mod.connect(rm.gain); car.connect(rm); rm.connect(rg); rg.connect(sat); start(car); start(mod);
    const SCALE = [45, 46, 48, 50, 52, 53, 55, 57];
    const seq = () => {
      if (!A.alive) return;
      const i = A.step++;
      if (i % 4 === 0) tone({ f: 130, f2: 36, d: 0.3, v: 0.8, dest: musicBus });
      if (i % 2 === 1) noise({ d: 0.04, v: 0.14, f: 7500, dest: musicBus });
      if (i % 16 === 10) { tone({ f: rnd(280, 520), type: "square", d: 0.2, v: 0.14, dest: sat }); noise({ d: 0.18, v: 0.1, f: 1800, f2: 400, type: "bandpass", q: 6, dest: musicBus }); }
      if (Math.random() < 0.72) {
        const m = SCALE[(Math.random() * SCALE.length) | 0] + (Math.random() < 0.35 ? 12 : 24);
        tone({ f: mtof(m), type: "sawtooth", a: 0.002, d: 0.14, v: 0.2 + energy * 0.1, dest: lp });
      }
      A.timers.push(setTimeout(seq, 148 - scrollP * 22));
    };
    const babble = () => {                      // a talking-robot formant voice
      if (!A.alive) return;
      const t0 = ctx.currentTime, n = 5 + ((Math.random() * 5) | 0), o = ctx.createOscillator(), g = ctx.createGain();
      const f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(); f1.type = f2.type = "bandpass"; f1.Q.value = f2.Q.value = 7;
      o.type = "sawtooth"; o.frequency.value = rnd(62, 85); g.gain.value = 0.0001;
      o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(sat);
      for (let k = 0; k < n; k++) {
        const t = t0 + k * 0.16;
        f1.frequency.setValueAtTime(rnd(300, 900), t); f2.frequency.setValueAtTime(rnd(1100, 2600), t);
        g.gain.setValueAtTime(0.5, t); g.gain.linearRampToValueAtTime(0.08, t + 0.14);
      }
      g.gain.linearRampToValueAtTime(0.0001, t0 + n * 0.16 + 0.1); o.start(t0); o.stop(t0 + n * 0.16 + 0.2);
      A.timers.push(setTimeout(babble, rnd(9000, 17000)));
    };
    A.timers.push(setTimeout(seq, 400), setTimeout(babble, 4000));
    return A;
  }
  function ambStop() {
    const A = amb; amb = null;
    if (!A) return;
    A.alive = false;
    A.timers.forEach(clearTimeout);
    setTimeout(() => A.osc.forEach((o) => { try { o.stop(); } catch (e) { /* already stopped */ } }), 1500);
  }
  function ambMood() {                       // the music opens up as you scroll or when something exciting happens
    if (!amb) return;
    amb.filter.frequency.setTargetAtTime(520 + scrollP * 2200 + energy * 1800, ctx.currentTime, 0.6);
  }
  function boost(sec) { energy = 1; ambMood(); setTimeout(() => { energy = 0; ambMood(); }, sec * 1000); }

  function toggleSound() {
    const b = $("#dock-sound");
    if (!soundOn) {
      if (!ensureCtx()) { toast("audio is not supported in this browser"); return false; }
      ctx.resume();
      soundOn = true;
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
      bus.gain.linearRampToValueAtTime(1.5, ctx.currentTime + 1.5);
      amb = ambStart();
      sfx("on");
      store.set("eclipse-sound", "on"); toast("sound on — robotic music + Ultron voice");
    } else {
      soundOn = false;
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime);
      bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      ambStop();
      store.set("eclipse-sound", "off"); try { speechSynthesis.cancel(); } catch (x) { /* none */ } toast("sound off");
    }
    if (b) { b.setAttribute("aria-pressed", String(soundOn)); $("span", b).textContent = soundOn ? "SOUND ON" : "SOUND"; }
    return soundOn;
  }

  function initSound() {
    const INTERACTIVE = "a, button, .tab, summary, [role=button], select, label[for]";
    addEventListener("pointerdown", (e) => {
      if (!soundOn || !e.target.closest) return;
      const t = e.target.closest(INTERACTIVE);
      if (t) sfx(t.matches("a[target=_blank]") ? "open" : "click");
    }, true);
    addEventListener("pointerover", (e) => {
      if (!soundOn || e.pointerType !== "mouse" || !e.target.closest) return;
      const t = e.target.closest(INTERACTIVE + ", .project-card, .skill-card, .timeline-item");
      const now = performance.now();
      if (t && t !== hoverEl && now - hoverAt > 70) { sfx("hover"); hoverAt = now; }
      hoverEl = t;
    });
    const sh = $("#shell-in");
    if (sh) sh.addEventListener("keydown", (e) => { if (e.key === "Enter") sfx("enter"); else if (e.key.length === 1 || e.key === "Backspace") sfx("key"); });
    ["#pw-in", "#hash-in"].forEach((q) => { const el = $(q); if (el) el.addEventListener("input", () => sfx("key")); });

    // a soft chime whenever you arrive at a new section
    let tick = 0;
    addEventListener("scroll", () => {
      userScrolled = true;
      if (tick) return;
      tick = setTimeout(() => {
        tick = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        scrollP = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
        ambMood();
      }, 150);
    }, { passive: true });
    if ("IntersectionObserver" in window) {
      let lastAt = 0;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting || !userScrolled || en.target.id === lastSection) return;
          lastSection = en.target.id;
          const now = performance.now();
          if (now - lastAt > 700) { sfx("chime"); lastAt = now; }
        });
      }, { rootMargin: "-48% 0px -48% 0px" });
      $$("main section[id], header#home, #home").forEach((s) => io.observe(s));
    }
  }

  /* ============================== CINEMA =============================== */
  function cinema(on) {
    const next = typeof on === "boolean" ? on : !root.classList.contains("cinema");
    root.classList.toggle("cinema", next);
    sfx("whoosh");
    if (next) setTimeout(() => addEventListener("pointerdown", exitCinema, { once: true, capture: true }), 400);
  }
  function exitCinema(e) {
    if (e && e.target && e.target.closest && e.target.closest(".dock")) return;   // dock button handles itself
    root.classList.remove("cinema");
    sfx("whoosh");
  }

  /* ============================== MATRIX =============================== */
  let matrixBusy = false;
  function matrix() {
    toast("ROOT ACCESS GRANTED");
    sfx("power"); boost(7);
    if (reduce || matrixBusy) return;
    matrixBusy = true;
    const cv = document.createElement("canvas");
    cv.className = "matrix";
    cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv);
    const g = cv.getContext("2d");
    const W = (cv.width = innerWidth), H = (cv.height = innerHeight);
    const FS = 16, cols = Math.ceil(W / FS);
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    const chars = "01アイウエオカキクケコサシスセソ<>/{}#$%&*ABCDEF";
    const col = getComputedStyle(root).getPropertyValue("--accent").trim() || "#6dffb3";
    g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    requestAnimationFrame(() => cv.classList.add("on"));
    let t0 = performance.now(), last = 0;
    const loop = (now) => {
      if (now - t0 > 6500) {
        cv.classList.remove("on");
        setTimeout(() => { cv.remove(); matrixBusy = false; }, 700);
        return;
      }
      requestAnimationFrame(loop);
      if (now - last < 45) return;
      last = now;
      g.fillStyle = "rgba(0,0,0,.09)"; g.fillRect(0, 0, W, H);
      g.fillStyle = col; g.font = `${FS}px "JetBrains Mono", monospace`;
      for (let i = 0; i < cols; i++) {
        g.fillText(chars[(Math.random() * chars.length) | 0], i * FS, drops[i] * FS);
        if (drops[i] * FS > H && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    requestAnimationFrame(loop);
  }

  /* ============================ COMMAND PALETTE ======================== */
  const SECTIONS = [["home", "Home"], ["about", "About"], ["mission", "Mission"], ["skills", "Skills"], ["journey", "Journey"], ["projects", "Projects"], ["certifications", "Credentials"], ["shell", "Shell"], ["contact", "Contact"]];
  const goto = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); };
  const open = (url) => window.open(url, "_blank", "noopener");

  function buildItems() {
    const items = SECTIONS.map(([id, label]) => ({ label: `Go to ${label}`, tag: "SECTION", run: () => goto(id) }));
    items.push(
      { label: "Open GitHub", tag: "LINK", run: () => open("https://github.com/SamanyuDhangar") },
      { label: "Open LinkedIn", tag: "LINK", run: () => open("https://www.linkedin.com/in/samanyu-dhangar-191529413/") },
      { label: "Open EyesOfTruth", tag: "LINK", run: () => open("https://eyesoftruth.onrender.com/") }
    );
    $$("a.credential-code[href]").forEach((a) => {
      const title = $("h3", a.closest(".credential-item"));
      items.push({ label: `View certificate — ${title ? title.textContent : "TryHackMe"}`, tag: "LINK", run: () => open(a.href) });
    });
    items.push(
      { label: "Cycle colour theme", tag: "ACTION", run: nextTheme },
      { label: "Toggle ambient sound", tag: "ACTION", run: toggleSound },
      { label: "Cinema mode — hide the UI", tag: "ACTION", run: () => cinema(true) },
      { label: "Root access (matrix)", tag: "SECRET", run: matrix },
      { label: "Copy link to this page", tag: "ACTION", run: () => { (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => toast("link copied"), () => toast("couldn't copy — copy it from the address bar")); } }
    );
    return items;
  }

  function initPalette() {
    const items = buildItems();
    const wrap = document.createElement("div");
    wrap.className = "pal";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Command palette");
    wrap.innerHTML = '<div class="pal-box"><input class="pal-in" type="text" autocomplete="off" spellcheck="false" placeholder="type a command…" aria-label="Search commands"><ul class="pal-list" role="listbox"></ul><div class="pal-foot"><span>↑↓ move</span><span>↵ run</span><span>esc close</span></div></div>';
    document.body.appendChild(wrap);
    const input = $(".pal-in", wrap), list = $(".pal-list", wrap);
    let shown = [], sel = 0, lastFocus = null;

    const render = () => {
      list.innerHTML = "";
      if (!shown.length) { list.innerHTML = '<li class="pal-empty" aria-disabled="true">no match</li>'; return; }
      shown.forEach((it, i) => {
        const li = document.createElement("li");
        li.setAttribute("role", "option");
        if (i === sel) li.className = "sel";
        const a = document.createElement("span"), b = document.createElement("small");
        a.textContent = it.label; b.textContent = it.tag;
        li.append(a, b);
        li.addEventListener("click", () => run(it));
        li.addEventListener("mousemove", () => { if (sel !== i) { sel = i; $$("li", list).forEach((n, k) => n.classList.toggle("sel", k === i)); } });
        list.appendChild(li);
      });
      const cur = $(".sel", list); if (cur) cur.scrollIntoView({ block: "nearest" });
    };
    const filter = () => {
      const q = input.value.trim().toLowerCase();
      shown = q ? items.filter((it) => (it.label + " " + it.tag).toLowerCase().includes(q)) : items.slice();
      sel = 0; render();
    };
    const openPal = () => { sfx("open"); lastFocus = document.activeElement; wrap.classList.add("open"); input.value = ""; filter(); setTimeout(() => input.focus(), 30); };
    const closePal = (quiet) => { if (quiet !== true) sfx("close"); wrap.classList.remove("open"); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); };
    const run = (it) => { closePal(true); sfx("enter"); setTimeout(it.run, 120); };

    input.addEventListener("input", filter);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
      else if (e.key === "Enter") { e.preventDefault(); if (shown[sel]) run(shown[sel]); }
      else if (e.key === "Tab") e.preventDefault();                 // keep focus inside the dialog
    });
    wrap.addEventListener("pointerdown", (e) => { if (e.target === wrap) closePal(); });

    addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "k") { e.preventDefault(); wrap.classList.contains("open") ? closePal() : openPal(); }
      else if (e.key === "Escape") { if (wrap.classList.contains("open")) closePal(); else if (root.classList.contains("cinema")) cinema(false); }
      else if (!isTyping(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "/") { e.preventDefault(); openPal(); }
        else if (k === "v") cinema();
      }
    });
    return openPal;
  }

  /* ================================ DOCK =============================== */
  function initDock(openPal) {
    const mac = /Mac|iPhone|iPad/.test(navigator.platform || "");
    const d = document.createElement("div");
    d.className = "dock";
    d.setAttribute("role", "toolbar");
    d.setAttribute("aria-label", "Site tools");
    d.innerHTML =
      `<button type="button" id="dock-cmd" aria-label="Open command palette"><b>⌕</b><span>COMMANDS</span><kbd>${mac ? "⌘K" : "CTRL K"}</kbd></button>` +
      '<button type="button" id="dock-theme" aria-label="Change colour theme"><i class="swatch"></i><span>THEME</span></button>' +
      '<button type="button" id="dock-sound" aria-label="Toggle ambient sound" aria-pressed="false"><b>♪</b><span>SOUND</span></button>' +
      '<button type="button" id="dock-view" aria-label="Cinema mode: hide the interface"><b>◎</b><span>VIEW</span></button>';
    document.body.appendChild(d);
    const hint = document.createElement("div");
    hint.className = "cinema-hint";
    hint.textContent = "CLICK ANYWHERE OR PRESS ESC TO RETURN";
    document.body.appendChild(hint);
    $("#dock-cmd").addEventListener("click", openPal);
    $("#dock-theme").addEventListener("click", nextTheme);
    $("#dock-sound").addEventListener("click", toggleSound);
    $("#dock-view").addEventListener("click", () => cinema());
  }

  /* ============================== ROOT ACCESS ========================== */
  function initSecrets() {
    const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    let pos = 0;
    addEventListener("keydown", (e) => {
      if (isTyping(e.target)) return;
      const k = e.key.toLowerCase();
      pos = k === KONAMI[pos] ? pos + 1 : k === KONAMI[0] ? 1 : 0;
      if (pos === KONAMI.length) { pos = 0; matrix(); }
    });
    const brand = $(".brand");
    if (brand) {
      let n = 0, timer = 0;
      brand.addEventListener("click", () => {
        n++; clearTimeout(timer); timer = setTimeout(() => (n = 0), 1500);
        if (n >= 5) { n = 0; matrix(); }
      });
    }
  }

  /* ================================= LAB =============================== */
  function initPassword() {
    const input = $("#pw-in");
    if (!input) return;
    const bar = $("#pw-bar"), verdict = $("#pw-verdict"), ent = $("#pw-ent"), time = $("#pw-time"), pool = $("#pw-pool"), tip = $("#pw-tip"), eye = $("#pw-eye");
    const COMMON = ["password", "123456", "12345678", "qwerty", "letmein", "admin", "welcome", "iloveyou", "monkey", "dragon", "football", "abc123", "111111", "passw0rd", "secret"];
    const SEQ = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop", "asdfghjkl", "zxcvbnm"];
    const LEVELS = [
      [28, "VERY WEAK", "#ff647c"], [36, "WEAK", "#ff9a5c"], [60, "FAIR", "#ffd166"], [80, "STRONG", "#7bc7ff"], [1e9, "EXCELLENT", "#6dffb3"]
    ];

    function fmtTime(sec) {
      if (sec < 1) return "instantly";
      const Y = 31557600;
      const units = [[60, 1, "second"], [3600, 60, "minute"], [86400, 3600, "hour"], [Y, 86400, "day"], [Y * 1e3, Y, "year"], [Y * 1e6, Y * 1e3, "thousand years"], [Y * 1e9, Y * 1e6, "million years"]];
      for (const [lim, div, name] of units) {
        if (sec < lim) { const v = Math.max(1, Math.round(sec / div)); return name.includes(" ") ? `${v} ${name}` : `${v} ${name}${v === 1 ? "" : "s"}`; }
      }
      return "billions of years";
    }

    function analyse(pw) {
      let size = 0;
      if (/[a-z]/.test(pw)) size += 26;
      if (/[A-Z]/.test(pw)) size += 26;
      if (/[0-9]/.test(pw)) size += 10;
      if (/[^a-zA-Z0-9]/.test(pw)) size += 33;
      let bits = pw.length * Math.log2(size || 1);
      const low = pw.toLowerCase();
      if (COMMON.some((c) => low === c || low.replace(/[0-9!@#$%^&*]+$/, "") === c)) bits = Math.min(bits, 12);
      const runs = pw.match(/(.)\1{2,}/g);
      if (runs) bits -= runs.reduce((s, r) => s + 2 * (r.length - 1), 0);
      for (const s of SEQ) for (let i = 0; i + 3 <= low.length; i++) { const part = low.slice(i, i + 3); if (s.includes(part) || [...s].reverse().join("").includes(part)) bits -= 3; }
      return { bits: Math.max(0, bits), size };
    }

    function update() {
      const pw = input.value;
      if (!pw) {
        bar.style.width = "0"; verdict.textContent = "AWAITING INPUT"; verdict.style.removeProperty("--lv");
        ent.textContent = time.textContent = pool.textContent = "—";
        tip.textContent = "A rough estimate: length matters far more than clever symbols.";
        return;
      }
      const { bits, size } = analyse(pw);
      const lv = LEVELS.find((l) => bits < l[0]);
      bar.style.width = `${Math.max(6, Math.min(100, (bits / 90) * 100))}%`;
      bar.parentNode.style.setProperty("--lv", lv[2]);
      bar.style.setProperty("--lv", lv[2]);
      verdict.style.setProperty("--lv", lv[2]);
      if (verdict.textContent !== lv[1]) sfx("level");
      verdict.textContent = lv[1];
      ent.textContent = `${Math.round(bits)} bits`;
      time.textContent = fmtTime(Math.pow(2, bits) / 2 / 1e10);          // average, offline attack at 10 billion guesses/s
      pool.textContent = `${size} symbols · ${pw.length} chars`;
      tip.textContent = bits < 60 ? "Try a longer passphrase of 4+ unrelated words — easier to remember, much harder to crack." : "Nice. Also use a unique password per site and a password manager.";
    }
    input.addEventListener("input", update);
    eye.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      eye.textContent = show ? "HIDE" : "SHOW";
      eye.setAttribute("aria-pressed", String(show));
    });
  }

  function initHash() {
    const input = $("#hash-in");
    if (!input) return;
    const out = $("#hash-out"), algo = $("#hash-algo"), copy = $("#hash-copy");
    let seq = 0;
    async function update() {
      const text = input.value, id = ++seq;
      if (!text) { out.textContent = "—"; return; }
      if (!(window.crypto && crypto.subtle)) { out.textContent = "hashing needs a secure (https) page"; return; }
      try {
        const buf = await crypto.subtle.digest(algo.value, new TextEncoder().encode(text));
        if (id !== seq) return;
        out.textContent = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch (e) { out.textContent = "could not compute hash"; }
    }
    input.addEventListener("input", update);
    algo.addEventListener("change", update);
    copy.addEventListener("click", () => {
      const v = out.textContent;
      if (!v || v === "—" || !navigator.clipboard) return toast("nothing to copy yet");
      navigator.clipboard.writeText(v).then(() => toast("hash copied") || sfx("enter"), () => toast("couldn't copy"));
    });
  }

  /* ================================ INIT =============================== */
  window.eclipseFx = { nextTheme, cinema, matrix, toggleSound, sfx, soundOn: () => soundOn, autoSound: () => { if (!soundOn && store.get("eclipse-sound") !== "off") toggleSound(); } };
  initDock(initPalette());
  initSound();
  initSecrets();
})();
