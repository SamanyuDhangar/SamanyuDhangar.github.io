/* SLIDES — long scrolling sections become small slide decks.
   Nothing fades in while you scroll any more: each section shows one sub-part at a time,
   and you move through them with the tabs, the arrows, the keyboard (← →) or a swipe.
   Runs last. Moves the existing elements into slides (no text is changed). */
(() => {
  "use strict";
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const text = (n, sel) => { const e = sel ? $(sel, n) : n; return e ? e.textContent.trim().replace(/\s+/g, " ").toUpperCase() : ""; };
  const make = (tag, cls, attrs) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };

  /* 1. no reveal-on-scroll below the hero: everything is simply there */
  $$(".content-section .reveal, .contact-section .reveal").forEach((el) => el.classList.add("visible"));

  /* colours were assigned by position (nth-child) — keep them when cards move into slides */
  const SKILL_COLORS = ["var(--ab-a)", "var(--ab-b)", "var(--ab-c)", "255, 122, 184"];

  const DECKS = [
    { id: "about", label: "About", host: "#about .about-grid", slides() {
      const copy = $("#about .about-copy");
      return [
        { title: "PROFILE", nodes: [$("#about .terminal-panel")] },
        { title: "WHOAMI", nodes: [copy] },
        { title: "APPROACH", nodes: [$(".mini-stats", copy)] }
      ];
    } },
    { id: "skills", label: "Skills", host: "#skills .skills-layout", slides() {
      const cmd = $("#skills .skill-command");
      const old = $("#skills .skill-cards");
      const cards = $$(".skill-card", old);
      cards.forEach((c, i) => c.style.setProperty("--c", SKILL_COLORS[i]));
      const pair = (a, b) => { const w = make("div", "skill-cards"); w.append(a, b); return w; };
      const slides = [
        { title: "ORBIT MAP", nodes: [cmd] },
        { title: `${text(cards[0], "h3")} + ${text(cards[1], "h3")}`, nodes: [pair(cards[0], cards[1])] },
        { title: `${text(cards[2], "h3")} + ${text(cards[3], "h3")}`, nodes: [pair(cards[2], cards[3])] }
      ];
      old.remove();
      return slides;
    } },
    { id: "journey", label: "Journey", host: "#timeline", slides() {
      return $$("#timeline .timeline-item").map((it) => ({ title: text(it, ".timeline-date"), nodes: [it] }));
    }, onChange(i, slides) { slides.forEach((s, k) => s.firstElementChild.classList.toggle("lit", k === i)); } },
    { id: "projects", label: "Projects", host: "#projects .projects-grid", slides() {
      return $$("#projects .project-card").map((c, i) => {
        c.style.setProperty("--c", SKILL_COLORS[i]);
        return { title: text(c, "h3"), nodes: [c] };
      });
    } },
    { id: "credentials", label: "Credentials", host: "#certifications .credential-panel", slides() {
      return $$("#certifications .credential-item").map((it) => ({ title: text(it, "h3"), nodes: [it] }));
    } }
  ];

  const decks = [];

  function build(cfg) {
    const host = $(cfg.host);
    if (!host) return;
    const defs = cfg.slides().filter((d) => d.nodes.every(Boolean));
    if (defs.length < 2) return;

    const root = make("div", "deck", { role: "region", "aria-roledescription": "carousel", "aria-label": `${cfg.label} slides` });
    const tabs = make("div", "deck-tabs", { role: "tablist", "aria-label": `${cfg.label} sub-parts` });
    const stage = make("div", "deck-stage");
    const ctrl = make("div", "deck-ctrl");
    const prev = make("button", "deck-arrow", { type: "button", "aria-label": "Previous slide" });
    const next = make("button", "deck-arrow", { type: "button", "aria-label": "Next slide" });
    prev.textContent = "←"; next.textContent = "→";
    const mid = make("div", "deck-mid");
    const dots = make("div", "deck-dots", { "aria-hidden": "true" });
    const count = make("div", "deck-count", { "aria-live": "polite" });

    const slides = [], tabEls = [], dotEls = [];
    defs.forEach((d, i) => {
      const s = make("div", "slide", { role: "tabpanel", id: `${cfg.id}-slide-${i}`, "aria-label": `${i + 1} of ${defs.length}` });
      d.nodes.forEach((n) => s.appendChild(n));
      stage.appendChild(s); slides.push(s);

      const t = make("button", "deck-tab", { type: "button", role: "tab", "aria-controls": s.id });
      const num = make("b"); num.textContent = pad(i + 1);
      t.append(num, document.createTextNode(d.title));
      t.addEventListener("click", () => go(i));
      tabs.appendChild(t); tabEls.push(t);

      const dot = make("i", "deck-dot"); dots.appendChild(dot); dotEls.push(dot);
    });

    mid.append(dots, count);
    ctrl.append(prev, mid, next);
    root.append(tabs, stage, ctrl);
    host.appendChild(root);
    host.classList.add("deck-host", `deck-${cfg.id}`);

    const api = { root, i: 0, go };
    function go(n) {
      n = Math.max(0, Math.min(slides.length - 1, n));
      api.i = n;
      slides.forEach((s, k) => {
        s.classList.toggle("on", k === n);
        s.classList.toggle("before", k < n);
        s.classList.toggle("after", k > n);
        s.setAttribute("aria-hidden", String(k !== n));
        if ("inert" in s) s.inert = k !== n;
        tabEls[k].setAttribute("aria-selected", String(k === n));
        tabEls[k].tabIndex = k === n ? 0 : -1;
        if (k === n) dotEls[k].setAttribute("data-on", ""); else dotEls[k].removeAttribute("data-on");
      });
      prev.disabled = n === 0; next.disabled = n === slides.length - 1;
      count.textContent = `${pad(n + 1)} / ${pad(slides.length)}`;
      if (cfg.onChange) cfg.onChange(n, slides);
    }
    prev.addEventListener("click", () => go(api.i - 1));
    next.addEventListener("click", () => go(api.i + 1));

    /* swipe (touch / pen). Vertical scrolling is left to the browser. */
    let sx = 0, sy = 0, tracking = false;
    stage.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") return; tracking = true; sx = e.clientX; sy = e.clientY; });
    stage.addEventListener("pointerup", (e) => {
      if (!tracking) return; tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(api.i + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener("pointercancel", () => { tracking = false; });

    go(0);
    decks.push(api);
  }

  DECKS.forEach(build);

  /* keyboard: ← → move the deck you are pointing at or have focus in */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    const d = decks.find((x) => x.root.contains(document.activeElement)) || decks.find((x) => x.root.matches(":hover"));
    if (!d) return;
    e.preventDefault();
    d.go(d.i + (e.key === "ArrowRight" ? 1 : -1));
  });
})();
