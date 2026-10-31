/* scroll.js — native scrolling only (no hijacking). Maps scroll position to a float "chapter progress";
   the engine turns that into morphs, dissolves, head position/lighting and the forward travel through space. */
(function () {
  const SD = window.SD, E = SD.engine;
  const IDS = ["hero", "about", "skills", "work", "learning", "contact"];
  /* WebGL: the 3D head leads. n = morph-particle formation; h* = head transform/lighting for that chapter */
  const KF_GL = [
    { n: "rings",   x: 0.30,  y: 0.04, my: 0.2,  s: 1.2,  a: 0.85, la: 0.06, ry: 0,   hx: 0.30,  hy: 0.02, hmy: 0.18, hz: 0,    hs: 1.0,  ha: 1,   hl: 1 },
    { n: "sphere",  x: 0.40,  y: 0,    my: 0.18, s: 0.95, a: 0.5,  la: 0.1,  ry: 0.3, hx: -0.34, hy: 0.0,  hmy: 0.2,  hz: 0.7,  hs: 1.12, ha: 1,   hl: 1 },
    { n: "network", x: 0.34,  y: 0,    my: 0.15, s: 1.1,  a: 1,    la: 0.2,  ry: 0.2, hx: -0.4,  hy: 0.05, hmy: 0.2,  hz: -1.6, hs: 0.8,  ha: 0.32, hl: 0.35 },
    { n: "geo",     x: 0,     y: 0,    my: 0.1,  s: 1.3,  a: 0.5,  la: 0.14, ry: 0.5, hx: 0,     hy: 0,    hmy: 0.1,  hz: -3,   hs: 0.6,  ha: 0,   hl: 0.2 },
    { n: "rings",   x: -0.3,  y: 0,    my: 0.1,  s: 1.0,  a: 0.55, la: 0.05, ry: 0.9, hx: 0,     hy: 0,    hmy: 0.1,  hz: -3,   hs: 0.6,  ha: 0,   hl: 0.2 },
    { n: "eclipse", x: 0,     y: 0,    my: 0.05, s: 1.15, a: 1,    la: 0.05, ry: 0,   hx: 0,     hy: 0.02, hmy: 0.05, hz: -0.9, hs: 0.62, ha: 0.9, hl: 0.7 },
  ];
  /* 2D fallback / no head: the earlier particle-portrait chapters */
  const KF_2D = [
    { n: "sphere",  x: 0.36,  y: -0.02, my: 0.18, s: 1.0,  a: 1,   la: 0.12, ry: 0 },
    { n: "human",   x: -0.42, y: 0,     my: 0.2,  s: 1.05, a: 1,   la: 0.05, ry: 0 },
    { n: "network", x: 0.34,  y: 0,     my: 0.15, s: 1.1,  a: 1,   la: 0.2,  ry: 0.2 },
    { n: "geo",     x: 0,     y: 0,     my: 0.1,  s: 1.3,  a: 0.5, la: 0.14, ry: 0.5 },
    { n: "rings",   x: -0.3,  y: 0,     my: 0.1,  s: 1.0,  a: 0.55, la: 0.05, ry: 0.9 },
    { n: "eclipse", x: 0,     y: 0,     my: 0.05, s: 1.15, a: 1,   la: 0.05, ry: 0 },
  ];
  let tops = [], ticking = false;
  const measure = () => { tops = IDS.map((id) => { const e = document.getElementById(id); return e ? e.getBoundingClientRect().top + scrollY : 0; }); };
  const update = () => {
    ticking = false;
    const q = scrollY + innerHeight * 0.55; let i = 0;
    for (let k = 0; k < tops.length; k++) if (q >= tops[k]) i = k;
    let t = 0; if (i < tops.length - 1) t = E.sstep(0.55, 1, (q - tops[i]) / (tops[i + 1] - tops[i]));
    E.tgtP = i + t; E.scrollTravel = scrollY * 0.012;
    const de = document.documentElement;
    de.style.setProperty("--prog", (scrollY / Math.max(1, de.scrollHeight - innerHeight)).toFixed(4));
    de.dataset.chapter = IDS[i];
    if (SD.onScroll) SD.onScroll(i);
    E.request();
  };
  SD.scroll = {
    useKeyframes() { E.kf = E.mode === "gl" && E.headReady ? KF_GL : KF_2D; },
    init() {
      SD.scroll.useKeyframes(); measure(); update();
      addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      addEventListener("resize", () => { measure(); update(); });
      addEventListener("load", () => { measure(); update(); });
      if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);
    },
    update, ids: IDS,
  };
})();
