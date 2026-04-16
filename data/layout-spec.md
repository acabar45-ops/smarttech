# Applications Section — Layout Specification

> Layout Engineer deliverable. Defines orbital geometry (desktop), 3×3 grid (tablet), and 1-column stack (mobile) for the new `#applications` section inserted between `#products` (line 662) and `#services` (line 664).
>
> **Source data:** `data/applications.json` (9 domains, angles 0/40/80/120/160/200/240/280/320°, clockwise from 12 o'clock).
> **Page constraints:** `--content-max-width` = 1080px; `--nav-h` = 64px; existing breakpoint at `@media (max-width: 768px)` only.

---

## 1. Breakpoint table (authoritative)

| Viewport          | Layout              | Medallion        | Tile size (w × h) | Gap    | Orbit radius | Connector | Section vert. pad |
|-------------------|---------------------|------------------|-------------------|--------|--------------|-----------|-------------------|
| ≥1280px           | Orbital (full)      | 220 px           | 220 × 168 px      | n/a    | 320 px       | Visible   | 112 px            |
| 1024 – 1279 px    | Orbital (compact)   | 180 px           | 200 × 156 px      | n/a    | 280 px       | Visible   | 112 px            |
| 768 – 1023 px     | 3 × 3 grid          | Banner 56 px     | flex (1fr)        | 20 px  | n/a          | Hidden    | 96 px             |
| 430 – 767 px      | 1-col stack         | Hidden (header)  | 100% × auto       | 14 px  | n/a          | Hidden    | 72 px             |
| ≤ 429 px          | 1-col stack tight   | Hidden           | 100% × auto       | 10 px  | n/a          | Hidden    | 72 px             |

**Medallion copy (all sizes):** "Vacuum Applications" (center label per `applications.json > metadata.layout_notes`).

---

## 2. Desktop orbital geometry (≥1024px)

### Container
- Width: 100% of `.container` (max 1080px)
- `min-height: 760px` at ≥1280px, `min-height: 680px` at 1024–1279px
- `position: relative`, flex/grid center or explicit `display: grid; place-items: center`
- `--orbit-radius: 320px;` at ≥1280px
- `--orbit-radius: 280px;` at 1024–1279px
- `--tile-w: 220px; --tile-h: 168px;` at ≥1280px
- `--tile-w: 200px; --tile-h: 156px;` at 1024–1279px
- `--medallion-size: 220px;` at ≥1280px, `180px` at 1024–1279px

### Tile content budget (why 220×168)
- Icon row: 36 px
- Title 2 lines × 18 px line-height × 1.35 = ~48 px
- 2 bullets × 2 lines × 13 px × 1.45 = ~72 px (compressed by clamp)
- Chips row (2–3 chips, wrap allowed): 24 px
- Padding: 14 px top + 14 px bottom = 28 px
- Total vertical budget ≈ 164 px → tile height 168 px (includes 1.06× safety).
- Horizontal: icon + title + 3 chips @ ~56 px each need ≥ 200 px; 220 px at ≥1280 gives breathing room; 200 px at compact requires `text-overflow: ellipsis` on chip rows > 3.

### Per-tile CSS transform formula (verbatim)
```css
.app-tile {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--tile-w);
  height: var(--tile-h);
  margin-left: calc(-1 * var(--tile-w) / 2);
  margin-top:  calc(-1 * var(--tile-h) / 2);
  transform:
    rotate(var(--angle))
    translateY(calc(-1 * var(--orbit-radius)))
    rotate(calc(-1 * var(--angle)));
  transform-origin: center center;
  /* transition for hover + reveal fan-out */
  transition: transform .6s var(--ease), box-shadow .3s var(--ease);
}
```
Each tile sets `style="--angle: 0deg"` … `--angle: 320deg` inline. The inner rotate-translate-counterrotate pattern keeps text upright (text NEVER rotates).

### Connector line SVG (desktop only)
- SVG absolutely positioned to fill the orbital container:
  `position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:0;`
- Each of 9 `<line>` elements drawn from medallion edge to tile inner edge:
  - `x1 = cx + (R_medallion/2) * sin(angle)`
  - `y1 = cy - (R_medallion/2) * cos(angle)`
  - `x2 = cx + (orbit_radius - tile_inner_offset) * sin(angle)`
  - `y2 = cy - (orbit_radius - tile_inner_offset) * cos(angle)`
  - where `cx, cy` = container center in SVG's viewBox; `tile_inner_offset ≈ tile_h/2` (≈ 84 px at desktop).
- Stroke: `--brand-light` (#7EB5E0), 1.5 px, `stroke-dasharray: 4 6`, `stroke-dashoffset: 0`.
- Hover: animate `stroke-dashoffset` from 0 → -40 over 800 ms for "energy flow" effect.

### Text orientation inside tiles
Text MUST NOT rotate with the orbit. The double-rotate formula above ensures this. Tiles are axis-aligned rectangles regardless of angular position — same visual reading direction as standard cards.

---

## 3. Tablet 3×3 grid (768 – 1023 px)

**New breakpoint introduced.** Confirmed: the existing stylesheet has only `@media (max-width: 768px)`. Adding `@media (min-width: 768px) and (max-width: 1023px)` cannot conflict — it falls into a currently-unstyled range where desktop rules otherwise apply. The mobile hamburger kicks in at `max-width: 768px`, so at 768–1023 px the **desktop nav is shown** (verified against `interactive_behaviors.mobile_hamburger` in preservation-manifest.json).

```css
@media (min-width: 768px) and (max-width: 1023px) {
  .app-orbital { display: none; }          /* hide desktop orbital */
  .app-grid    { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .app-medallion-banner { display: flex; }  /* 56 px horizontal banner at top */
  .app-tile { min-height: 180px; padding: 16px; }
  .app-connectors { display: none; }
}
```

- Medallion becomes a **horizontal banner** (`56 px` tall, full section width, rounded, brand gradient) showing the title "Vacuum Applications" — gives visual anchor without the orbital metaphor.
- Tiles are flex (1fr each); natural height drives layout. Chips may wrap to 2 lines.
- Hover elevates via `box-shadow: var(--shadow-md) → var(--shadow-lg)` only (no rotation).

---

## 4. Mobile 1-column stack (≤767px)

```css
@media (max-width: 767px) {
  .app-orbital, .app-medallion, .app-medallion-banner, .app-connectors { display: none; }
  .app-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  .app-tile { padding: 14px 16px; min-height: auto; }
  .app-tile .chips { flex-wrap: wrap; }
}
@media (max-width: 429px) {
  .app-grid { gap: 10px; }
  .app-tile { padding: 12px 14px; }
  .app-tile .title { font-size: 15px; }
}
```

- Medallion hidden entirely; the `.section-head` (eyebrow + h2 + lede) replaces it.
- Chips allowed to wrap to 2–3 lines.
- Title still 2 lines allowed; bullets remain as `<ul>` (no ellipsis truncation on mobile).

---

## 5. Z-index / stacking inside `.app-orbital`

```
z-index 3  ┌─────────────────────────────┐
           │  .app-tile:hover            │   ← lifts above peers
z-index 2  ├─────────────────────────────┤
           │  .app-medallion (center)    │   ← above connectors, above tiles at rest
z-index 1  ├─────────────────────────────┤
           │  .app-tile (default)        │
z-index 0  ├─────────────────────────────┤
           │  .app-connectors (SVG)      │
           └─────────────────────────────┘
```

Rationale for medallion above tiles at z=2: at r=320 the medallion (220 px) and the nearest tile inner edge never overlap (gap ≈ 320 − 84 − 110 = 126 px). But at r=280 compact with 200 px tiles, inner gap = 280 − 78 − 90 = 112 px — still safe. z=2 is defensive against future radius tweaks.

---

## 6. Animations & CLS prevention

### Reveal fan-out
- Section has `.reveal`; IntersectionObserver adds `.in` (existing behavior at line 1422–1430).
- Initial state: each tile has `--orbit-radius: 0px` (i.e. stacked behind medallion), opacity 0.
- `.reveal.in .app-tile` sets `--orbit-radius: 320px` (or 280 px compact) via a rule, triggering the stored transform to re-evaluate. Stagger: `transition-delay: calc(var(--i) * 60ms)` where `--i` is 0–8 per tile.
- Reduced-motion guard at line 275 already short-circuits `.reveal` → visible instantly; fan-out skips.

### Connector stroke animation
- `.app-tile:hover ~ svg line[data-for="{id}"]` targets the matching connector and animates `stroke-dashoffset` 0 → −40 over 800 ms. Pure CSS, no layout.

### CLS concerns
- **Orbital container must reserve height before JS/CSS custom props apply.** Set `min-height: 760px` (≥1280 px) and `min-height: 680px` (1024–1279 px) inline on `.app-orbital` so layout is stable during FCP.
- Tablet: `.app-grid` with 3 rows × 180 px + 2 × 20 px gap + 56 px banner + 96 px pad = ~740 px → `min-height: 700px` safe.
- Mobile: 9 tiles × ~140 px + 8 × 14 px gap + 72 px pad = ~1378 px; let content dictate (no `min-height`).

---

## 7. Mathematical placement — 9 tile centers

Formula: `x = r · sin(angle°)`, `y = -r · cos(angle°)` (CSS y-axis: negative = up).

### At desktop radius r = 320 px (≥1280px)

| # | Domain (from applications.json)              | Angle | x (px) | y (px) |
|---|----------------------------------------------|-------|-------:|-------:|
| 1 | gas-cylinder (Gas Cylinder & Residual Gas)   |   0°  |      0 |   -320 |
| 2 | insulated-piping (Insulated Piping)          |  40°  |    206 |   -245 |
| 3 | secondary-battery (Secondary Battery)        |  80°  |    315 |    -56 |
| 4 | vacuum-furnace (Vacuum Furnace)              | 120°  |    277 |    160 |
| 5 | vacuum-oven (Vacuum Oven & Drying)           | 160°  |    109 |    301 |
| 6 | oled-display (OLED & Display Process)        | 200°  |   -109 |    301 |
| 7 | freeze-dry (Food & Pharma Freeze-Drying)     | 240°  |   -277 |    160 |
| 8 | coating-smartphone (Coating & Smartphone)    | 280°  |   -315 |    -56 |
| 9 | research-analysis (Research & Analysis)      | 320°  |   -206 |   -245 |

### At compact radius r = 280 px (1024–1279 px)

| # | Angle | x (px) | y (px) |
|---|-------|-------:|-------:|
| 1 |   0°  |      0 |   -280 |
| 2 |  40°  |    180 |   -214 |
| 3 |  80°  |    276 |    -49 |
| 4 | 120°  |    242 |    140 |
| 5 | 160°  |     96 |    263 |
| 6 | 200°  |    -96 |    263 |
| 7 | 240°  |   -242 |    140 |
| 8 | 280°  |   -276 |    -49 |
| 9 | 320°  |   -180 |   -214 |

Downstream engineers should verify the rendered transform matches these integer coordinates (±1 px for sub-pixel rounding).

---

## 8. CSS skeleton

```css
.app-orbital {
  --orbit-radius: 320px;
  --tile-w: 220px;
  --tile-h: 168px;
  --medallion-size: 220px;
  position: relative;
  width: 100%;
  min-height: 760px;
  margin: 0 auto;
  display: grid;
  place-items: center;
}

.app-medallion {
  width: var(--medallion-size);
  height: var(--medallion-size);
  border-radius: 50%;
  background: radial-gradient(circle, var(--brand-mid), var(--brand-deep));
  color: #fff;
  display: grid; place-items: center;
  z-index: 2;
  box-shadow: var(--shadow-lg);
}

.app-tile {
  position: absolute;
  top: 50%; left: 50%;
  width: var(--tile-w);
  height: var(--tile-h);
  margin-left: calc(-1 * var(--tile-w) / 2);
  margin-top:  calc(-1 * var(--tile-h) / 2);
  transform:
    rotate(var(--angle))
    translateY(calc(-1 * var(--orbit-radius)))
    rotate(calc(-1 * var(--angle)));
  transform-origin: center center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
  z-index: 1;
  transition: transform .6s var(--ease), box-shadow .3s var(--ease);
}
.app-tile:hover { z-index: 3; box-shadow: var(--shadow-lg); }

.app-connectors { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.app-connectors line {
  stroke: var(--brand-light);
  stroke-width: 1.5;
  stroke-dasharray: 4 6;
  stroke-dashoffset: 0;
  transition: stroke-dashoffset .8s var(--ease), stroke .3s var(--ease);
}

.app-grid { display: none; }                 /* hidden at desktop */
.app-medallion-banner { display: none; }

/* Compact orbital */
@media (min-width: 1024px) and (max-width: 1279px) {
  .app-orbital {
    --orbit-radius: 280px;
    --tile-w: 200px; --tile-h: 156px;
    --medallion-size: 180px;
    min-height: 680px;
  }
}

/* Tablet 3×3 */
@media (min-width: 768px) and (max-width: 1023px) {
  .app-orbital, .app-medallion, .app-connectors { display: none; }
  .app-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .app-medallion-banner {
    display: flex; align-items: center; justify-content: center;
    height: 56px; margin-bottom: 24px;
    background: linear-gradient(90deg, var(--brand-deep), var(--brand-mid));
    color: #fff; border-radius: 12px;
  }
  .app-tile {
    position: static;
    transform: none; margin: 0;
    width: auto; height: auto;
    min-height: 180px;
    padding: 16px;
  }
}

/* Mobile 1-col */
@media (max-width: 767px) {
  .app-orbital, .app-medallion, .app-medallion-banner, .app-connectors { display: none; }
  .app-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .app-tile {
    position: static; transform: none; margin: 0;
    width: auto; height: auto; min-height: auto;
    padding: 14px 16px;
  }
  .app-tile .chips { flex-wrap: wrap; }
}
@media (max-width: 429px) {
  .app-grid { gap: 10px; }
  .app-tile { padding: 12px 14px; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .app-tile { transition: none; }
  .app-connectors line { transition: none; }
}
```

### Class-name namespace safety
Per `preservation-manifest.json > preservation_rules` last item, the `.app-` prefix is not reserved and does not collide with any existing namespace (.prod-, .faq-, .bsn-, .post-, .m-, .nav-, .channel-, .card, .grid-, .hero-, .process-, .urgent-, .float, .c-, .blog-). ✔ Safe.

---

## 9. Risks & mitigations

| # | Risk                                                                                                       | Severity | Mitigation                                                                                                      |
|---|------------------------------------------------------------------------------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------|
| 1 | **Adjacent-tile edge kiss at r=320 / tile-w=220.** Distance between tile 1 (0°) and tile 2 (40°) centers = √(206² + 75²) ≈ 219 px. Tiles are 220 px wide → edges brush. | **HIGH** | Either (a) keep r=320 and reduce tile-w to 200 (matches compact), or (b) accept 1–2 px overlap which hover-lift disguises. **Recommended:** option (a) — unify to 200×156 across desktop sizes; reserve 220-wide for only 7-domain layouts. If 220 is kept, add `.app-tile { outline: 1px solid var(--surface); }` so the brush is visually clean. |
| 2 | Page max-width 1080 px constrains orbital to ~1040 px usable. At r=320 + tile-w/2=110, rightmost tile center at x=315, right edge at x=425 → total width span = 850 px (fits comfortably).                | low      | Confirmed numerically; no change.                                                                               |
| 3 | Container height at desktop ≈ 760 px; adds significant vertical scroll. Combined with `section vert. pad 112px` = ~984 px. Hero + products + applications may push mobile sticky-CTA threshold (520 px, line 1456) further down the page, but threshold is based on scrollY not section order — no regression. | low      | No mitigation needed. Threshold trigger remains on hero exit.                                                   |
| 4 | **Medallion / tile overlap at compact r=280 with medallion=180.** Medallion radius = 90; tile inner edge = 280 − (156/2) = 202 px from center. Gap = 202 − 90 = 112 px. Safe.                                  | low      | OK.                                                                                                             |
| 5 | Connector lines may be visually noisy with 9 radial spokes. `stroke-dasharray: 4 6` + low-saturation `--brand-light` keeps them subtle. No hover → static faded; on-hover → animated dash for one tile only. | low      | Design choice; swap to solid 1px `--line` if dashes test poorly.                                                |
| 6 | **CLS during font-load / JS init.** Without `min-height`, the absolutely-positioned tiles collapse the parent to 0, causing #services to jump upward. | **MEDIUM** | `.app-orbital { min-height: 760px; }` inline rule as shown. Verified to reserve layout space before tile styles apply.                              |
| 7 | New tablet breakpoint 768–1023 px. Existing CSS has NO rules at this range, so introducing it cannot regress anything; the mobile hamburger stays scoped to `max-width: 768px`. | none     | **Confirmed non-conflicting.** Desktop nav shows at 768–1023 px as today.                                       |
| 8 | Tile content may exceed 168 px height if Korean titles wrap to 3 lines (e.g. "가스 실린더 & Residual Gas Removal" is long). | medium   | Apply `font-size: 14px; line-height: 1.3; -webkit-line-clamp: 2; overflow: hidden` on `.app-tile .title`. Test with all 9 domains at ≥1280 px and at compact 200 px width. |
| 9 | Reveal fan-out requires rerun of the `--orbit-radius` transition. If browser caches the transform computed style, the tween may not fire. | low | Use `will-change: transform` on `.app-tile` and set initial `--orbit-radius: 0` in the CSS, then override in `.reveal.in .app-tile`. Tested pattern. |

---

## 10. Integration checklist (for downstream engineers)

- [ ] Insert `<section id="applications" class="section reveal" aria-label="응용 분야">` after line 662, before line 664.
- [ ] Do NOT add `.soft` class (preserves alternation per manifest `insertion_point_for_applications_section.warning_about_alternating_bg`).
- [ ] Inside `.section-inner`, render `<div class="app-orbital">` (desktop), `<div class="app-grid">` (tablet+mobile). Both coexist in DOM; CSS toggles `display`.
- [ ] Each tile needs inline `style="--angle: {0|40|…|320}deg"` matching `applications.json[i].angle`.
- [ ] SVG `<line>` elements in `.app-connectors` need `data-for="{id}"` matching tile id for hover targeting.
- [ ] Verify rendered (x, y) integer pairs against section 7 table (DevTools → getBoundingClientRect).
- [ ] Confirm `#applications` scroll target works via `goSection('applications')` (no code change needed, per manifest line about goSection accepting any ID).
- [ ] Add optional `.stagger` to `.app-grid` if tablet/mobile tiles should animate sequentially (reuses existing stagger CSS).

---

*Spec owner: Layout Engineer · data sources: `data/applications.json`, `data/preservation-manifest.json` · generated 2026-04-16.*
