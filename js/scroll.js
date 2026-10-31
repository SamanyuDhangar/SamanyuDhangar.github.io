/* scroll.js — native scrolling only (no hijacking). Maps scroll position to a float "progress"
   through the sections; the engine turns that into morphs, dissolves and camera/offset changes. */
(function () {
  const SD = window.SD, E = SD.engine;
  const IDS = ["hero", "about", "skills", "work", "contact"];
  E.kf = [
    { n: "sphere",  x: 0.36,  y: -0.02, my: 0.18,  s: 1.0,  a: 1,    la: 0.12, ry: 0 },
    { n: "human",   x: -0.42, y: 0,     my: 0.2,   s: 1.05, a: 1,    la: 0.05, ry: 0 },
    { n: "network", x: 0.34,  y: 0,     my: 0.15,  s: 1.1,  a: 1,    la: 0.2,  ry: 0.2 },
    { n: "geo",     x: 0.0,   y: 0,     my: 0.1,   s: 1.3,  a: 0.5,  la: 0.14, ry: 0.5 },
    { n: "eclipse", x: 0.0,   y: 0,     my: 0.05,  s: 1.15, a: 1,    la: 0.05, ry: 0 },
  ];
  let tops = [], ticking = false;
  const measure = () => { tops = IDS.map((id) => { const e = document.getElementById(id); return e ? e.getBoundingClientRect().top + scrollY : 0; }); };
  const update = () => {
    ticking = false;
    const q = scrollY + innerHeight * 0.55; let i = 0;
    for (let k = 0; k < tops.length; k++) if (q >= tops[k]) i = k;
    let t = 0; if (i < tops.length - 1) t = E.sstep(0.55, 1, (q - tops[i]) / (tops[i + 1] - tops[i]));
    E.tgtP = i + t;
    document.documentElement.style.setProperty("--sy", scrollY);
    document.documentElement.style.setProperty("--prog", (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)).toFixed(4));
    if (SD.onScroll) SD.onScroll(i);
    E.request();
  };
  SD.scroll = {
    init() {
      measure(); update();
      addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      addEventListener("resize", () => { measure(); update(); });
      addEventListener("load", () => { measure(); update(); });
      if (window.ResizeObserver) new ResizeObserver(() => { measure(); }).observe(document.body);
    },
    update,
  };
})();
