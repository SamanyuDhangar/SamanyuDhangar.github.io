/* MAZE LAYER — travel between chambers, minimap, hub, secure channel, mini Ultron AI */
(() => {
  "use strict";
  const $ = (s, p = document) => p.querySelector(s), $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const root = document.documentElement, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js-maze");
  const fx = () => window.eclipseFx || {};
  const CH = [
    ["home", "00", "THRESHOLD", "Where the journey starts.", ""],
    ["about", "01", "SIGNAL", "Who is behind the system.", "L"],
    ["mission", "02", "TARGET LOCK", "Aspiring AI + cloud security engineer.", "R"],
    ["skills", "03", "ORBIT MAP", "Networking, Linux, security, dev.", "L"],
    ["journey", "04", "LONG ROAD", "Milestones so far.", "R"],
    ["projects", "05", "LABORATORY", "Labs, tools and builds.", "D"],
    ["certifications", "06", "VAULT", "Verified credentials.", "L"],
    ["shell", "07", "TERMINAL", "Talk to the system.", "R"],
    ["contact", "08", "HORIZON", "Open a secure channel.", "D"]
  ];
  const SAY = {
    home: "Visitor detected. Welcome to the system.", about: "Profile file decrypted. Samanyu is the architect here.",
    mission: "Target locked: AI and cloud security.", skills: "Skill orbits stable. Every node is learning.",
    journey: "The long road. Each step is logged.", projects: "Laboratory access granted. Handle with curiosity.",
    certifications: "Credentials verified. Proof, not promises.", shell: "Terminal online. Type help.", contact: "Horizon reached. Open a channel."
  };

  /* chambers: entry direction, location tags, Ultron icons */
  const ICO = '<svg class="ult-ico" viewBox="0 0 100 100"><path d="M50 8 82 24v34L50 92 18 58V24z" fill="#0a1218" stroke="currentColor" stroke-width="5"/><path d="M30 44h40l-6 10H36z" fill="#ff4d5e"/></svg>';
  CH.forEach(([id, n, name, , dir]) => {
    const s = document.getElementById(id); if (!s) return;
    if (dir) s.dataset.dir = dir;
    const h = $(".section-heading h2", s);
    if (h) { h.insertAdjacentHTML("afterbegin", ICO); s.querySelector(".section-heading").insertAdjacentHTML("afterbegin", `<span class="loc-tag">LOCATION ${n} // ${name}</span>`); }
  });

  /* travel: warp overlay + smooth scroll */
  const warp = document.createElement("div"); warp.className = "warp"; document.body.appendChild(warp);
  let busy = false;
  function travel(id, say) {
    const el = document.getElementById(id); if (!el || busy) return;
    const c = CH.find((x) => x[0] === id);
    if (reduce) { el.scrollIntoView(); return; }
    busy = true; closeAll();
    warp.innerHTML = `<b>ENTERING ${c ? c[2] : id.toUpperCase()}</b>`; warp.classList.add("go");
    fx().sfx && fx().sfx("whoosh");
    setTimeout(() => { el.scrollIntoView({ behavior: "auto" }); }, 450);
    setTimeout(() => { warp.classList.remove("go"); busy = false; talk(say || SAY[id]); }, 950);
  }

  /* minimap maze */
  const mm = document.createElement("div"); mm.className = "mmap";
  const pts = CH.map((_, i) => { const row = Math.floor(i / 3), col = i % 3; return [14 + (row % 2 ? 2 - col : col) * 46, 14 + row * 40]; });
  mm.innerHTML = `<svg viewBox="0 0 120 100"><path id="mp" d="M${pts.map((p) => p.join(" ")).join(" L")}"/><path id="mpd" class="done" d="M${pts[0].join(" ")}"/>${pts.map((p, i) => `<circle class="n" data-id="${CH[i][0]}" cx="${p[0]}" cy="${p[1]}" r="5"><title>${CH[i][2]}</title></circle>`).join("")}<circle class="me" r="3.2" cx="${pts[0][0]}" cy="${pts[0][1]}"/></svg><div id="mm-n">00 // THRESHOLD</div>`;
  document.body.appendChild(mm);
  mm.addEventListener("click", (e) => { const n = e.target.closest(".n"); if (n) travel(n.dataset.id); });
  const me = $(".me", mm), done = $("#mpd", mm), label = $("#mm-n", mm), full = $("#mp", mm);
  const secs = CH.map((c) => document.getElementById(c[0]));
  function sync() {
    let cur = 0; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .5) cur = i; });
    const a = secs[cur], b = secs[cur + 1] || a;
    const ra = a.getBoundingClientRect(), t = b === a ? 0 : Math.min(1, Math.max(0, -ra.top / Math.max(1, ra.height)));
    const p = pts[cur], q = pts[Math.min(cur + 1, pts.length - 1)];
    me.setAttribute("cx", p[0] + (q[0] - p[0]) * t); me.setAttribute("cy", p[1] + (q[1] - p[1]) * t);
    done.setAttribute("d", "M" + pts.slice(0, cur + 1).map((x) => x.join(" ")).join(" L") + ` L${me.getAttribute("cx")} ${me.getAttribute("cy")}`);
    $$(".n", mm).forEach((n, i) => n.classList.toggle("on", i <= cur));
    label.textContent = `${CH[cur][1]} // ${CH[cur][2]}`;
    if (CH[cur][0] !== lastSec) { lastSec = CH[cur][0]; if (started) talk(SAY[lastSec]); moveUltron(cur); }
  }
  let lastSec = "", started = false, tick = false;
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; sync(); }); } }, { passive: true });

  /* mini Ultron drone — floats along the screen edge as you move through the maze */
  const U = document.createElement("div"); U.className = "ultron"; U.setAttribute("role", "button"); U.setAttribute("aria-label", "Mini Ultron assistant: click to talk");
  U.innerHTML = '<div class="say"></div><svg viewBox="0 0 100 100"><g class="ring"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 7" color="#6dffb3" style="stroke:var(--ua)"/></g><path d="M50 12 78 26v30L50 86 22 56V26z" fill="#0b141b" stroke="#9fb4bf" stroke-width="3"/><path d="M50 12v22M22 26l28 8 28-8" stroke="#40525c" stroke-width="2" fill="none"/><path class="eye" d="M31 44h14l-3 8H34zM55 44h14l-3 8H58z"/><path d="M40 66h20" stroke="#ff4d5e" stroke-width="2.4" stroke-linecap="round"/></svg>';
  document.body.appendChild(U);
  const say = $(".say", U); let talkT = 0;
  const LINES = ["Scanning visitor. Curiosity level: high.", "Every chamber hides a secret. Keep moving.", "Press the sound button for my full voice.", "Try the terminal. Type help.", "Samanyu builds. I observe."];
  function talk(t) {
    if (!t) return; say.textContent = t; U.classList.add("talk"); clearTimeout(talkT); talkT = setTimeout(() => U.classList.remove("talk"), 4200);
    if (fx().soundOn && fx().soundOn() && "speechSynthesis" in window) {
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.pitch = .1; u.rate = .82; u.volume = 1;
        const v = speechSynthesis.getVoices().filter((x) => /en/i.test(x.lang)); const m = v.find((x) => /male|david|daniel|alex|google uk english male|fred/i.test(x.name)) || v[0]; if (m) u.voice = m;
        fx().sfx && fx().sfx("blip"); speechSynthesis.speak(u); } catch (e) { /* voice unavailable */ }
    }
  }
  function moveUltron(i) { const left = i % 2 === 1; U.style.right = left ? "calc(100% - 96px)" : "22px"; U.style.bottom = (92 + (i % 3) * 120) + "px"; if (innerWidth < 760) { U.style.right = "10px"; } }
  U.addEventListener("click", () => { talk(LINES[(Math.random() * LINES.length) | 0]); });

  /* hub (ENTER SYSTEM) and secure channel (CONNECT) */
  function overlay(cls, inner) {
    const w = document.createElement("div"); w.className = "hubwrap " + cls; w.innerHTML = `<div class="hub" role="dialog" aria-modal="true">${inner}<button class="x" type="button">[ CLOSE ]</button></div>`;
    document.body.appendChild(w); w.addEventListener("pointerdown", (e) => { if (e.target === w || e.target.classList.contains("x")) closeAll(); }); return w;
  }
  const hub = overlay("hub-w", `<h3>MAZE MAP // CHOOSE A CHAMBER</h3><p class="sub">The system is a labyrinth. Pick a door, or let me guide you.</p><div class="hub-grid">${CH.slice(1).map((c, i) => `<button type="button" data-id="${c[0]}" style="animation-delay:${i * 70}ms">${c[1]} // ${c[2]}<small>${c[3]}</small></button>`).join("")}</div><button class="tour" type="button">▶ AUTO-TOUR WITH ULTRON</button>`);
  const chan = overlay("chan", `<h3>SECURE CHANNEL // OPEN</h3><p class="sub">Encrypted link established. Choose a route to Samanyu.</p><div class="hub-grid">${[["GITHUB", "Code and projects", "https://github.com/SamanyuDhangar"], ["LINKEDIN", "Professional profile", "https://www.linkedin.com/in/samanyu-dhangar-191529413/"], ["TRYHACKME", "Labs and rooms", "https://tryhackme.com/p/NatsukiSubaru"], ["EMAIL", "Send a message", "mailto:00natsukisubaru@proton.me"]].map((l, i) => `<a href="${l[2]}" ${l[2].startsWith("http") ? 'target="_blank" rel="noopener"' : ""} style="animation-delay:${i * 90}ms">${l[0]} ↗<small>${l[1]}</small></a>`).join("")}</div>`);
  hub.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) travel(b.dataset.id); else if (e.target.closest(".tour")) tour(); });
  function closeAll() { hub.classList.remove("open"); chan.classList.remove("open"); }
  function open(w, line) { started = true; const f = fx(); if (f.autoSound) f.autoSound(); w.classList.add("open"); f.sfx && f.sfx("open"); setTimeout(() => talk(line), 500); }
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
  $$('a[href="#projects"].btn-primary').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(hub, "Maze map online. Choose a chamber, visitor."); }));
  $$('.hero-actions a[href="#contact"]').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(chan, "Secure channel open. Speak freely."); }));

  /* auto tour: Ultron flies through every chamber */
  function tour() {
    closeAll(); let i = 1;
    const step = () => { if (i >= CH.length) return; const id = CH[i++][0]; travel(id); setTimeout(step, 5200); };
    step();
  }

  addEventListener("eclipse:ready", () => { started = true; sync(); setTimeout(() => talk(SAY.home), 900); });
  sync();
})();
