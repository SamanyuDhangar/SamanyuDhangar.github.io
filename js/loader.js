/* loader.js — cinematic intro driven directly through the particle engine:
   dust → orbital rings → dragon → approaches viewer → dissolves → hero sphere. ~6s, skippable. */
(function () {
  const SD = window.SD, E = SD.engine, html = document.documentElement;
  const ease = (x) => x * x * (3 - 2 * x), c01 = (x) => Math.min(1, Math.max(0, x));
  const seg = (t, a, b) => c01((t - a) / (b - a));
  const DUR = 6.2;
  let done = false;

  SD.intro = function (onDone) {
    const el = document.getElementById("intro"), skip = document.getElementById("intro-skip"), line = document.getElementById("intro-line");
    const finish = () => {
      if (done) return; done = true; E.direct = false; E.P = E.tgtP;
      html.classList.remove("is-intro"); html.classList.add("is-ready"); if (el) el.hidden = true;
      SD.revealStart && SD.revealStart(); onDone && onDone();
    };
    if (E.reduce || E.mode === "none" || E.mode === "lost") return finish();
    SD.getShape("dust", E.N); SD.getShape("rings", E.N); SD.getShape("dragon", E.N); SD.getShape("sphere", E.N);
    E.direct = true; E.setPair("dust", "dust");
    const t0 = performance.now(); let phase = 0;
    const hero = () => E.kfState(0);
    (function tick(now) {
      if (done) return;
      const t = Math.min(DUR, (now - t0) / 1000), S = E.S;
      let pair = ["dust", "rings"], mix = 0, dis = 0, scale = 1, cz = 4.2, ry = t * 0.25, rx = 0, alpha = seg(t, 0.4, 2);
      let label = "";
      if (t < 1.8) { pair = ["dust", "dust"]; scale = 1.1 - seg(t, 0, 1.8) * 0.1; label = "signal"; }
      else if (t < 3.0) { pair = ["dust", "rings"]; const u = ease(seg(t, 1.8, 2.7)); mix = u; dis = Math.sin(Math.PI * u) * 0.9; rx = 0.5 * u; label = "orbit"; }
      else if (t < 4.3) { pair = ["rings", "dragon"]; const u = ease(seg(t, 3.0, 4.0)); mix = u; dis = Math.sin(Math.PI * u) * 0.9; scale = 0.95; ry = 0.3 * (1 - u); rx = 0.5 * (1 - u); label = "form"; }
      else if (t < 5.2) { pair = ["dragon", "dragon"]; const u = ease(seg(t, 4.3, 5.2)); scale = 0.95 + u * 1.5; cz = 4.2 - u * 0.7; ry = 0; label = "approach"; }
      else { pair = ["dragon", "sphere"]; const u = ease(seg(t, 5.2, DUR)); mix = u; dis = Math.sin(Math.PI * u) * 1.3; scale = lerpN(2.45, 1, u); cz = lerpN(3.5, 4.2, u); ry = 0; label = "emerge"; }
      E.setPair(pair[0], pair[1]);
      const u2 = ease(seg(t, 5.6, DUR)), h = hero();
      Object.assign(S, { mix, dis, scale, cz, ry: lerpN(ry, h.ry, u2), rx, alpha: lerpN(alpha, h.alpha, u2), ox: lerpN(0, h.ox, u2), oy: lerpN(0, h.oy, u2), la: 0 });
      if (line) line.textContent = label;
      if (t >= DUR) return finish();
      requestAnimationFrame(tick);
    })(t0);
    function lerpN(a, b, u) { return a + (b - a) * u; }
    if (skip) { skip.onclick = finish; skip.focus({ preventScroll: true }); }
    setTimeout(finish, 9000); // failsafe — content is never held hostage
  };
})();
