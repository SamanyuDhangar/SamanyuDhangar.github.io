(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toast = (t) => { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 2600); };
  $("#yr").textContent = new Date().getFullYear();

  /* ---- shadowy fog ---- */
  const fog = $("#fog"), fx = fog.getContext("2d"); let W, H;
  const blobs = Array.from({ length: 7 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: .3 + Math.random() * .35, s: .00005 + Math.random() * .00007, p: Math.random() * 6.28, c: i % 2 ? "139,123,255" : "90,150,210" }));
  const size = () => { W = fog.width = innerWidth; H = fog.height = innerHeight; };
  addEventListener("resize", size); size();
  (function drawFog(t) {
    fx.fillStyle = "#05060a"; fx.fillRect(0, 0, W, H);
    for (const b of blobs) {
      const x = (b.x + Math.sin(t * b.s + b.p) * .18) * W, y = (b.y + Math.cos(t * b.s * 1.3 + b.p) * .15) * H, r = b.r * Math.max(W, H);
      const g = fx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${b.c},.10)`); g.addColorStop(1, `rgba(${b.c},0)`);
      fx.fillStyle = g; fx.fillRect(0, 0, W, H);
    }
    if (!document.hidden && !reduce) requestAnimationFrame(drawFog); else setTimeout(() => requestAnimationFrame(drawFog), 400);
  })(0);

  /* ---- loader ---- */
  const lines = ["mounting encrypted volume...", "scanning for intruders...", "loading profile: samanyu", "the dark is listening..."];
  let pct = 0, li = 0; const log = $("#boot-log");
  const tick = setInterval(() => {
    pct = Math.min(100, pct + 1 + Math.random() * 2.4);
    $("#boot-bar").style.width = pct + "%"; $("#boot-pct").textContent = Math.floor(pct);
    const want = Math.floor(pct / 26); while (li < Math.min(want, lines.length)) log.insertAdjacentHTML("beforeend", "> " + lines[li++] + "<br>");
    if (pct >= 100) { clearInterval(tick); $("#boot-ok").classList.add("on"); setTimeout(() => $("#boot").classList.add("off"), 900); }
  }, reduce ? 4 : 55);

  /* ---- abyss dive ---- */
  const hole = $("#hole"), hx = hole.getContext("2d"); let diving = false;
  function show(id) { $$(".view").forEach((v) => v.classList.toggle("on", v.id === id)); scrollTo(0, 0); }
  function dive(id) {
    if (diving || $(".view.on").id === id) return;
    if (reduce) return show(id);
    diving = true; hole.width = innerWidth; hole.height = innerHeight;
    const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2;
    const ps = Array.from({ length: 520 }, () => ({ a: Math.random() * 6.28, r: R * (.15 + Math.random() * 1.1), w: .6 + Math.random() * 1.6, h: Math.random() < .5 }));
    const T = 2300, t0 = performance.now(); let swapped = false;
    hole.style.transition = "opacity .5s"; hole.style.opacity = 1;
    (function f(now) {
      const t = (now - t0) / T, e = Math.min(t, 1);
      hx.fillStyle = `rgba(2,3,7,${.16 + e * .1})`; hx.fillRect(0, 0, W, H);
      for (const p of ps) {
        p.a += .012 + (R * .09) / (p.r + 30) * (.4 + e * 2.2); p.r *= .985 - e * .02;
        if (p.r < 4) { p.r = R * (.5 + Math.random() * .7); }
        const x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * .62, k = 1 - p.r / (R * 1.2);
        hx.fillStyle = p.h ? `rgba(139,123,255,${.2 + k})` : `rgba(127,212,255,${.2 + k})`; hx.fillRect(x, y, p.w + k * 2.4, p.w + k * 2.4);
      }
      const rr = 40 + e * e * R * 1.25, g = hx.createRadialGradient(cx, cy, rr * .55, cx, cy, rr * 1.25);
      g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(.55, "rgba(0,0,0,1)"); g.addColorStop(.72, "rgba(127,212,255,.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
      hx.fillStyle = g; hx.beginPath(); hx.arc(cx, cy, rr * 1.25, 0, 6.28); hx.fill();
      if (t > .78 && !swapped) { swapped = true; hx.fillStyle = "#000"; hx.fillRect(0, 0, W, H); show(id); }
      if (t < 1) return requestAnimationFrame(f);
      hole.style.transition = "opacity 1.1s"; hole.style.opacity = 0; setTimeout(() => { diving = false; hx.clearRect(0, 0, W, H); }, 1150);
    })(t0);
  }
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]"); if (g) return dive(g.dataset.go);
    if (e.target.closest("[data-soon]")) { e.preventDefault(); toast("Link of project is not added please wait."); }
  });

  /* ---- reveal ---- */
  const io = new IntersectionObserver((es) => es.forEach((x) => x.isIntersecting && (x.target.classList.add("in"), io.unobserve(x.target))), { threshold: .12 });
  $$(".rv").forEach((n) => io.observe(n));

  /* ---- mission tabs ---- */
  const T = {
    cloud: ["EXPLORING", "Protecting the infrastructure, identities and data that live in the cloud.", ["IDENTITY & ACCESS", "SECURE CONFIGURATION", "NETWORK EXPOSURE", "LOGGING & MONITORING"]],
    ai: ["EXPLORING", "Protecting AI models, the data behind them and the apps built on top.", ["DATA & MODEL PROTECTION", "PROMPT INJECTION", "ADVERSARIAL INPUTS", "SECURE AI APPS"]],
    core: ["IN PROGRESS", "Networking, Linux and traffic analysis — the base everything else sits on.", ["TCP/IP", "DNS", "LINUX CLI", "WIRESHARK"]]
  };
  const tp = $("#tabp");
  const setTab = (k) => { const [s, d, c] = T[k]; tp.innerHTML = `<p class="mono ok">STATUS // ${s}</p><p>${d}</p><div class="tags mono">${c.map((x) => `<span>${x}</span>`).join("")}</div>`; $$(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === k)); };
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab))); setTab("cloud");

  /* ---- password forge ---- */
  const pw = $("#pw");
  $("#pw-eye").onclick = (e) => { const s = pw.type === "password"; pw.type = s ? "text" : "password"; e.target.textContent = s ? "HIDE" : "SHOW"; };
  const COMMON = ["password", "123456", "qwerty", "letmein", "admin", "welcome", "iloveyou", "abc123"];
  pw.addEventListener("input", () => {
    const v = pw.value; if (!v) { $("#pw-bar").style.width = 0; $("#pw-v").textContent = "AWAITING INPUT"; $("#pw-e").textContent = $("#pw-t").textContent = "—"; return; }
    const pool = (/[a-z]/.test(v) * 26) + (/[A-Z]/.test(v) * 26) + (/\d/.test(v) * 10) + (/[^\w]/.test(v) * 32);
    let bits = v.length * Math.log2(pool || 1); if (COMMON.some((c) => v.toLowerCase().startsWith(c))) bits = Math.min(bits, 12);
    const sec = Math.pow(2, bits) / 1e10 / 2, u = [[31536e3, "years"], [86400, "days"], [3600, "hours"], [60, "minutes"]];
    let t = sec < 1 ? "instantly" : sec > 31536e9 ? "centuries+" : (() => { for (const [s, n] of u) if (sec >= s) return Math.round(sec / s) + " " + n; return Math.round(sec) + " seconds"; })();
    const lv = bits < 28 ? ["VERY WEAK", 12, "#ff5d6c"] : bits < 40 ? ["WEAK", 35, "#ff9f5d"] : bits < 60 ? ["FAIR", 60, "#ffd45d"] : bits < 80 ? ["STRONG", 82, "#9dff6d"] : ["EXCELLENT", 100, "#6dffb3"];
    Object.assign($("#pw-bar").style, { width: lv[1] + "%", background: lv[2] }); $("#pw-v").textContent = lv[0]; $("#pw-e").textContent = Math.round(bits) + " bits"; $("#pw-t").textContent = t;
  });

  /* ---- packet / HTTP header inspector: intentionally local-only ---- */
  const packetInput = $("#packet-input"), packetResult = $("#packet-result");
  const samplePacket = "GET / HTTP/1.1\nHost: example.com\nUser-Agent: browser\nAccept: */*\nConnection: close";
  $("#packet-example").addEventListener("click", () => { packetInput.value = samplePacket; analyzePacket(); });
  $("#packet-analyze").addEventListener("click", analyzePacket);
  function analyzePacket() {
    const raw = packetInput.value.trim();
    if (!raw) { packetResult.innerHTML = '<span class="dim">No input supplied. Paste a request or response first.</span>'; return; }
    const lines = raw.split(/\r?\n/), first = lines[0] || "", headers = {};
    for (const line of lines.slice(1)) { const i = line.indexOf(":"); if (i > 0) headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim(); }
    const isRequest = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|CONNECT|TRACE)\s+\S+\s+HTTP\/\d/i.test(first);
    const isResponse = /^HTTP\/\d(?:\.\d)?\s+\d{3}/i.test(first);
    const flags = [];
    if (/^HTTP\/1\.0/i.test(first)) flags.push("HTTP/1.0 is an older protocol version.");
    if (headers["server"]) flags.push("Server banner is exposed: consider whether detailed version information is necessary.");
    if (headers["x-powered-by"]) flags.push("X-Powered-By reveals application technology.");
    if (headers["authorization"]) flags.push("Authorization header detected. Avoid sharing real credentials in samples.");
    if (headers["cookie"]) flags.push("Cookie header detected. Treat session values as sensitive.");
    if (headers["set-cookie"] && !/\bsecure\b/i.test(headers["set-cookie"])) flags.push("Set-Cookie sample does not show the Secure attribute (context matters).");
    if (isRequest && !headers.host && /HTTP\/1\.[01]/i.test(first)) flags.push("Host header is missing from an HTTP/1.x request.");
    const safe = (s) => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    let out = `<div class="line"><span>STRUCTURE</span><span class="value ${isRequest || isResponse ? 'good' : 'flag'}">${isRequest ? 'HTTP REQUEST' : isResponse ? 'HTTP RESPONSE' : 'UNRECOGNIZED / RAW TEXT'}</span></div>`;
    out += `<div class="line"><span>START LINE</span><span class="value">${safe(first.slice(0, 150))}</span></div>`;
    out += `<div class="line"><span>HEADERS PARSED</span><span class="value">${Object.keys(headers).length}</span></div>`;
    out += `<div class="line"><span>HOST</span><span class="value">${safe(headers.host || 'not present')}</span></div>`;
    out += `<div class="line"><span>HTTPS INDICATOR</span><span class="value">${/https:/i.test(first) ? 'URL mentions HTTPS' : 'Cannot determine from this text alone'}</span></div>`;
    out += flags.length ? `<p class="flag" style="margin-top:.7rem">REVIEW NOTES</p><ul style="padding-left:1.2rem">${flags.map(f => `<li class="flag">${safe(f)}</li>`).join('')}</ul>` : `<p class="good" style="margin-top:.7rem">No basic review flags detected in the supplied text.</p>`;
    packetResult.innerHTML = out;
  }

  /* back-to-gate navigation */
  $("#back-control").addEventListener("click", () => dive("landing"));

})();

