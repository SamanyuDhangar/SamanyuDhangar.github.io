/* main.js — boot order: engine → scroll mapping → intro → interactions. Content is never blocked:
   if anything fails, the page simply shows its static (still fully styled) content. */
(function () {
  const SD = window.SD, html = document.documentElement;
  const safe = (fn) => { try { fn(); } catch (e) { console.warn(e); } };
  const cv = document.getElementById("stage");
  safe(SD.interactions); safe(SD.projects);
  let ok = false;
  safe(() => { ok = SD.engine.init(cv); });
  if (!ok) { html.classList.remove("is-intro"); html.classList.add("is-ready", "no-stage"); return; }
  safe(SD.scroll.init);
  SD.getShape("rings", SD.engine.N); SD.engine.setPair("rings", "rings"); SD.engine.start();
  SD.intro(() => {
    /* build the remaining formations while the browser is idle */
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
    ["sphere", "network", "geo", "eclipse", "human"].forEach((n, i) => idle(() => safe(() => SD.getShape(n, SD.engine.N)), { timeout: 1500 + i * 400 }));
  });
})();
