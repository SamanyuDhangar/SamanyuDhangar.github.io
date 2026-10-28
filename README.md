# PROJECT : ECLIPSE

Cybersecurity / Cloud Security / AI Security portfolio for **Samanyu Dhangar**.

A single-page, framework-free site (HTML + CSS + JavaScript) with an original, always-live background called **Abyss**. Nothing in it is a video or a pre-rendered animation: it is simulated in real time.

> **Built with the help of [Claude](https://claude.ai) (Anthropic).** The content, direction and design decisions are Samanyu's. Claude helped write and refine the code, including the background, the loader and performance tuning.

---

## Features

- **Chamber-of-Secrets loader:** a serpent weaves over and under a progress bar, the vault glows as it fills, then reads ACCESS GRANTED and the vault door slides open.
- **Abyss background** (`abyss.js` + `abyss.css`), described below.
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
| `abyss.js` | Background engine: dark-matter veins, hex lattice, stars, streaks (canvas) |
| `abyss.css` | Background CSS layers: eclipse, orrery, light sweep |
| `clarity.css` | Readability layer: slabs, contrast, solid text |
| `extras.js` / `extras.css` | Palette, themes, sound, cinema mode, lab |
| `experience.css` / `experience.js` | Redesign layer: badge, orbit map, mission tabs, interactive shell, scroll effects |
| `upgrade.css` | Visual polish layer: palette extension, buttons, cards, headings, loader upgrades |

---

## The Abyss background

A dark, always-live scene that never reacts to the cursor or the scroll position:

| Layer | What it is |
|---|---|
| **Dark matter** | A domain-warped noise field drawn as deep ink with thin glowing contour veins (canvas, low-res, smooth-scaled). |
| **Hex lattice** | A faint hexagon grid; random cells power up and fade. |
| **Stars + data streaks** | Drifting, twinkling stars and the occasional packet streaking across the sky. |
| **Eclipse** | A black disc with a rotating corona and a diamond flare that travels around its rim (CSS). |
| **Orrery** | A huge, slowly turning set of rings and nodes (SVG + CSS). |

Colours come from `--ab-a/b/c`, so the theme switcher re-colours everything live.

## Surprise features

- **Command palette** — `Ctrl/⌘ + K` or `/`
- **4 colour themes** — dock button or `theme` in the shell
- **Ambient sound** — off by default
- **Cinema mode** — press `V` (Esc to return)
- **Root access** — Konami code, `matrix` in the shell, or click the logo 5 times
- **Lab** — password strength estimator and hash generator, fully local

## Credits

- Concept, content and design direction: **Samanyu Dhangar**
- Code assistance and background design: **Claude, by Anthropic**
- Fonts: JetBrains Mono and Space Grotesk (Google Fonts)
