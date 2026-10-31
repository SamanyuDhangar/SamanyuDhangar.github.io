# Samanyu Dhangar — Infinite Darkness portfolio

Dependency-free WebGL. An endless particle universe, a real 3D head sculpture, and the original morphing
particle formations, all in one canvas (`#stage`) with a shared depth buffer.

## Structure
```
index.html
css/   main.css · animations.css · responsive.css
js/
  config.js       ← EDIT: email + TryHackMe profile (empty = link hidden)
  shapes.js       point-cloud formations (rings, sphere, network, geo, eclipse, human, dragon)
  head.js         3D head geometry (triangle mesh: skin, hair, beard, glasses, lenses, tilak)
  particles.js    engine: head pass → universe pass → morph pass; adaptive quality; safe 2D fallback
  scroll.js       chapters + keyframes (head position/lighting per chapter); native scroll only
  loader.js       intro (≈7 s, skippable, failsafe 10 s)
  interactions.js cursor ring, reveals, nav wave, project burst, nav state
  projects.js · lab.js · main.js
_backup_eclipse/  original files (optional; not published by Jekyll)
```

## Run locally
Open `index.html`, or `python3 -m http.server 8000` → http://localhost:8000

## Deploy
Copy `index.html css js assets README.md` to the root of the `SamanyuDhangar.github.io` repo and push.

## The 3D head — what it is
`js/head.js` builds ~26k vertices / 30k triangles at runtime. Proportions (cheek and jaw widths, lens spacing,
nose width, brow, beard line, hair volume, tilak position) were measured from the reference photo and sculpted
as parametric surfaces + displacement. It is a stylised sculpt guided by measurements, **not** a photogrammetry
or ML face scan. For a true scan: reconstruct with a tool such as FaceBuilder (Blender) or a FLAME/MediaPipe
pipeline, export GLB, and swap `SD.head.build()` for a GLB loader that returns the same vertex layout.

## Fallbacks
No WebGL / shader failure / lost context → a *fresh* canvas replaces the old one (a canvas that returned a WebGL
context can never return "2d"), then a Canvas2D starfield + the particle-portrait chapters run instead.
`prefers-reduced-motion` → no intro, no travel/pulses/flashes, static scene.
