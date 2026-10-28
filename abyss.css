/* PROJECT : ECLIPSE — ABYSS background
   A fixed, always-live, dark scene. It never listens to the cursor and never reads
   the scroll position, so nothing in it reacts to either.

   Layers, back to front (plus twinkling sparkles and soft bubbles in the canvas):
     1. liquid dark-matter with glowing contour veins   (canvas, low-res, smooth-scaled)
     2. faint hex lattice                               (canvas, drawn once)
     3. stars, powered hex cells, data streaks          (canvas)
     4. a dreamy pearl planet with soft rings and a little smiling moon (CSS)
     5. a huge slowly turning orrery of rings and nodes (SVG + CSS)
     6. a slow light sweep, then a dimming shade that keeps text readable (CSS)
   Colours come from --ab-a / --ab-b / --ab-c so the theme switcher re-colours everything. */

:root {
  --ab-a: 109, 255, 179;
  --ab-b: 123, 199, 255;
  --ab-c: 165, 139, 255;
}

#abyss {
  position: fixed;
  inset: 0;
  z-index: -999;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 2.4s ease;
  background: #03040a;
  contain: strict;
}
#abyss.live { opacity: 1; }
#abyss canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

/* ---------- dream planet (pearl globe, soft rings, a smiling moon) ---------- */
.abyss-planet {
  --p: 30vmin;
  position: absolute;
  right: calc(9vw - 2vmin);
  top: calc(19vh - 2vmin);
  width: var(--p);
  height: var(--p);
  animation: ab-float 11s ease-in-out infinite;
  will-change: transform;
}
.abyss-planet > * { position: absolute; }
.abyss-planet .glow {
  inset: -55%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(var(--ab-c), .22), rgba(var(--ab-b), .09) 50%, transparent 74%);
  animation: ab-breathe 8s ease-in-out infinite;
}
.abyss-planet .globe {
  inset: 0;
  border-radius: 50%;
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 26%, rgba(255, 255, 255, .75) 0, rgba(255, 255, 255, 0) 16%),
    radial-gradient(circle at 34% 30%, rgba(var(--ab-b), .95), rgba(var(--ab-c), .85) 48%, rgba(var(--ab-a), .55) 78%, rgba(var(--ab-c), .5));
  box-shadow: 0 0 50px 6px rgba(var(--ab-c), .35), 0 0 120px 20px rgba(var(--ab-b), .15);
}
.abyss-planet .globe::before {                       /* soft cloud bands */
  content: "";
  position: absolute;
  inset: -10%;
  background: repeating-linear-gradient(-14deg, transparent 0 9%, rgba(255, 255, 255, .13) 9% 12%, transparent 12% 21%, rgba(var(--ab-a), .16) 21% 24%);
  filter: blur(3px);
  animation: ab-bands 60s linear infinite;
}
.abyss-planet .globe::after {                        /* night side */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 26%, transparent 38%, rgba(3, 4, 14, .86) 100%);
}
.abyss-planet .ring { inset: 0; display: grid; place-items: center; transform: rotate(-20deg); pointer-events: none; }
.abyss-planet .ring i {
  grid-area: 1 / 1;
  width: 215%;
  height: 62%;
  background: radial-gradient(closest-side, transparent 66%, rgba(var(--ab-a), .0) 67%, rgba(var(--ab-a), .55) 71%, rgba(var(--ab-b), .35) 77%, transparent 79%, transparent 83%, rgba(var(--ab-c), .5) 86%, transparent 92%);
  border-radius: 50%;
}
.abyss-planet .ring .back  { clip-path: inset(0 0 50% 0); }
.abyss-planet .ring .front { clip-path: inset(50% 0 0 0); }
.abyss-planet .moon-orbit { inset: -26%; animation: ab-spin 46s linear infinite; will-change: transform; }
.abyss-planet .moon {
  position: absolute;
  left: -4%;
  top: 50%;
  width: 24%;
  aspect-ratio: 1;
  margin-top: -12%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 20% 66%, rgba(255, 140, 175, .65) 0 9%, transparent 10%),
    radial-gradient(circle at 80% 66%, rgba(255, 140, 175, .65) 0 9%, transparent 10%),
    radial-gradient(circle at 35% 48%, #1c1233 0 6.5%, transparent 7.5%),
    radial-gradient(circle at 65% 48%, #1c1233 0 6.5%, transparent 7.5%),
    radial-gradient(circle at 32% 26%, #fff 0, #ece4ff 30%, #b9a9ff 78%, #8d7ae0);
  box-shadow: 0 0 26px 4px rgba(var(--ab-c), .5), inset -8px -8px 16px rgba(60, 40, 140, .35);
  animation: ab-spin 46s linear infinite reverse;   /* keeps the face upright */
}
.abyss-planet .moon i {                              /* smile */
  position: absolute;
  left: 39%;
  top: 56%;
  width: 22%;
  height: 12%;
  border-bottom: 2px solid #1c1233;
  border-radius: 0 0 60% 60%;
}

/* ---------- orrery ---------- */
.abyss-orrery {
  position: absolute;
  width: 150vmin;
  height: 150vmin;
  left: -48vmin;
  bottom: -62vmin;
  opacity: .55;
  overflow: visible;
  fill: none;
}
.abyss-orrery .o-ring { stroke: rgba(var(--ab-b), .30); stroke-width: 1; }
.abyss-orrery .o-ticks { stroke: rgba(var(--ab-a), .34); stroke-width: 9; stroke-dasharray: 1.1 9.9; }
.abyss-orrery .o-dash { stroke: rgba(var(--ab-c), .34); stroke-dasharray: 3 9; }
.abyss-orrery .o-dash.fine { stroke: rgba(var(--ab-b), .30); stroke-dasharray: 1 6; }
.abyss-orrery .o-cross { stroke: rgba(var(--ab-a), .24); stroke-width: 1; }
.abyss-orrery .o-node { fill: rgb(var(--ab-a)); }
.abyss-orrery .o-node.b { fill: rgb(var(--ab-b)); }
.abyss-orrery .o-node.c { fill: rgb(var(--ab-c)); }
.abyss-orrery .o-spin { transform-origin: 300px 300px; animation: ab-spin 210s linear infinite; }
.abyss-orrery .o-spin-rev { transform-origin: 300px 300px; animation: ab-spin 300s linear infinite reverse; }
.abyss-orrery .o-slow { transform-origin: 300px 300px; animation: ab-spin 520s linear infinite; }

/* ---------- sweep + shade ---------- */
.abyss-sweep {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 32vh;
  background: linear-gradient(to bottom, transparent, rgba(var(--ab-a), .05) 60%, rgba(var(--ab-b), .12) 98%, transparent);
  transform: translateY(-40vh);
  animation: ab-sweep 19s linear infinite;
  will-change: transform;
}
.abyss-shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 38%, rgba(2, 3, 8, .10), rgba(2, 3, 8, .58) 100%),
    rgba(2, 3, 8, .30);
  transition: opacity 1.1s ease;
}
html.cinema .abyss-shade { opacity: .3; }

@keyframes ab-spin { to { transform: rotate(360deg); } }
@keyframes ab-breathe { 50% { opacity: .55; } }
@keyframes ab-float { 50% { transform: translateY(-16px); } }
@keyframes ab-bands { to { transform: translateX(-12%); } }
@keyframes ab-sweep { to { transform: translateY(125vh); } }

@media (max-width: 768px) {
  .abyss-planet { --p: 40vmin; right: 4vw; top: 8vh; opacity: .8; }
  .abyss-orrery { opacity: .4; }
}
@media (prefers-reduced-motion: reduce) {
  .abyss-planet, .abyss-planet .glow, .abyss-planet .moon-orbit, .abyss-planet .moon, .abyss-planet .globe::before,
  .abyss-orrery .o-spin, .abyss-orrery .o-spin-rev, .abyss-orrery .o-slow, .abyss-sweep { animation: none !important; }
  .abyss-sweep { display: none; }
}
