# PROJECT : ECLIPSE

Cybersecurity / Cloud Security / AI Security portfolio for **Samanyu Dhangar**.

A single-page, framework-free site (HTML + CSS + JavaScript) with a live, physics-driven black hole in the background. Nothing on the canvas is a pre-rendered animation: every star, disk particle and orbit is simulated in real time.

> **Built with the help of [Claude](https://claude.ai) (Anthropic).** The content, direction and design decisions are Samanyu's. Claude helped write and refine the code, including the physics simulation, the loader and performance tuning.

---

## Features

- **Chamber-of-Secrets loader:** a serpent weaves over and under a progress bar; a vault door engraved with coiled snakes then slides open.
- **Relativistic black hole background** (`particles.js`), described below.
- **Sections:** About, Skills, Journey, Projects (including Tools), Credentials, Contact.
- **Interactions:** cursor glow, terminal parallax, project-card tilt, scroll reveals, responsive menu.
- **Performance aware:** adaptive canvas resolution, eased scroll, pauses when the tab is hidden, respects `prefers-reduced-motion`.

## Run locally

Open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure and content |
| `style.css` | Layout, theme, loader and vault-door styling |
| `script.js` | Loader, header, reveal-on-scroll, pointer effects |
| `particles.js` | The black hole physics simulation (canvas) |
| `particles.css` | Canvas layer styling |
| `blackhole.js` | Small decorative accent (not used by `index.html`) |

---

## The physics and mathematics behind the background

The simulation uses **geometric units, G = c = M = 1**. One length unit is the gravitational radius *Rg = GM/c²*, and one time unit is *GM/c³*. It is inspired by a Sagittarius A*-like black hole (about 4.3 million solar masses). It is a real-time visual model, not a research-grade ray tracer: some effects are simplified so they run smoothly in a browser.

### 1. General relativity

| Concept | How it is used |
|---|---|
| **Schwarzschild metric** (non-rotating black hole) | Disk particles and halo debris follow timelike geodesics in the equatorial plane. |
| **Binet-form orbit equation** | `r'' = −M/r² + L²/r³ − 3ML²/r⁴`. The last term is the relativistic correction to Newtonian gravity. |
| **Event horizon**, `r = 2M` | A body crossing it is swallowed and respawned. |
| **ISCO** (innermost stable circular orbit), `r = 6M` | Below angular momentum `L = 2√3·M` no stable circular orbit exists, so matter plunges inward. |
| **Perihelion (periapsis) precession** | Orbits are not closed ellipses; they rotate by about `6πM/p` per orbit. This emerges from the equations. |
| **Photon sphere and shadow**, `b = 3√3·M ≈ 5.196` | The black disc in the middle is the capture shadow; nothing behind it is visible. |

### 2. Numerical methods

- **Symplectic velocity-Verlet integration:** keeps orbital energy from drifting over long runs.
- **Adaptive per-body time steps:** smaller steps near the hole where gravity changes quickly.
- **State reconstruction after a kick:** when the cursor perturbs a particle, its energy, angular momentum and orbital plane are rebuilt from Cartesian position and velocity.

### 3. Gravitational lensing

- **Thin point-lens equation:** `θ² − βθ − θE² = 0`, giving a primary and a secondary image of each star.
- **Magnification:** `μ± = (u²+2) / (2u√(u²+4)) ± ½`, where `u = β/θE`.
- **Einstein radius** `θE`: sets the scale where stars stretch into **arcs**. Stars are stretched tangentially by `θ/β` and radially by `1/|1−(θE/θ)⁴|`.
- The far side of the accretion disk is lifted over the hole, as in the famous black hole images.

### 4. Relativistic light effects

- **Gravitational redshift** and **relativistic Doppler shift**, combined in one factor: `g = f / [E(1 − n·v)]`.
- **Relativistic beaming:** brightness scales roughly as `g³`, so the approaching side of the disk is **brighter and bluer**, and the receding side is dimmer and redder.
- **Photon ring** with the same Doppler asymmetry.

### 5. Accretion disk astrophysics

- **Shakura-Sunyaev thin-disk model:** temperature profile `T(r) ∝ r^(−3/4) · (1 − √(r_in/r))^(1/4)`.
- **Viscous torque:** removes angular momentum so the disk gradually spirals inward.
- **Blackbody radiation:** temperature is converted to colour through a precomputed Kelvin-to-RGB table (hot is blue-white, cool is orange-red).
- **Relativistic jets:** bipolar jets with Doppler boosting; the jet pointing at you is bright, the counter-jet is dim.

### 6. Classical mechanics

- **Restricted three-body problem:** your cursor acts as a small third gravitating body (Plummer-softened, `1/(d² + ε²)^(3/2)`), producing real **gravitational slingshots**.
- **Drifting stars:** extra stars roam with a random walk (Brownian-style jitter) plus a softened Newtonian `1/r²` pull toward the hole. Ones that get too close are swallowed and respawn at the edge.
- **Observer inclination:** scrolling smoothly changes the viewing angle of the disk.

### 7. Maths in the interface

- **Sine wave** `y = A·sin(2πx/λ)` and its derivative (slope) draw the loader snake and rotate its head along the curve.
- **Exponential smoothing**, `value += (target − value)·(1 − e^(−k·dt))`, gives frame-rate-independent easing for scroll, the loader and the black hole fade-in.
- **Spiral** `r = r₀ + kθ` shapes the coiled serpents on the vault door.
- **Sampling distributions** (for example `r^1.5` uniform sampling) reproduce the steady-state density of an accretion flow.

---

## Credits

- Concept, content and design direction: **Samanyu Dhangar**
- Code assistance and physics simulation: **Claude, by Anthropic**
- Fonts: JetBrains Mono and Space Grotesk (Google Fonts)


