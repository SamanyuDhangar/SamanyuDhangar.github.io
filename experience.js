/* PROJECT : ECLIPSE — experience layer
   Extra motion and interactive sections. The loader (script.js) and the
   Aurora Lattice background (cosmos.js) are not touched by this file. */
(() => {
  "use strict";

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* single rAF-batched scroll hook */
  const scrollFns = [];
  let scrollTick = false;
  const onScroll = () => { scrollTick = false; scrollFns.forEach((f) => f()); };
  addEventListener("scroll", () => { if (!scrollTick) { scrollTick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", () => requestAnimationFrame(onScroll));

  /* ---------- Text scramble (decrypt effect) ---------- */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\#$%&*";
  function scramble(node, finalText, ms = 900) {
    if (reduce) { node.nodeValue = finalText; return; }
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / ms, 0, 1);
      const locked = Math.floor(p * finalText.length);
      let out = "";
      for (let i = 0; i < finalText.length; i++) {
        const ch = finalText[i];
        out += i < locked || ch === " " || /[^A-Z0-9]/i.test(ch) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.nodeValue = out;
      if (p < 1) requestAnimationFrame(step); else node.nodeValue = finalText;
    };
    requestAnimationFrame(step);
  }

  /* ---------- Hero: name decrypt, glitch depth, rotator, clock, badge ---------- */
  function initHero() {
    const name = $("#name");
    const lines = $$(".name-line", name);
    let started = false;
    const run = () => {
      if (started) return; started = true;
      lines.forEach((el, i) => {
        const txt = el.dataset.text;
        const node = el.firstChild;
        setTimeout(() => scramble(node, txt, 900), i * 220);
      });
      setTimeout(() => name.classList.add("ready"), reduce ? 0 : 1400);
    };
    addEventListener("eclipse:ready", run);
    setTimeout(() => { if (!started) { started = true; name.classList.add("ready"); } }, 9000); // safety net

    // role rotator
    const typed = $("#typed");
    const phrases = ["cloud infrastructure", "AI systems", "networks and packets", "everything I build"];
    if (!reduce) {
      let pi = 0, ci = phrases[0].length, del = true;
      const tick = () => {
        const full = phrases[pi];
        ci += del ? -1 : 1;
        typed.textContent = full.slice(0, ci);
        let wait = del ? 28 : 65;
        if (!del && ci === full.length) { del = true; wait = 1700; }
        else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 260; }
        setTimeout(tick, wait);
      };
      setTimeout(tick, 2600);
    }

    // live clock (India)
    const clock = $("#clock");
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const upd = () => { clock.textContent = `// ${fmt.format(new Date())} IST`; };
    upd(); setInterval(upd, 1000);

    // barcode from the name (deterministic)
    const svg = $("#barcode");
    const seed = [..."SAMANYU DHANGAR ECLIPSE"].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    let s = seed, x = 0, bars = "";
    while (x < 300) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const w = 1 + (s >>> 28) % 4, gap = 1 + (s >>> 24) % 3;
      bars += `<rect x="${x}" y="0" width="${w}" height="34" fill="currentColor"/>`;
      x += w + gap;
    }
    svg.setAttribute("viewBox", "0 0 300 34"); svg.setAttribute("preserveAspectRatio", "none");
    svg.innerHTML = bars; svg.style.color = "#9eabb3";

    // pointer: name glitch depth + badge tilt/glare
    if (!canHover) return;
    const badge = $("#badge");
    let px = 0, py = 0, pend = false;
    addEventListener("pointermove", (e) => {
      px = e.clientX; py = e.clientY;
      if (pend) return; pend = true;
      requestAnimationFrame(() => {
        pend = false;
        const nx = px / innerWidth - .5, ny = py / innerHeight - .5;
        name.style.setProperty("--mx", nx.toFixed(3));
        name.style.setProperty("--my", ny.toFixed(3));
        const r = badge.getBoundingClientRect();
        const bx = (px - r.left) / r.width, by = (py - r.top) / r.height;
        badge.style.setProperty("--ry", `${(clamp(bx, -.5, 1.5) - .5) * 22}deg`);
        badge.style.setProperty("--rx", `${-(clamp(by, -.5, 1.5) - .5) * 18}deg`);
        badge.style.setProperty("--gx", `${bx * 100}%`);
        badge.style.setProperty("--gy", `${by * 100}%`);
      });
    }, { passive: true });
  }

  /* ---------- Progress bar + section rail ---------- */
  function initRail() {
    const bar = $(".scroll-progress");
    const rail = $("#rail");
    const labels = { home: "HOME", about: "ABOUT", mission: "MISSION", skills: "SKILLS", journey: "JOURNEY", projects: "PROJECTS", certifications: "CREDENTIALS", shell: "SHELL", contact: "CONTACT" };
    const secs = $$("main section[id]");
    rail.innerHTML = secs.map((s) => `<a href="#${s.id}" aria-label="${labels[s.id] || s.id}">${labels[s.id] || s.id}<i></i></a>`).join("");
    const links = $$("a", rail);
    scrollFns.push(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
      bar.style.transform = `scaleX(${p})`;
      rail.style.setProperty("--p", p.toFixed(3));
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === `#${e.target.id}`)));
    }, { rootMargin: "-40% 0px -55% 0px" });
    secs.forEach((s) => io.observe(s));
  }

  /* ---------- Cursor ring, magnetic buttons, card spotlight ---------- */
  function initPointer() {
    if (!canHover) return;
    const ring = document.createElement("div");
    ring.className = "cursor-ring"; ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * .2; cy += (ty - cy) * .2;
      ring.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .3 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY; ring.classList.add("show");
      ring.classList.toggle("hot", !!e.target.closest("a, button, .project-card, .skill-card, input"));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => ring.classList.remove("show"));

    // magnetic pull
    $$(".mag").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${(e.clientX - r.left - r.width / 2) * .22}px ${(e.clientY - r.top - r.height / 2) * .35}px`;
      });
      el.addEventListener("pointerleave", () => { el.style.translate = ""; });
    });

    // spotlight
    $$(".project-card, .skill-card, .credential-item, .tab-panel").forEach((el) => {
      el.classList.add("spot");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }, { passive: true });
    });
  }

  /* ---------- Section headings decrypt on reveal ---------- */
  function initHeadings() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const h2 = $("h2", e.target);
        const node = [...h2.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());
        if (node) { const txt = node.nodeValue; scramble(node, txt, 700); }
      });
    }, { threshold: .6 });
    $$(".section-heading").forEach((h) => io.observe(h));
  }

  /* ---------- About: scroll-scrubbed words + staggered redaction ---------- */
  function initAbout() {
    $$(".profile-lines strong").forEach((el, i) => el.style.setProperty("--i", i));
    const blocks = $$(".scrub").map((el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.setAttribute("aria-label", words.join(" "));
      el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(" ");
      return { el, spans: $$(".w", el) };
    });
    if (reduce) { blocks.forEach((b) => b.spans.forEach((s) => s.classList.add("on"))); return; }
    blocks.forEach((b) => { b.n = -1; });
    scrollFns.push(() => {
      blocks.forEach((b) => {
        const { el, spans } = b;
        const r = el.getBoundingClientRect();
        const p = clamp((innerHeight * .88 - r.top) / (r.height + innerHeight * .28), 0, 1);
        const n = Math.round(p * spans.length);
        if (n === b.n) return;                       // nothing changed → no DOM work while scrolling
        b.n = n;
        spans.forEach((s, i) => s.classList.toggle("on", i < n));
      });
    });
  }

  /* ---------- Marquee driven by scroll velocity ---------- */
  function initMarquee() {
    const m = $(".marquee");
    if (!m || reduce) return;
    const tracks = $$(".marquee-track", m).map((t) => {
      t.innerHTML += t.innerHTML + t.innerHTML;   // 3 copies = seamless loop
      return { t, dir: +t.dataset.dir, x: 0 };
    });
    let visible = false, lastY = scrollY, vel = 0, raf = 0, last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, .05); last = now;
      const dy = scrollY - lastY; lastY = scrollY;
      vel += (dy - vel) * .12;
      tracks.forEach((o) => {
        const w = o.t.scrollWidth / 3;
        o.x += o.dir * (40 + Math.abs(vel) * 28) * dt;
        if (o.dir === -1 && o.x <= -w) o.x += w;
        if (o.dir === 1 && o.x >= 0) o.x -= w;
        o.t.style.transform = `translate3d(${o.x}px,0,0)`;
      });
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    tracks.forEach((o) => { if (o.dir === 1) o.x = -o.t.scrollWidth / 3; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }).observe(m);
  }

  /* ---------- Mission tabs ---------- */
  function initMission() {
    const data = {
      cloud: { t: "AI + CLOUD", s: "EXPLORING", d: "Protecting the infrastructure, identities and data that live in the cloud.", c: ["IDENTITY & ACCESS", "SECURE CONFIGURATION", "NETWORK EXPOSURE", "LOGGING & MONITORING"] },
      ai:    { t: "AI + CLOUD", s: "EXPLORING", d: "Protecting AI models, the data behind them and the apps built on top.", c: ["DATA & MODEL PROTECTION", "PROMPT INJECTION", "ADVERSARIAL INPUTS", "SECURE AI APPS"] },
      core:  { t: "CORE FIRST", s: "IN PROGRESS", d: "Networking, Linux and traffic analysis — the base everything else sits on.", c: ["TCP/IP", "DNS", "LINUX CLI", "WIRESHARK"] }
    };
    const panel = $("#tab-panel"), title = $("#reticle-title");
    const tabs = $$(".tab");
    tabs.forEach((tab) => tab.addEventListener("click", () => {
      const d = data[tab.dataset.tab];
      tabs.forEach((x) => { const on = x === tab; x.classList.toggle("on", on); x.setAttribute("aria-selected", String(on)); });
      panel.innerHTML = "";
      const st = document.createElement("p"); st.className = "tab-status"; st.textContent = `STATUS // ${d.s}`;
      const p = document.createElement("p"); p.textContent = d.d;
      const tg = document.createElement("div"); tg.className = "tags";
      d.c.forEach((c) => { const s = document.createElement("span"); s.textContent = c; tg.appendChild(s); });
      panel.append(st, p, tg);
      panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
      scramble(title.firstChild, d.t, 500);
    }));
  }

  /* ---------- Skills orbit map ---------- */
  function initOrbit() {
    const wrap = $("#orbit-wrap"), orbit = $("#orbit"), read = $("#orbit-read");
    const rings = [
      { r: 78,  d: 70,  rev: false, tag: "DEVELOPMENT", items: ["C", "PYTHON", "HTML", "CSS", "JAVASCRIPT", "GIT"] },
      { r: 126, d: 90,  rev: true,  tag: "LINUX",       items: ["CLI", "PERMISSIONS", "PROCESSES", "FILESYSTEMS", "SHELL"] },
      { r: 176, d: 110, rev: false, tag: "SECURITY",    items: ["WIRESHARK", "TRAFFIC ANALYSIS", "SECURITY LABS", "RECON CONCEPTS", "CLOUD SECURITY", "AI SECURITY"] },
      { r: 226, d: 130, rev: true,  tag: "NETWORKING",  items: ["TCP/IP", "HTTP(S)", "DNS", "ARP", "ICMP", "ROUTING", "VPN"] }
    ];
    rings.forEach((ring, ri) => {
      const el = document.createElement("div");
      el.className = "orbit-ring";
      el.style.cssText = `--r:${ring.r};--d:${ring.d}s;--dir:${ring.rev ? "reverse" : "normal"};--cdir:${ring.rev ? "normal" : "reverse"}`;
      ring.items.forEach((label, i) => {
        const chip = document.createElement("div");
        chip.className = "orbit-chip";
        chip.style.setProperty("--a", `${(i * 360) / ring.items.length + ri * 23}deg`);
        const b = document.createElement("button");
        b.type = "button"; b.textContent = label;
        const show = () => { read.textContent = `NODE // ${label} · ${ring.tag}`; };
        b.addEventListener("pointerenter", show); b.addEventListener("focus", show);
        chip.appendChild(b); el.appendChild(chip);
      });
      orbit.appendChild(el);
    });
    orbit.addEventListener("pointerleave", () => { read.textContent = "NODE // hover a skill"; });
    const fit = () => { orbit.style.transform = `scale(${wrap.clientWidth / 520})`; };
    new ResizeObserver(fit).observe(wrap); fit();
  }

  /* ---------- Journey: packet follows scroll ---------- */
  function initTimeline() {
    const tl = $("#timeline"), items = $$(".timeline-item", tl);
    scrollFns.push(() => {
      const r = tl.getBoundingClientRect();
      const p = clamp((innerHeight * .62 - r.top) / r.height, 0, 1);
      tl.style.setProperty("--p", p.toFixed(4));
      items.forEach((it) => {
        const ir = it.getBoundingClientRect();
        it.classList.toggle("lit", ir.top < innerHeight * .62);
      });
    });
  }

  /* ---------- Interactive shell ---------- */
  function initShell() {
    const out = $("#shell-out"), input = $("#shell-in"), body = $("#shell-body"), chips = $("#shell-chips");
    const hist = []; let hi = 0, busy = false;
    const L = (text, cls = "out") => ({ text, cls });
    const link = (label, href) => ({ link: { label, href } });
    const lines = (arr, cls = "out") => arr.map((t) => L(t, cls));

    const cmds = {
      help: () => [L("available commands:", "dim"), ...lines(["  whoami      who am I", "  goal        what I'm aiming for", "  focus       cat focus.txt", "  about       short profile", "  skills      toolchain", "  projects    lab work", "  journey     milestones", "  credentials certificates", "  contact     find me online", "  ls          list sections", "  goto <name> jump to a section", "  clear       clear the screen", "  ./build_future.sh"])],
      whoami: () => lines(["Samanyu"]),
      goal: () => lines(["Aspiring AI & Cloud Cybersecurity Engineer."]),
      focus: () => lines(["networking", "linux", "cybersecurity", "cloud security", "ai security"]),
      about: () => lines(["Curious about how systems work — and how they can be secured.", "Building a cybersecurity foundation through hands-on learning, labs and small projects."]),
      skills: () => lines(["networking   TCP/IP · HTTP(S) · DNS · ARP · ICMP · Routing · VPN fundamentals", "linux        CLI · permissions · processes · filesystems · shell fundamentals", "security     Wireshark · traffic analysis · security labs · recon concepts · cloud & AI security", "development  C · Python fundamentals · HTML · CSS · JavaScript · Git"]),
      projects: () => [...lines(["01  NETWORK TRAFFIC LAB   packets, protocols and traffic patterns with Wireshark", "02  LINUX SECURITY LAB    command-line practice and security experiments", "03  TOOLS                 a growing toolkit of security utilities"]), link("    → EyesOfTruth", "https://eyesoftruth.onrender.com/")],
      journey: () => lines(["01  Networking + Linux     foundation", "02  Pre Security Path      TryHackMe", "03  Wireshark Basics      traffic analysis", "04  Cloud + AI Security   next target"]),
      credentials: () => lines(["[VERIFIED]   TryHackMe — Pre Security Path", "[VERIFIED]   TryHackMe — SEC0", "[COMPLETED]  TryHackMe — Wireshark Basics"]),
      contact: () => [link("github    → github.com/SamanyuDhangar", "https://github.com/SamanyuDhangar"), link("linkedin  → linkedin.com/in/samanyu-dhangar-191529413", "https://www.linkedin.com/in/samanyu-dhangar-191529413/")],
      ls: () => lines(["about  mission  skills  journey  projects  certifications  shell  contact"]),
      "sudo hire-me": () => [L("samanyu is not in the sudoers file. This incident will be reported.", "err"), L("…but you can say hi: type 'contact'", "dim")],
      "./build_future.sh": () => [L("[ OK ] networking"), L("[ OK ] linux"), L("[ OK ] wireshark"), L("[ .. ] cloud security   (in progress)", "dim"), L("[ .. ] ai security      (in progress)", "dim"), L("build running — keep learning.", "dim")]
    };
    const names = Object.keys(cmds).concat(["clear", "goto"]);

    const print = (items) => items.forEach((it) => {
      const d = document.createElement("div");
      if (it.link) { const a = document.createElement("a"); a.href = it.link.href; a.target = "_blank"; a.rel = "noopener"; a.textContent = it.link.label; d.className = "out"; d.appendChild(a); }
      else { d.className = it.cls; d.textContent = it.text; }
      out.appendChild(d);
    });
    const echo = (cmd) => { const d = document.createElement("div"); const p = document.createElement("span"); p.className = "prompt"; p.textContent = "samanyu@eclipse:~$ "; d.append(p, document.createTextNode(cmd)); out.appendChild(d); };
    const toBottom = () => { body.scrollTop = body.scrollHeight; };

    function run(raw) {
      const cmd = raw.trim().replace(/\s+/g, " ");
      echo(cmd);
      if (!cmd) return toBottom();
      const key = cmd.toLowerCase().replace(/^cat focus\.txt$/, "focus");
      if (key === "clear") out.innerHTML = "";
      else if (key.startsWith("goto ") || key.startsWith("cd ")) {
        const id = key.split(" ")[1].replace("/", "");
        const el = document.getElementById(id === "credentials" ? "certifications" : id);
        if (el && el.tagName === "SECTION") { print([L(`jumping to ${id}…`, "dim")]); el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
        else print([L(`goto: no such section: ${id}`, "err")]);
      } else if (cmds[key]) print(cmds[key]());
      else print([L(`command not found: ${cmd} — try 'help'`, "err")]);
      toBottom();
    }

    input.addEventListener("keydown", (e) => {
      if (busy) return e.preventDefault();
      if (e.key === "Enter") { const v = input.value; if (v.trim()) { hist.push(v); hi = hist.length; } run(v); input.value = ""; }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (hi > 0) input.value = hist[--hi]; }
      else if (e.key === "ArrowDown") { e.preventDefault(); input.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ""); }
      else if (e.key === "Tab") { e.preventDefault(); const m = names.filter((n) => n.startsWith(input.value.toLowerCase())); if (m.length === 1) input.value = m[0]; }
    });
    body.addEventListener("click", () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });

    ["help", "about", "skills", "projects", "journey", "credentials", "contact", "clear"].forEach((c) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = c;
      b.addEventListener("click", () => { if (!busy) run(c); });
      chips.appendChild(b);
    });

    // auto-demo of the original hero terminal, once, when the section appears
    const demo = ["whoami", "cat focus.txt", "./build_future.sh"];
    new IntersectionObserver((entries, io) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect(); busy = true; input.readOnly = true;
      let di = 0;
      const next = () => {
        if (di >= demo.length) { busy = false; input.readOnly = false; print([L("type 'help' to explore.", "dim")]); toBottom(); return; }
        const c = demo[di++]; let i = 0;
        const typeIt = () => {
          input.value = c.slice(0, ++i);
          if (i < c.length && !reduce) return setTimeout(typeIt, 45);
          input.value = c;
          setTimeout(() => { input.value = ""; run(c); setTimeout(next, reduce ? 0 : 450); }, reduce ? 0 : 250);
        };
        typeIt();
      };
      setTimeout(next, 500);
    }, { threshold: .35 }).observe($("#shell"));
  }

  /* ---------- Init ---------- */
  initHero(); initRail(); initPointer(); initHeadings(); initAbout();
  initMarquee(); initMission(); initOrbit(); initTimeline(); initShell();
  onScroll();
})();
