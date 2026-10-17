/* PROJECT : ECLIPSE — site interactions
   One script, one listener per event type, all work batched with rAF. */
(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Boot screen ---------- */
  function initBoot() {
    const boot = $("#boot-screen");
    const log = $("#boot-log");
    const bar = $("#boot-progress-bar");
    const percent = $("#boot-percent");

    const messages = [
      "loading kernel modules...",
      "checking network stack...",
      "mounting security protocols...",
      "loading user profile...",
      "eclipse interface ready."
    ];

    let progress = 0;
    let messageIndex = 0;

    const timer = setInterval(() => {
      progress = Math.min(100, progress + Math.floor(Math.random() * 12) + 5);

      bar.style.width = `${progress}%`;
      percent.textContent = progress;

      if (messageIndex < messages.length && progress >= (messageIndex + 1) * 18) {
        const line = document.createElement("div");
        line.textContent = `[ OK ] ${messages[messageIndex++]}`;
        log.appendChild(line);
      }

      if (progress === 100) {
        clearInterval(timer);
        setTimeout(() => {
          boot.classList.add("done");
          $$(".reveal").slice(0, 2).forEach((el) => el.classList.add("visible"));
        }, 450);
      }
    }, 120);
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
    if (!canHover) return;

    const glow = $(".cursor-glow");
    const terminal = $(".terminal-window");

    let x = 0;
    let y = 0;
    let ticking = false;

    const update = () => {
      glow.style.transform = `translate3d(${x - 180}px, ${y - 180}px, 0)`;

      if (window.innerWidth >= 900) {
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
