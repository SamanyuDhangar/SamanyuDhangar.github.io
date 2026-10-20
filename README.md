# PROJECT : ECLIPSE

Cybersecurity / Cloud Security / AI Security portfolio for **Samanyu Dhangar**.

A single-page, framework-free site (HTML + CSS + JavaScript) with an original, always-live background called **Aurora Lattice**. Nothing in it is a video or a pre-rendered animation: the ribbons, nodes and data packets are simulated in real time.

> **Built with the help of [Claude](https://claude.ai) (Anthropic).** The content, direction and design decisions are Samanyu's. Claude helped write and refine the code, including the background, the loader and performance tuning.

---

## Features

- **Chamber-of-Secrets loader:** a serpent weaves over and under a progress bar, the vault glows as it fills, then reads ACCESS GRANTED and the vault door slides open.
- **Aurora Lattice background** (`cosmos.js` + `cosmos.css`), described below.
- **Sections:** About, Mission, Skills, Journey, Projects (including Tools), Credentials, Shell, Contact.
- **Interactions:** decrypting name with mouse-reactive glitch depth, holographic access badge, scroll-scrubbed text, redacted profile, scroll-velocity marquee, target-lock mission tabs, rotating skill orbit map, packet-on-a-wire journey timeline, cursor spotlight cards, stamped credentials, a working interactive shell, section rail, cursor ring, magnetic buttons, responsive menu.
- **Performance aware:** adaptive background quality, pauses when the tab is hidden, respects `prefers-reduced-motion`.

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
| `cosmos.js` | Background engine: flow-field ribbons, packet network, glyph rain, stars (canvas) |
| `cosmos.css` | Background CSS layers: aurora curtains, light rays, perspective floor |
| `experience.css` / `experience.js` | Redesign layer: badge, orbit map, mission tabs, interactive shell, scroll effects |
| `upgrade.css` | Visual polish layer: palette extension, buttons, cards, headings, loader upgrades |

---

## The Aurora Lattice background

It never reads the scroll position, so scrolling cannot change it or slow it down.

| Layer | What it is |
|---|---|
| **Aurora curtains and rays** | Large soft gradients drifting slowly, plus vertical light rays. CSS only, animating `transform` on the GPU. |
| **Perspective floor** | A grid racing toward the viewer. |
| **Flow-field ribbons** | About 500 particles follow an invisible, slowly evolving angle field built from layered sine waves, leaving fading trails. |
| **Packet network** | Drifting nodes link when close. Packets hop from node to node; an occasional rose "threat" packet is blocked with a shield pulse. |
| **Glyph rain and stars** | Hex characters fall along both screen edges; stars twinkle. |
| **Cursor** | Acts as a magnet: ribbons swirl around it, nearby nodes pull into a mesh and link to it. |
| **Click / tap** | Sends a shockwave through the network. |

Performance: one animation loop capped near 60 fps, batched strokes, pre-rendered sprites, an automatic quality ladder, and the engine stays idle until the loader finishes.

---

## Credits

- Concept, content and design direction: **Samanyu Dhangar**
- Code assistance and background design: **Claude, by Anthropic**
- Fonts: JetBrains Mono and Space Grotesk (Google Fonts)
