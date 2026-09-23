const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", () => {
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

  const bootTimer = setInterval(() => {
    progress += Math.floor(Math.random() * 12) + 5;
    if (progress > 100) progress = 100;

    bar.style.width = `${progress}%`;
    percent.textContent = progress;

    if (messageIndex < messages.length && progress >= (messageIndex + 1) * 18) {
      const line = document.createElement("div");
      line.textContent = `[ OK ] ${messages[messageIndex]}`;
      log.appendChild(line);
      messageIndex++;
    }

    if (progress === 100) {
      clearInterval(bootTimer);
      setTimeout(() => {
        boot.classList.add("done");
        $$(".reveal").slice(0, 2).forEach(el => el.classList.add("visible"));
      }, 450);
    }
  }, 120);

  // Mouse-following glow
  const glow = $(".cursor-glow");
  window.addEventListener("pointermove", (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  });

  // Navbar background + active section
  const topbar = $(".topbar");
  const sections = $$("main section[id]");
  const navLinks = $$("nav a");

  const updateNav = () => {
    topbar.classList.toggle("scrolled", window.scrollY > 30);

    let current = "home";
    sections.forEach(section => {
      const top = section.offsetTop - 160;
      if (window.scrollY >= top) current = section.id;
    });

    navLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  };

  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

  // Mobile menu
  const menu = $("#menu-toggle");
  const nav = $("#nav");

  menu.addEventListener("click", () => {
    nav.classList.toggle("open");
    menu.textContent = nav.classList.contains("open") ? "CLOSE" : "MENU";
  });

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menu.textContent = "MENU";
    });
  });

  // Reveal on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  $$(".reveal").forEach(el => observer.observe(el));

  // Small parallax on the hero terminal
  const terminal = $(".terminal-window");
  window.addEventListener("pointermove", (event) => {
    if (window.innerWidth < 900) return;
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;
    terminal.style.transform =
      `perspective(1000px) rotateY(${-4 + x * 1.5}deg) rotateX(${2 - y * 1.2}deg)`;
  });

  // Placeholder project links
  const toast = $("#toast");
  $$(".project-link[data-placeholder]").forEach(link => {
    link.addEventListener("click", (event) => {
      if (link.getAttribute("href") === "#") {
        event.preventDefault();
        toast.textContent = `// ${link.dataset.placeholder}`;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2600);
      }
    });
  });

  // Footer year
  $("#year").textContent = new Date().getFullYear();
});
