/* PROJECT : ECLIPSE — site interactions
   One script, one listener per event type, all work batched with rAF. */
(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Boot screen: snake loader + Chamber-of-Secrets vault door ---------- */
  function vaultSVG() {
    // coiled serpent spiral, generated once and reused in both door halves
    const spiral = (rot) => {
      const pts = [];
      for (let t = 0; t <= 3.7 * Math.PI; t += 0.12) {
        const r = 12 + t * 6.4;
        const a = t + rot;
        pts.push([100 + r * Math.cos(a), 100 + r * Math.sin(a)]);
      }
      const d = "M" + pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
      const e = pts[pts.length - 1], q = pts[pts.length - 2];
      const ang = (Math.atan2(e[1] - q[1], e[0] - q[0]) * 180) / Math.PI;
      return `<path d="${d}" fill="none" stroke="#0f3d2a" stroke-width="5" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="#2bd68c" stroke-width="5" stroke-linecap="round" stroke-dasharray="1.2 4.2" opacity=".6"/>
        <g transform="translate(${e[0].toFixed(1)} ${e[1].toFixed(1)}) rotate(${ang.toFixed(1)})">
          <ellipse cx="3" cy="0" rx="7" ry="4.2" fill="#13674a"/>
          <circle cx="5" cy="-1.8" r=".9" fill="#ff647c"/><circle cx="5" cy="1.8" r=".9" fill="#ff647c"/>
        </g>`;
    };
    let spokes = "";
    for (let i = 0; i < 12; i++) {
      spokes += `<line x1="100" y1="${100 - 70}" x2="100" y2="${100 - 96}" stroke="#14513a" stroke-width="2.4" transform="rotate(${i * 30} 100 100)"/>`;
    }
    return `<svg class="vault" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <circle cx="100" cy="100" r="98" fill="none" stroke="#14513a" stroke-width="1.5"/>
      <circle cx="100" cy="100" r="92" fill="none" stroke="#0f3a2a" stroke-width="1" stroke-dasharray="2 5"/>
      <g class="vault-spin-rev">${spokes}</g>
      <circle cx="100" cy="100" r="68" fill="rgba(3,10,8,.7)" stroke="#14513a" stroke-width="1.2"/>
      <g class="vault-spin">${spiral(0)}${spiral(Math.PI)}</g>
      <circle cx="100" cy="100" r="9" fill="#04120c" stroke="#2bd68c" stroke-width="1.2"/>
    </svg>`;
  }

  function initBoot() {
    const boot = $("#boot-screen");
    const log = $("#boot-log");
    const percent = $("#boot-percent");
    const svg = $("#boot-snake-svg");

    // vault emblem inside both door halves
    $$(".boot-door", boot).forEach((door) => door.insertAdjacentHTML("beforeend", vaultSVG()));

    // upgrade: energy glow behind the text, a shockwave ring, and an ACCESS GRANTED stamp
    boot.insertAdjacentHTML("afterbegin", '<div class="boot-glow"></div>');
    boot.insertAdjacentHTML("beforeend", '<div class="boot-ring"></div>');
    $(".boot-percent", boot).insertAdjacentHTML("afterend", '<div class="boot-granted">ACCESS GRANTED</div>');

    /* ----- snake geometry: a sine wave weaving over/under a straight bar ----- */
    const NS = "http://www.w3.org/2000/svg";
    const W = 680, MID = 32, AMP = 15, LAMBDA = 120, HALF = LAMBDA / 2;
    const yAt = (x) => MID + AMP * Math.sin((2 * Math.PI * x) / LAMBDA);
    const dyAt = (x) => AMP * Math.cos((2 * Math.PI * x) / LAMBDA) * ((2 * Math.PI) / LAMBDA);

    let d = "";
    for (let x = 0; x <= W; x += 2) d += (x ? " L" : "M") + x + " " + yAt(x).toFixed(2);

    // clip regions: front = snake below the bar (sin > 0), back = above it
    const clipRects = (front) => {
      let out = "";
      for (let k = 0; k * HALF < W; k++) {
        const isFront = k % 2 === 0;
        if (isFront === front) out += `<rect x="${k * HALF}" y="-20" width="${HALF}" height="110"/>`;
      }
      return out;
    };

    svg.innerHTML = `
      <defs>
        <clipPath id="snk-front">${clipRects(true)}</clipPath>
        <clipPath id="snk-back">${clipRects(false)}</clipPath>
        <mask id="snk-reveal"><rect id="snk-reveal-rect" x="-10" y="-20" width="0" height="110" fill="#fff"/></mask>
      </defs>
      <line class="bar-track" x1="0" y1="${MID}" x2="${W}" y2="${MID}"/>
      <line id="snk-fill" class="bar-fill" x1="0" y1="${MID}" x2="0" y2="${MID}"/>
      <g mask="url(#snk-reveal)">
        <g clip-path="url(#snk-back)">
          <path class="snake-glow" d="${d}"/><path class="snake-body" d="${d}"/><path class="snake-scales" d="${d}"/>
        </g>
      </g>
      <line class="bar-track" x1="0" y1="${MID}" x2="${W}" y2="${MID}" style="stroke:#26323b"/>
      <g mask="url(#snk-reveal)">
        <g clip-path="url(#snk-front)">
          <path class="snake-glow" d="${d}"/><path class="snake-body" d="${d}"/><path class="snake-scales" d="${d}"/>
        </g>
      </g>
      <g id="snk-head" opacity="0">
        <path class="snake-tongue" d="M9 0 L16 0 M16 0 L19 -2.6 M16 0 L19 2.6"/>
        <ellipse class="snake-head" cx="2" cy="0" rx="9" ry="6"/>
        <circle class="snake-eye" cx="3.5" cy="-2.6" r="1.4"/>
        <circle class="snake-eye" cx="3.5" cy="2.6" r="1.4"/>
      </g>`;

    const reveal = $("#snk-reveal-rect");
    const fill = $("#snk-fill");
    const head = $("#snk-head");

    const messages = [
      "loading kernel modules...",
      "checking network stack...",
      "mounting security protocols...",
      "calibrating aurora lattice...",
      "loading user profile...",
      "eclipse interface ready."
    ];

    let target = 0;       // where the loader wants to be (0–100)
    let shown = 0;        // eased value actually drawn
    let messageIndex = 0;
    let finished = false;
    let last = performance.now();
    let nextBump = last + 140;

    const paint = () => {
      const x = (shown / 100) * W;
      reveal.setAttribute("width", String(x + 10 + 10));
      fill.setAttribute("x2", String(x));
      const y = yAt(x);
      const ang = (Math.atan2(dyAt(x), 1) * 180) / Math.PI;
      head.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      head.setAttribute("opacity", shown > 0.3 ? "1" : "0");
      const pct = Math.round(shown);
      percent.textContent = pct;
      boot.style.setProperty("--p", (shown / 100).toFixed(3));   // drives the vault glow

      while (messageIndex < messages.length && pct >= (messageIndex + 1) * (96 / messages.length)) {
        const line = document.createElement("div");
        line.textContent = `[ OK ] ${messages[messageIndex++]}`;
        log.appendChild(line);
      }
    };

    const open = () => {
      boot.classList.add("opening");                       // doors slide apart
      setTimeout(() => {
        $$(".reveal").slice(0, 2).forEach((el) => el.classList.add("visible"));
        window.dispatchEvent(new Event("eclipse:ready"));  // lets the black hole fade in
      }, 650);
      setTimeout(() => boot.classList.add("done"), 1900);
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (now >= nextBump && target < 100) {
        target = Math.min(100, target + Math.floor(Math.random() * 12) + 5);
        nextBump = now + 120;
      }
      shown += (target - shown) * (1 - Math.exp(-dt * 7));
      if (target >= 100 && shown > 99.6) shown = 100;
      paint();
      if (shown >= 100) {
        if (!finished) {
          finished = true;
          boot.classList.add("granted");                    // ACCESS GRANTED + shockwave
          setTimeout(open, 900);
        }
        return;
      }
      requestAnimationFrame(tick);
    };
    paint();
    requestAnimationFrame(tick);
  }

  /* ---------- Header: background, hide on scroll, mobile menu ---------- */
  function initHeader() {
    const topbar = $(".topbar");
    const menu = $("#menu-toggle");
    const nav = $("#nav");
    const navLinks = $$("#nav a");

    let lastY = 0;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      topbar.classList.toggle("scrolled", y > 30);
      // hide while scrolling down, show while scrolling up (never while menu is open)
      topbar.classList.toggle("hide", y > lastY && y > 160 && !nav.classList.contains("open"));
      lastY = Math.max(y, 0);
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    }, { passive: true });
    onScroll();

    const setMenu = (open) => {
      nav.classList.toggle("open", open);
      menu.textContent = open ? "CLOSE" : "MENU";
      menu.setAttribute("aria-expanded", String(open));
    };

    menu.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
    navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));

    // Active link — IntersectionObserver instead of measuring offsets on every scroll
    const setActive = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
      });
    };
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id));
    }, { rootMargin: "-35% 0px -60% 0px" });

    $$("main section[id]").forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    $$(".reveal").forEach((el) => observer.observe(el));
  }

  /* ---------- Pointer effects (cursor glow + terminal parallax) ---------- */
  function initPointerEffects() {
    const glow = $(".cursor-glow");
    if (!canHover || !glow) return;   // the cursor glow was removed with the old background
    const terminal = null; // hero terminal replaced by the access badge (see experience.js)

    let x = 0;
    let y = 0;
    let ticking = false;

    const update = () => {
      glow.style.transform = `translate3d(${x - 180}px, ${y - 180}px, 0)`;

      if (terminal && window.innerWidth >= 900) {
        const nx = (x / window.innerWidth - 0.5) * 2;
        const ny = (y / window.innerHeight - 0.5) * 2;
        terminal.style.transform =
          `perspective(1000px) rotateY(${-4 + nx * 1.5}deg) rotateX(${2 - ny * 1.2}deg)`;
      }
      ticking = false;
    };

    window.addEventListener("pointermove", (event) => {
      x = event.clientX;
      y = event.clientY;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
  }

  /* ---------- Project card tilt ---------- */
  function initCardTilt() {
    if (!canHover) return;

    $$(".project-card").forEach((card) => {
      let ticking = false;
      let event;

      const update = () => {
        const rect = card.getBoundingClientRect();
        const dx = (event.clientX - rect.left) / rect.width - 0.5;
        const dy = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--ry", `${dx * 14}deg`);
        card.style.setProperty("--rx", `${-dy * 14}deg`);
        ticking = false;
      };

      card.addEventListener("pointermove", (e) => {
        event = e;
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      }, { passive: true });

      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--rx");
        card.style.removeProperty("--ry");
      });
    });
  }

  /* ---------- Placeholder project links ---------- */
  function initPlaceholderLinks() {
    const toast = $("#toast");
    let hideTimer;

    $$(".project-link[data-placeholder]").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (link.getAttribute("href") !== "#") return;
        event.preventDefault();
        toast.textContent = `// ${link.dataset.placeholder}`;
        toast.classList.add("show");
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => toast.classList.remove("show"), 2600);
      });
    });
  }

  /* ---------- Init ---------- */
  initBoot();
  initHeader();
  initReveal();
  initPointerEffects();
  initCardTilt();
  initPlaceholderLinks();
  $("#year").textContent = new Date().getFullYear();
})();
