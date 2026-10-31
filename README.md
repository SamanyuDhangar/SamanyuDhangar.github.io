
# Samanyu Dhangar — Immersive Particle Portfolio

A dependency-free, GitHub Pages–ready portfolio. One WebGL particle field morphs through the whole page:
dust → orbital rings → abstract dragon (intro) → organic sphere → particle portrait (glasses + tilak) → network → geometric forms → eclipse.

## Structure
```
index.html
css/main.css  animations.css  responsive.css
js/config.js       ← EDIT: email + TryHackMe profile (empty = link hidden)
js/shapes.js       point-cloud generators (dragon, portrait, network, …)
js/particles.js    WebGL engine (+ Canvas2D fallback), adaptive quality
js/scroll.js       scroll → section progress → keyframes (native scroll only)
js/loader.js       cinematic intro (skippable, ~6s)
js/interactions.js cursor ring, reveals, split text, nav, magnetic CTA
js/projects.js     the three project visuals (2D canvas, only run on-screen)
js/lab.js          original password + HTTP-header tools (local only)
_backup_eclipse/   your original index.html / style.css / script.js (not published by Jekyll)
```

## Run locally
Open `index.html` directly, or `python3 -m http.server 8000` and visit http://localhost:8000.

## Deploy
Copy everything to the repository root of `SamanyuDhangar.github.io` and push. No build step, no external scripts
(only optional Google Fonts, with system fallbacks).

## Performance
~6.5k particles on mid-range desktops (9k on 8+ cores, 3.6k mobile), DPR capped at 1.5, auto-reduces particle count
if frames run slow, pauses when the tab is hidden, frees GL resources on page hide, Canvas2D fallback without WebGL,
static (no-motion, no intro) mode under `prefers-reduced-motion`.
