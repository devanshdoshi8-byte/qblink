# Qblink Design Direction (`DESIGN.md`)

**Product:** Qblink — Customer Flow Intelligence Platform for walk-in businesses.
**Dial:** `ENERGY 2 / RHYTHM 2 / MOTION 1` (marketing surfaces) · `ENERGY 1 / RHYTHM 2 / MOTION 1` (operational counter, customer pass, and admin surfaces).

## Visual Identity
- **Grounding motif:** Physical queue signage, printed numbered tickets, and reception clipboards translated to the web.
- **Core Palette (R-29 capped):**
  - **Maritime Navy:** `hsl(215 58% 13%)` (`#0e1e34`) — primary ink in light mode, dark stage and card canvas in dark mode.
  - **Coastal Teal:** `hsl(195 78% 28%)` (`#10637f` light) / `hsl(180 48% 54%)` (`#51c2c2` dark) — single deliberate interactive primary accent.
  - **Warm Paper Cream:** `hsl(40 20% 98%)` (`#fbfaf9` background) / `hsl(42 24% 94%)` (`#f3f1ec` breakout) / `hsl(44 30% 93%)` (`#f3f0e8` dark-mode ink/cream).
- **Neutral Controls:** `--secondary` and shadcn hover `--accent` remain low-saturation slate/teal surfaces paired with high-contrast foreground ink (`>= 7.0:1`).
- **Semantic Status:** `--success`, `--warning`, `--danger`/`--destructive`, `--info` paired with explicit text/icon cues (never color-only status).
- **Charts:** `--chart-1` through `--chart-6` in `src/index.css`, adaptive across Light and Dark modes (`>= 4.2:1` against `--card`).

## Forbidden Patterns
- **Zero banned AI hues:** No `#0099ff`, `#2474f5`, `#0da2e7`, `purple-*`, `indigo-*`, `violet-*`, `pink-*`, `fuchsia-*`, or hardcoded `hsl(205 100% 50%)` / `hsl(185 100% 45%)` / `hsl(280 70% 60%)`.
- **Zero decorative gradients/glows:** No `.gradient-bg`, `.gradient-text`, `.cta-glow`, `animate-glow-pulse`, `animate-glow-border` (`hue-rotate`), `animate-pulse-halo`, `animate-radar-sweep`, `animate-kinetic-shimmer`, `stage-grid`, `--shadow-glow`, or ambient `blur-3xl` orbs. Neutral-to-surface scrims over photography are allowed strictly for text legibility.
- **Contrast Floor (R-25, R-34):** Every text/background pair in both `:root` and `.dark` must pass WCAG AA (`>= 4.5:1` normal text, `>= 3.0:1` large text and non-text UI).