/* ===== EFFECTS LAYER ===== */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CH = "!<>-_\\/[]{}=+*^?#01";
  function scr(el) {
    if (reduce || el.dataset.s || el.children.length) return; el.dataset.s = 1;
    const t = el.textContent, n = 22; let f = 0;
    const id = setInterval(() => { f++; el.textContent = [...t].map((c, i) => c === " " || i < f * t.length / n ? c : CH[Math.random() * CH.length | 0]).join(""); if (f >= n) { el.textContent = t; clearInterval(id); } }, 34);
  }
  /* staggered reveal + scramble */
  $$(".grid").forEach((g) => [...g.children].forEach((c, i) => c.classList.contains("rv") && (c.style.transitionDelay = i * 130 + "ms")));
  $$(".tl li").forEach((c, i) => c.style.transitionDelay = i * 120 + "ms");
  const io = new IntersectionObserver((es) => es.forEach((x) => { if (!x.isIntersecting) return; const e = x.target; io.unobserve(e); scr(e); if (e.classList.contains("rv")) setTimeout(() => e.style.transitionDelay = "", 1600); }), { threshold: .3 });
  $$("h3, h4, .kick").forEach((e) => io.observe(e));
  $$(".rv").forEach((e) => io.observe(e));
  /* 3D tilt + cursor spotlight on cards and panels */
  $$(".card,.panel").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
      if (!reduce && c.classList.contains("card") && c.classList.contains("in")) c.style.transform = `perspective(800px) rotateX(${(.5 - y) * 9}deg) rotateY(${(x - .5) * 11}deg) translateY(-4px)`;
    });
    c.addEventListener("pointerleave", () => c.style.transform = "");
  });
  /* tabs: sliding indicator, ripple, animated content */
  const tabs = $(".tabs"), tp = $("#tabp"), ind = document.createElement("i"); ind.className = "ind"; tabs.appendChild(ind);
  const move = () => { const b = $(".tabs button.on"); if (b && b.offsetWidth) { ind.style.left = b.offsetLeft + "px"; ind.style.width = b.offsetWidth + "px"; } };
  new ResizeObserver(move).observe(tabs);
  const swap = () => { move(); tp.classList.remove("sw"); void tp.offsetWidth; tp.classList.add("sw"); const p = tp.children[1]; if (p) { delete p.dataset.s; scr(p); } };
  $$(".tabs button").forEach((b) => b.addEventListener("click", (e) => {
    const r = b.getBoundingClientRect(), s = document.createElement("i"), d = Math.max(r.width, r.height) * 2; s.className = "rp";
    Object.assign(s.style, { width: d + "px", height: d + "px", left: e.clientX - r.left - d / 2 + "px", top: e.clientY - r.top - d / 2 + "px" }); b.appendChild(s); setTimeout(() => s.remove(), 650);
    swap();
  }));
  /* scroll: progress bar, timeline fill, active nav */
  const pg = document.createElement("div"); pg.className = "prog"; document.body.appendChild(pg);
  const tl = $(".tl"), links = $$(".top nav a"), secs = links.map((a) => $(a.getAttribute("href")));
  addEventListener("scroll", () => {
    document.documentElement.style.setProperty("--scroll-depth", Math.min(scrollY * .12, 900) + "px");
    document.querySelector(".depth-grid")?.style.setProperty("background-position", `0 ${scrollY * .18}px, ${scrollY * .18}px 0`);
    pg.style.transform = `scaleX(${scrollY / ((document.documentElement.scrollHeight - innerHeight) || 1)})`;
    const r = tl.getBoundingClientRect(); if (r.height) tl.style.setProperty("--p", Math.max(0, Math.min(1, (innerHeight * .7 - r.top) / r.height)));
    let cur = -1; secs.forEach((s, i) => s && s.getBoundingClientRect().top < 140 && (cur = i)); links.forEach((a, i) => a.classList.toggle("act", i === cur));
  }, { passive: true });
})();
