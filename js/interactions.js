/* interactions.js — cursor ring, magnetic CTA, reveals, split text, nav state, parallax, back-to-top. */
(function () {
  const SD = window.SD, E = SD.engine, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, fine = matchMedia("(pointer:fine)").matches;

  SD.interactions = function () {
    /* split headline into chars for staggered reveal */
    $$("[data-split]").forEach((el) => {
      const txt = el.textContent; el.setAttribute("aria-label", txt); el.textContent = "";
      [...txt].forEach((c, i) => { const s = document.createElement("span"); s.className = "ch"; s.setAttribute("aria-hidden", "true"); s.style.setProperty("--i", i); s.textContent = c === " " ? "\u00a0" : c; el.appendChild(s); });
    });
    /* reveals */
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    const startReveal = () => $$(".rv, [data-split]").forEach((n) => io.observe(n));
    SD.revealStart = startReveal; if (!document.documentElement.classList.contains("is-intro")) startReveal();
    /* nav state: scroll-spy + hide on scroll down */
    const links = $$(".nav a[href^='#']"), nav = $(".nav"); let ly = 0;
    SD.onScroll = (i) => {
      const y = scrollY; nav.classList.toggle("solid", y > 40); nav.classList.toggle("hide", y > ly + 4 && y > 300 && !nav.matches(":focus-within")); if (Math.abs(y - ly) > 4) ly = y;
      const id = SD.scroll.ids[i]; links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + id));
      $("#top").classList.toggle("show", y > innerHeight * 1.2);
    };
    $("#top").addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
    /* parallax (CSS var driven, single rAF via scroll.js) */
    /* pointer: displaces particles + moves cursor ring (native cursor stays visible) */
    addEventListener("pointermove", (e) => {
      E.mouse.tx = (e.clientX / innerWidth) * 2 - 1; E.mouse.ty = -((e.clientY / innerHeight) * 2 - 1); E.mouse.on = e.pointerType === "mouse";
      if (!reduce) E.start();
    }, { passive: true });
    document.addEventListener("pointerleave", () => { E.mouse.on = false; });
    if (fine && !reduce) {
      const ring = $("#cursor"); let x = 0, y = 0, tx = 0, ty = 0, run = false;
      const loop = () => { x += (tx - x) * 0.2; y += (ty - y) * 0.2; ring.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; if (Math.abs(tx - x) + Math.abs(ty - y) > 0.3 && !document.hidden) requestAnimationFrame(loop); else run = false; };
      addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; ring.classList.add("on"); if (!run) { run = true; requestAnimationFrame(loop); } }, { passive: true });
      document.addEventListener("pointerover", (e) => ring.classList.toggle("hot", !!e.target.closest("a,button,summary,input,textarea")));
      /* magnetic buttons (only .mag) */
      $$(".mag").forEach((b) => {
        b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.25}px)`; });
        b.addEventListener("pointerleave", () => (b.style.transform = ""));
      });
    }
    /* energy wave when navigating + particle burst when a project opens */
    const wave = $("#wave");
    $$(".nav a[href^='#'],.scroll,.logo").forEach((a) => a.addEventListener("click", () => { if (reduce) return; wave.classList.remove("go"); void wave.offsetWidth; wave.classList.add("go"); E.pulseAt(0, 0, 5, 20, 1.1); }));
    $$("details").forEach((d) => d.addEventListener("toggle", () => { if (!d.open || reduce) return; const r = d.getBoundingClientRect(); E.burst(((r.left + r.width / 2) / innerWidth) * 2 - 1, -(((r.top) / innerHeight) * 2 - 1)); }));
    /* skills: hovering a row lights the matching particle network a little */
    $$(".skill").forEach((s) => { s.addEventListener("pointerenter", () => document.documentElement.style.setProperty("--hot", s.dataset.k)); });
    /* contact links from config (hidden when empty — nothing invented) */
    const c = SD.config || {};
    $$("[data-cfg]").forEach((a) => { const v = c[a.dataset.cfg]; if (!v) { (a.closest("li") || a).hidden = true; return; } a.href = a.dataset.cfg === "email" ? "mailto:" + v : v; if (a.dataset.cfg !== "email") { a.target = "_blank"; a.rel = "noopener noreferrer"; } });
    $$("[data-eot]").forEach((a) => { if (c.eyesOfTruth) a.href = c.eyesOfTruth; });
    $("#yr").textContent = new Date().getFullYear();
  };
})();
