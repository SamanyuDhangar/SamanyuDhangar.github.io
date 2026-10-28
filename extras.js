/* PROJECT : ECLIPSE — surprise features
   • Command palette   Ctrl/⌘ + K  or  /   — jump anywhere, open links, run actions
   • Colour themes     4 palettes; the whole site and the background re-colour live
   • Ambient sound     a soft generated drone (off by default, one click)
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
    if (announce) toast(`theme → ${t.n}`);
  }
  function nextTheme() { themeIx = (themeIx + 1) % THEMES.length; applyTheme(themeIx, true); return THEMES[themeIx].n; }

  // a saved theme is applied once the loader is gone, so the loader keeps its own look
  if (themeIx > 0) {
    let done = false;
    const go = () => { if (!done) { done = true; applyTheme(themeIx, false); } };
    addEventListener("eclipse:ready", go);
    setTimeout(go, 6500);
  }

  /* ================================ SOUND ============================== */
  let ctx = null, master = null, voices = [], pingTimer = 0, soundOn = false;
  function soundStart() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { toast("audio is not supported in this browser"); return false; }
    ctx = ctx || new AC();
    ctx.resume();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.frequency.value = 380; filt.Q.value = 2;
    filt.connect(master);
    voices = [[55, "sine", 0.5], [82.41, "sine", 0.28], [110.6, "triangle", 0.16], [164.8, "sine", 0.07]].map(([f, type, g]) => {
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = type; o.frequency.value = f; gn.gain.value = g;
      o.connect(gn); gn.connect(filt); o.start();
      return o;
    });
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 150;
    lfo.connect(lg); lg.connect(filt.frequency); lfo.start();
    voices.push(lfo);
    master.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 3);
    const ping = () => {
      if (!soundOn) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = [659.3, 783.99, 880, 987.8][(Math.random() * 4) | 0];
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.6);
      o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 2.7);
      pingTimer = setTimeout(ping, 8000 + Math.random() * 8000);
    };
    pingTimer = setTimeout(ping, 5000);
    return true;
  }
  function soundStop() {
    clearTimeout(pingTimer);
    if (!ctx || !master) return;
    const m = master, vs = voices;
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
    m.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    setTimeout(() => { vs.forEach((o) => { try { o.stop(); } catch (e) { /* already stopped */ } }); m.disconnect(); }, 1200);
    voices = []; master = null;
  }
  function toggleSound() {
    if (soundOn) { soundOn = false; soundStop(); }
    else { soundOn = soundStart(); }
    const b = $("#dock-sound");
    if (b) { b.setAttribute("aria-pressed", String(soundOn)); $("span", b).textContent = soundOn ? "SOUND ON" : "SOUND"; }
    toast(soundOn ? "ambient sound on" : "ambient sound off");
  }

  /* ============================== CINEMA =============================== */
  function cinema(on) {
    const next = typeof on === "boolean" ? on : !root.classList.contains("cinema");
    root.classList.toggle("cinema", next);
    if (next) setTimeout(() => addEventListener("pointerdown", exitCinema, { once: true, capture: true }), 400);
  }
  function exitCinema(e) {
    if (e && e.target && e.target.closest && e.target.closest(".dock")) return;   // dock button handles itself
    root.classList.remove("cinema");
  }

  /* ============================== MATRIX =============================== */
  let matrixBusy = false;
  function matrix() {
    toast("ROOT ACCESS GRANTED");
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
  const SECTIONS = [["home", "Home"], ["about", "About"], ["mission", "Mission"], ["skills", "Skills"], ["journey", "Journey"], ["projects", "Projects"], ["certifications", "Credentials"], ["shell", "Shell"], ["lab", "Lab"], ["contact", "Contact"]];
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
    const openPal = () => { lastFocus = document.activeElement; wrap.classList.add("open"); input.value = ""; filter(); setTimeout(() => input.focus(), 30); };
    const closePal = () => { wrap.classList.remove("open"); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); };
    const run = (it) => { closePal(); setTimeout(it.run, 120); };

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
      navigator.clipboard.writeText(v).then(() => toast("hash copied"), () => toast("couldn't copy"));
    });
  }

  /* ================================ INIT =============================== */
  window.eclipseFx = { nextTheme, cinema, matrix, toggleSound };
  initDock(initPalette());
  initSecrets();
  initPassword();
  initHash();
})();
