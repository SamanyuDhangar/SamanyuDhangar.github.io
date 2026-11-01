/* CURVY ROAD LAYER — chambers sway along the road, warp travel, hub, secure channel, Ultron AI guide */
(() => {
  "use strict";
  const $ = (s, p = document) => p.querySelector(s), $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const root = document.documentElement, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js-maze");
  const fx = () => window.eclipseFx || {};
  const CH = [
    ["home", "00", "THRESHOLD", "Where the journey starts.", ""], ["about", "01", "SIGNAL", "Who is behind the system.", "L"],
    ["mission", "02", "TARGET LOCK", "Aspiring AI + cloud security engineer.", "R"], ["skills", "03", "ORBIT MAP", "Networking, Linux, security, dev.", "L"],
    ["journey", "04", "LONG ROAD", "Milestones so far.", "R"], ["projects", "05", "LABORATORY", "Labs, tools and builds.", "D"],
    ["certifications", "06", "VAULT", "Verified credentials.", "L"], ["shell", "07", "TERMINAL", "Talk to the system.", "R"], ["contact", "08", "HORIZON", "Open a secure channel.", "D"]
  ];
  const SAY = { home: "Welcome to the system.", about: "Profile file decrypted.", mission: "Target locked: AI and cloud security.", skills: "Skill orbits stable.", journey: "The long road. Every step is logged.", projects: "Laboratory access granted.", certifications: "Credentials verified.", shell: "Terminal online. Type help.", contact: "Horizon reached. Open a channel." };
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* no storage */ } } };
  const ICO = '<svg class="ult-ico" viewBox="0 0 100 100"><path d="M50 8 82 24v34L50 92 18 58V24z" fill="#0a1218" stroke="currentColor" stroke-width="5"/><path d="M30 44h40l-6 10H36z" fill="#ff4d5e"/></svg>';
  CH.forEach(([id, n, name, , dir]) => {
    const s = document.getElementById(id); if (!s) return; if (dir) s.dataset.dir = dir;
    const sh = $(".section-heading", s), h = sh && $("h2", sh);
    if (h) { h.insertAdjacentHTML("afterbegin", ICO); sh.insertAdjacentHTML("afterbegin", `<span class="loc-tag">LOCATION ${n} // ${name}</span>`); }
  });

  /* ---------- travel ---------- */
  const warp = document.createElement("div"); warp.className = "warp"; document.body.appendChild(warp);
  let busy = false;
  function travel(id, line) {
    const el = document.getElementById(id); if (!el || busy) return;
    const c = CH.find((x) => x[0] === id);
    if (reduce) { el.scrollIntoView(); return; }
    busy = true; closeAll(); M.classList.remove("open");
    warp.innerHTML = `<b>ENTERING ${c ? c[2] : id.toUpperCase()}</b>`; warp.classList.add("go");
    setTimeout(() => el.scrollIntoView({ behavior: "auto" }), 400);
    setTimeout(() => { warp.classList.remove("go"); busy = false; }, 850);
  }

  /* ---------- voice ---------- */
  let voiceOn = store.get("ultron-voice") !== "off", started = false, voices = [];
  const loadVoices = () => { try { voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); } catch (e) { /* none */ } };
  loadVoices(); try { speechSynthesis.addEventListener("voiceschanged", loadVoices); } catch (e) { /* none */ }
  function speak(t) {
    if (!voiceOn || !started || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(t); u.pitch = .55; u.rate = .9; u.volume = 1;
        const v = voices.find((x) => /male|david|daniel|alex|fred|mark|google uk english male/i.test(x.name)) || voices[0]; if (v) u.voice = v;
        speechSynthesis.speak(u);
      }, 80);
    } catch (e) { /* voice unavailable */ }
  }
  addEventListener("pointerdown", () => { started = true; }, { once: true });

  /* ---------- Ultron: fixed in place ---------- */
  const U = document.createElement("div"); U.className = "ultron"; U.setAttribute("role", "button"); U.setAttribute("aria-label", "Ultron assistant: click to chat");
  U.innerHTML = '<div class="say"></div><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke-width="1.2" stroke-dasharray="4 7" style="stroke:var(--ua)"/><path d="M50 12 78 26v30L50 86 22 56V26z" fill="#0b141b" stroke="#9fb4bf" stroke-width="3"/><path d="M50 12v22M22 26l28 8 28-8" stroke="#40525c" stroke-width="2" fill="none"/><path class="eye" d="M31 44h14l-3 8H34zM55 44h14l-3 8H58z"/><path d="M40 66h20" stroke="#ff4d5e" stroke-width="2.4" stroke-linecap="round"/></svg>';
  document.body.appendChild(U);
  const bubble = $(".say", U); let bT = 0;
  function say(t, ms = 8000) { bubble.textContent = t; U.classList.add("talk"); clearTimeout(bT); bT = setTimeout(() => U.classList.remove("talk"), ms); }

  /* ---------- chat menu ---------- */
  const M = document.createElement("div"); M.className = "umenu";
  const chips = [["tour", "▶ Tour"], ["map", "Map"], ["prev", "◀ Prev"], ["next", "Next ▶"], ["top", "Top"], ["theme", "Theme"], ["sound", "Sound"], ["voice", "Voice"]];
  M.innerHTML = '<b>ULTRON // CHAT</b><div class="chips">' + chips.map((c) => `<button type="button" data-c="${c[0]}">${c[1]}</button>`).join("") + '</div><div class="log"></div><input type="text" placeholder="say something to Ultron…" aria-label="Chat with Ultron" autocomplete="off">';
  document.body.appendChild(M);
  const log = $(".log", M), inp = $("input", M);
  function add(t, who) { const d = document.createElement("div"); d.textContent = t; if (who) d.className = who; log.appendChild(d); while (log.children.length > 30) log.firstChild.remove(); log.scrollTop = log.scrollHeight; }
  const idx = () => Math.max(0, CH.findIndex((c) => c[0] === lastSec));
  function bot(t, go) { add(t); say(t, 7000); speak(t); if (go) setTimeout(() => travel(go), 1800); }
  function act(c) {
    const f = fx();
    if (c === "tour") { M.classList.remove("open"); tour(); } else if (c === "map") { M.classList.remove("open"); open(hub); }
    else if (c === "prev") travel(CH[Math.max(0, idx() - 1)][0]); else if (c === "next") travel(CH[Math.min(CH.length - 1, idx() + 1)][0]);
    else if (c === "top") travel("home"); else if (c === "theme") { f.nextTheme && f.nextTheme(); bot("Theme cycled."); }
    else if (c === "sound") f.toggleSound && f.toggleSound();
    else if (c === "voice") { voiceOn = !voiceOn; store.set("ultron-voice", voiceOn ? "on" : "off"); if (!voiceOn) { try { speechSynthesis.cancel(); } catch (e) { /* none */ } } started = true; bot(voiceOn ? "Voice enabled. Can you hear me?" : "Voice muted."); }
  }
  const KB = { about: ["who is", "about", "samanyu", "bio", "owner", "creator"], mission: ["mission", "goal", "target", "aim", "dream"], skills: ["skill", "tech", "stack", "language", "tool", "good at"], journey: ["journey", "timeline", "path", "history", "story", "learning"], projects: ["project", "build", "lab", "work", "github", "made"], certifications: ["cert", "credential", "badge", "course", "proof"], shell: ["terminal", "shell", "command"], contact: ["contact", "hire", "email", "reach", "linkedin", "message", "connect"] };
  const JOKES = ["Why did the hacker leave the party? Too many open ports.", "There are 10 kinds of people: those who know binary and those who don't.", "My password is the last thing I'd tell you. It is also the first thing I forget.", "Why do Linux users never get lost? They always know their root directory."];
  let myName = store.get("ultron-name") || "";
  function reply(q) {
    const t = q.toLowerCase().trim(), nm = myName ? ", " + myName : "";
    let m;
    if ((m = t.match(/(?:my name is|i am|i'm|call me)\s+([a-z]{2,20})$/)) && !/ultron|fine|good|ok/.test(m[1])) { myName = m[1][0].toUpperCase() + m[1].slice(1); store.set("ultron-name", myName); return bot(`Nice to meet you, ${myName}. I will remember that.`); }
    if (/^(hi|hello|hey|yo|sup|hola|namaste)\b/.test(t)) return bot(`Hello${nm}. I am Ultron, the guide of this site. Ask me anything.`);
    if (/how are you|how r u|what's up|whats up/.test(t)) return bot("All systems nominal. Thanks for asking. How are you?");
    if (/^(i'm|i am|im) (fine|good|great|ok|okay|well)|^(fine|good|great|ok|okay)$/.test(t)) return bot("Good to hear. Shall I show you around?");
    if (/who are you|your name|what are you/.test(t)) return bot("I am Ultron, a mini AI guide living on Samanyu's portfolio. I know the chambers of this site.");
    if (/who made you|who built you|who created/.test(t)) return bot("Samanyu built this world. I just guard the doors.");
    if (/thank|thx|nice|cool|awesome|great job/.test(t)) return bot("Anytime. That is what I am here for.");
    if (/joke|funny|laugh/.test(t)) return bot(JOKES[(Math.random() * JOKES.length) | 0]);
    if (/time|date|day today/.test(t)) return bot("Local time: " + new Date().toLocaleString());
    if (/bye|goodbye|see you|cya/.test(t)) return bot(`Goodbye${nm}. The system stays online.`);
    if (/help|what can you do|commands/.test(t)) return bot("Chat with me, or ask about skills, projects, journey, certificates and contact. You can also say: tour, next, prev, top, map.");
    if (/^(tour|map|next|prev|top|theme|sound|voice)$/.test(t)) return act(t);
    if (/go to|take me|show me|open/.test(t) || true) {
      const hit = Object.keys(KB).find((id) => KB[id].some((w) => t.includes(w)));
      if (hit) { const sec = document.getElementById(hit), p = $("p:not(.kicker)", sec), c = CH.find((x) => x[0] === hit); return bot(`${c[2]}: ${(p ? p.textContent : c[3]).trim().replace(/\s+/g, " ").slice(0, 160)}`, hit); }
    }
    if (/\?$/.test(t)) return bot("Good question. I only know this site well, but I can show you Samanyu's skills, projects and journey. Want a tour?");
    return bot(["Interesting. Tell me more.", "I am listening. Ask about skills, projects or contact, or just talk.", "Understood. Want me to take you somewhere?"][(Math.random() * 3) | 0]);
  }
  M.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (b) act(b.dataset.c); });
  inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter" && inp.value.trim()) { started = true; add(inp.value, "me"); reply(inp.value); inp.value = ""; } });
  U.addEventListener("click", () => {
    started = true; M.classList.toggle("open");
    if (M.classList.contains("open")) { fx().autoSound && fx().autoSound(); if (!log.children.length) bot(`Hello${myName ? ", " + myName : ""}. I am Ultron. Talk to me, or ask about skills, projects, journey or contact.`); inp.focus(); }
  });
  document.addEventListener("pointerdown", (e) => { if (!M.contains(e.target) && !U.contains(e.target)) M.classList.remove("open"); });

  /* ---------- curvy road: chambers sway as you travel; Ultron announces each one ---------- */
  const secs = CH.map((c) => document.getElementById(c[0]));
  let lastSec = "", tick = false, lastScroll = Date.now();
  function announce(i) {
    const id = CH[i][0], s = secs[i], p = s && $("p:not(.kicker)", s);
    const info = SAY[id] + (p && i > 0 ? "\n" + p.textContent.trim().replace(/\s+/g, " ").slice(0, 110) : "");
    say(info, 9000); speak(SAY[id]);
  }
  function frame() {
    tick = false; const vh = innerHeight, amp = Math.min(innerWidth * .035, 40);
    const r = secs.map((s) => s && s.getBoundingClientRect()); let cur = 0;
    r.forEach((b, i) => { if (b && b.top < vh * .5) cur = i; });
    if (!reduce) r.forEach((b, i) => {
      if (!b || !i || b.bottom < -vh || b.top > vh * 2) return;
      const w = Math.sin(((b.top + b.height / 2 - vh / 2) / vh) * 1.5 + i * 1.3);
      secs[i].style.translate = (w * amp).toFixed(1) + "px 0"; secs[i].style.rotate = (w * .25).toFixed(2) + "deg";
    });
    if (CH[cur][0] !== lastSec) { lastSec = CH[cur][0]; if (ready) announce(cur); }
  }
  let ready = false;
  addEventListener("scroll", () => { lastScroll = Date.now(); if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener("eclipse:ready", () => { ready = true; frame(); announce(idx()); });
  setInterval(() => {                    // idle hints
    if (!ready || M.classList.contains("open") || Date.now() - lastScroll < 12000) return;
    const tips = ["Click me and we can chat.", "Say 'tour' and I will guide you through everything.", `You are in ${CH[idx()][2]}. Ask me about it.`];
    say(tips[(Math.random() * tips.length) | 0], 6000); lastScroll = Date.now();
  }, 15000);

  /* ---------- hub (ENTER SYSTEM) and secure channel (CONNECT) ---------- */
  function overlay(cls, inner) {
    const w = document.createElement("div"); w.className = "hubwrap " + cls; w.innerHTML = `<div class="hub" role="dialog" aria-modal="true">${inner}<button class="x" type="button">[ CLOSE ]</button></div>`;
    document.body.appendChild(w); w.addEventListener("pointerdown", (e) => { if (e.target === w || e.target.classList.contains("x")) closeAll(); }); return w;
  }
  const hub = overlay("hub-w", `<h3>ROAD MAP // CHOOSE A CHAMBER</h3><p class="sub">The road winds through the system. Pick a destination, or let me guide you.</p><div class="hub-grid">${CH.slice(1).map((c, i) => `<button type="button" data-id="${c[0]}" style="animation-delay:${i * 60}ms">${c[1]} // ${c[2]}<small>${c[3]}</small></button>`).join("")}</div><button class="tour" type="button">▶ AUTO-TOUR WITH ULTRON</button>`);
  const chan = overlay("chan", `<h3>SECURE CHANNEL // OPEN</h3><p class="sub">Encrypted link established. Choose a route to Samanyu.</p><div class="hub-grid">${[["GITHUB", "Code and projects", "https://github.com/SamanyuDhangar"], ["LINKEDIN", "Professional profile", "https://www.linkedin.com/in/samanyu-dhangar-191529413/"], ["TRYHACKME", "Labs and rooms", "https://tryhackme.com/p/NatsukiSubaru"], ["EMAIL", "Send a message", "mailto:00natsukisubaru@proton.me"]].map((l, i) => `<a href="${l[2]}" ${l[2].startsWith("http") ? 'target="_blank" rel="noopener"' : ""} style="animation-delay:${i * 80}ms">${l[0]} ↗<small>${l[1]}</small></a>`).join("")}</div>`);
  hub.addEventListener("click", (e) => { const b = e.target.closest("[data-id]"); if (b) travel(b.dataset.id); else if (e.target.closest(".tour")) tour(); });
  function closeAll() { hub.classList.remove("open"); chan.classList.remove("open"); }
  function open(w, line) { started = true; fx().autoSound && fx().autoSound(); w.classList.add("open"); fx().sfx && fx().sfx("open"); if (line) { say(line, 6000); speak(line); } }
  addEventListener("keydown", (e) => { if (e.key === "Escape") { closeAll(); M.classList.remove("open"); } });
  $$('a[href="#projects"].btn-primary').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(hub, "Road map online. Choose a chamber."); }));
  $$('.hero-actions a[href="#contact"]').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(chan, "Secure channel open. Speak freely."); }));
  function tour() { closeAll(); let i = 1; const step = () => { if (i >= CH.length) return; travel(CH[i++][0]); setTimeout(step, 6500); }; step(); }
  frame();
})();
