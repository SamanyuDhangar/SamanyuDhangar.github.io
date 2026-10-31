/* loader.js — "system coming online" (≈7 s max, skippable, never blocks content):
   darkness → a few distant particles → space fills with light → layered orbital rings assemble →
   the 3D head emerges as silhouette/rim-light/reflections → lights come up → portfolio. */
(function () {
  const SD = window.SD, E = SD.engine, html = document.documentElement;
  const ease = (x) => x * x * (3 - 2 * x), c01 = (x) => Math.min(1, Math.max(0, x)), seg = (t, a, b) => c01((t - a) / (b - a)), mix = (a, b, u) => a + (b - a) * u;
  const DUR = 7.2;
  let done = false;

  SD.intro = function (onDone) {
    const el = document.getElementById("intro"), skip = document.getElementById("intro-skip"), line = document.getElementById("intro-line"), bar = document.getElementById("intro-bar");
    const finish = () => {
      if (done) return; done = true; E.direct = false; E.P = E.tgtP;
      html.classList.remove("is-intro"); html.classList.add("is-ready"); if (el) el.hidden = true;
      SD.revealStart && SD.revealStart(); onDone && onDone(); E.request();
    };
    if (E.reduce || E.mode === "none") return finish();
    ["dust", "rings", "sphere"].forEach((n) => SD.getShape(n, E.N));
    E.direct = true; E.setPair("dust", "dust");
    const hasHead = E.mode === "gl" && E.headReady, t0 = performance.now(), words = ["signal", "space", "structure", "identity"];
    (function tick(now) {
      if (done) return;
      const t = Math.min(DUR, (now - t0) / 1000), S = E.S, h0 = E.kfState(0), end = ease(seg(t, 6.0, DUR));
      /* universe: a few far points → dense, lit space */
      S.ua = ease(seg(t, 0.5, 2.4)); S.uk = mix(0.04, 1, ease(seg(t, 0.6, 4.2)));
      /* rings assemble from dust */
      const asm = ease(seg(t, 2.2, 4.4));
      E.setPair("dust", "rings");
      S.mix = asm; S.dis = Math.sin(Math.PI * asm) * 0.9; S.scale = mix(1.7, 1.2, asm); S.rx = 0.55 * asm; S.ry = t * 0.35; S.alpha = ease(seg(t, 2.0, 3.4)) * 0.9; S.la = 0; S.cz = 4.2;
      S.ox = mix(0, h0.ox, end); S.oy = mix(0, h0.oy, end); S.scale = mix(S.scale, h0.scale, end); S.rx = mix(S.rx, 0, end); S.ry = mix(S.ry, h0.ry, end); S.alpha = mix(S.alpha, h0.alpha, end);
      /* head: silhouette first (no key light), then lights come up */
      const hv = ease(seg(t, 4.3, 5.6)), lit = ease(seg(t, 5.0, 6.8)), H = S.h;
      H.a = hasHead ? hv : 0; H.lit = lit; H.s = mix(0.85, 1, hv); H.oz = mix(-1.8, 0, hv); H.ox = mix(0.0, h0.h.ox, end); H.oy = mix(0, h0.h.oy, end); H.ry = (1 - hv) * 0.5;
      if (line) line.textContent = words[Math.min(3, (t / 1.8) | 0)];
      if (bar) bar.style.transform = "scaleX(" + (t / DUR).toFixed(3) + ")";
      if (t >= DUR) return finish();
      requestAnimationFrame(tick);
    })(t0);
    if (skip) { skip.onclick = finish; skip.focus({ preventScroll: true }); }
    setTimeout(finish, 10000); /* failsafe — content is never held hostage */
  };
})();
