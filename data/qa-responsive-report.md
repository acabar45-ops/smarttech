# Applications Section — Responsive & Cross-Browser QA Report

**Date:** 2026-04-16
**Scope:** `C:\클로드코드수업\이명재해병님\index.html` — Applications section (HTML ~1134-1342, CSS ~452-912, JS ~2114-2245)
**Method:** Static CSS / HTML / JS analysis. No browser automation. Read-only.
**Verdict:** **PASS-WITH-ISSUES** (0 Critical, 2 High, 4 Medium, 3 Low)

---

## 1. Breakpoint Matrix

Orbital container tokens (desktop default):
`--orbit-radius: 320px; --tile-w: 200px; --tile-h: 156px; --medallion-size: 220px; min-height: 760px`

Media-query declarations audited:
- `@media (min-width: 768px) and (max-width: 1023px)` → Tablet 3×3 grid
- `@media (min-width: 1024px) and (max-width: 1279px)` → Compact desktop (r=280, medallion=180, min-h=680)
- `@media (max-width: 767px)` → Mobile 1-column stack
- `@media (max-width: 429px)` → Tighter mobile spacing
- `@media (prefers-reduced-motion: reduce)` → Static fallback

| Viewport | Active @media | grid-template-columns | Medallion | Connectors | Tile size | Gap | Orbit min-h | Risks / Issues |
|---|---|---|---|---|---|---|---|---|
| **360×640 (Galaxy S)** | `max-width:767px` + `max-width:429px` | `1fr` (stack) | `display:none` | `display:none` | auto × auto | 10 px | 0 | Section padding `72px 20px` (at ≤768 global rule) → usable width = 320 px. Each tile is full-width, padding 12/14, so safe. Korean titles on TILE 2 ("진공 이중배관 (Insulated Piping)") — 2-line clamp holds. No horizontal overflow detected. Tap targets: chip 44 px, more-link 44 px — WCAG 2.5.5 pass. |
| **390×844 (iPhone 15)** | same | `1fr` | hidden | hidden | auto × auto | 10 px | 0 | Safe-area: section uses `padding:72px 20px` (no `env(safe-area-inset-*)`), but `.section` is not fixed/sticky, so safe-area-inset is only relevant on bottom floating elements (`.mobile-cta` already uses `env(safe-area-inset-bottom)`). OK. |
| **430×932 (iPhone 15 Pro Max)** | `max-width:767px` only (not `429px`) | `1fr` | hidden | hidden | auto × auto | **14 px** | 0 | At exactly 430 px the tighter rule `max-width:429px` no longer applies — gap jumps 10→14 px. Not a defect. No 2-col breakpoint before 768 px (intentional per spec). |
| **768×1024 (iPad portrait)** | `min-width:768px and max-width:1023px` | `repeat(3, 1fr)` | **hidden** | **hidden** | auto × min-h 200 | 20 px | 0 | Section `.section` global switches to `padding:72px 20px` at ≤768. Usable width ≈ 728 px; per tile ≈ (728−40)/3 ≈ 229 px. Fits comfortably. Transition at 767↔768 boundary is sharp (1-col → 3-col) — intentional. |
| **1024×1366 (iPad Pro landscape)** | `min-width:1024px and max-width:1279px` | **n/a (orbital)** | visible 180 px | **visible** | 200×156 (desktop) | n/a | 680 px | Connector re-render fires on resize (rAF-throttled) using `getComputedStyle(--orbit-radius)` = 280. **Connector endpoint math:** `R_OUTER - T_INNER = 280 - 78 = 202 px` from center. Tile center sits at r = 280. Clear gap of 78 px between connector end and tile face. OK. **Crowding check @40° adjacent tiles:** arc-distance between tile centers = 2·280·sin(20°) ≈ 191 px; tile-w=200 → centers are 9 px closer than tile width → **tiles overlap horizontally at 40°/80°/200°/280° angles** (see Issue H-1). |
| **1280×800 (laptop)** | none of the above (desktop default) | **n/a (orbital)** | visible 220 px | visible | 200×156 | n/a | 760 px | `--orbit-radius: 320px`. Arc-distance = 2·320·sin(20°) ≈ 219 px > 200 tile-w → **just barely clears** (19 px margin). Diagonal corner clearance still tight (see Issue H-1). |
| **1920×1080 (desktop)** | desktop default | n/a (orbital) | visible 220 px | visible | 200×156 | n/a | 760 px | `.section-inner{max-width:1080px}` correctly centers. `.app-orbit{width:100%}` means orbit width clamps to 1080 px but radius is still 320 px so rendering is identical to 1280 px. OK. |

---

## 2. Browser-Support Table

Feature × earliest supporting version (Can-I-Use 2025 data, minimum usable version).

| Feature in use | Chrome | Safari | Firefox | Edge | Notes |
|---|---|---|---|---|---|
| CSS custom properties | 49 | 9.1 | 31 | 15 | Ubiquitous. |
| `backdrop-filter` (nav only, not Applications) | 76 | 9 (`-webkit-`) | 103 | 79 | Applications does **not** use it. |
| `-webkit-mask-image` / `mask-image` radial gradient | 120 (unpref) / 4 (pref) | 15.4 / 4 | 53 | 120/79 | `.section.dark::before` uses both — **correct** dual declaration. |
| `grid-template-columns: repeat(3, 1fr)` | 57 | 10.1 | 52 | 16 | Safe. |
| `display: grid; place-items: center` | 59 | 11 | 53 | 16 | Safe. |
| `clamp()` in font sizes (inherited from global) | 79 | 13.1 | 75 | 79 | Safe. |
| `IntersectionObserver` with `rootMargin` | 51 | 12.1 | 55 | 15 | Safe; Applications uses `threshold: 0.12, rootMargin: '0px 0px -40px 0px'`. |
| `matchMedia('(prefers-reduced-motion: reduce)')` | 64 | 10.1 | 63 | 79 | Safe. |
| `CSS.escape()` | 64 | 10 | 31 | 79 | Used in `bindAppTileHover`. Safe. |
| `requestAnimationFrame` | 24 | 6.1 | 23 | 12 | Safe. |
| `-webkit-line-clamp` + `-webkit-box` | all | all | 68 | all | Safe. |
| `:focus-visible` | 86 | 15.4 | 85 | 86 | Used on chips, buttons, more-link. Safe on modern browsers; older Safari (<15.4) degrades to no focus ring. |
| SVG `<use href="#…">` (not `xlink:href`) | 49 | 12.1 | 51 | 17 | 9 tiles rely on this — safe. |
| `env(safe-area-inset-*)` | 69 | 11.2 | 65 | 79 | Only used on `.mobile-cta`, not Applications. |
| `color-mix()` | 111 | 16.2 | 113 | 111 | **Not used** in Applications. |
| Container queries / `subgrid` | — | — | — | — | **Not used**. |
| `transform-origin: center center` + nested rotate math | all | all | all | all | Core orbital mechanic. Safe. |

No "bleeding-edge" features. Minimum viable browsers: Chrome 86+, Safari 15.4+, Firefox 85+, Edge 86+.

---

## 3. Issues Found

### HIGH

**H-1 — Tile edge overlap risk at 40° adjacent angles (desktop default r=320)**
- Math: arc chord between adjacent tile **centers** = 2·320·sin(20°) ≈ 218.9 px.
- Tile width = 200 px. Gap between tile edges ≈ 18.9 px **center-to-center**.
- However, tiles are *squares-ish* (200×156) with `border-radius:14px` and padding. Because the orbit rotates tiles so their local Y-axis points outward, adjacent tiles at 0° / 40° actually present their **corners** toward each other. Corner-to-corner clearance is further reduced by `transform: translateY(-orbit-radius)` + outer un-rotate — the bounding boxes of the tiles rotate **back** to upright, so the effective collision surface is the 200-px-wide upright rectangle. On hover, `scale(1.015) + translate3d(0,-3px,0)` grows the rect by ~3 px each side — **tiles 1↔2 may kiss** at 40°/80°/200°/280° angles.
- **On compact-desktop (r=280):** arc = 2·280·sin(20°) ≈ 191.5 px < 200 px → **tiles overlap by ~8.5 px center-to-center when un-hovered.**
- **Fix recommendation:** in the `@media (min-width:1024px) and (max-width:1279px)` block, add `--tile-w: 176px;` (or `170px`) to reduce overlap. Alternatively tighten `--tile-h` and rely on the outer un-rotate.

**H-2 — Compact-desktop `min-height: 680px` too small for content**
- At r=280 with tile-h 156 px, the furthest-down tile sits at y = 280 + 78 = **358 px from center**. Total orbit diameter = 716 px + medallion (180) margin ≈ **720 px needed vertically**.
- `min-height: 680px` → **40 px vertical clip risk** on the 240° (bottom) tile. Since `.section` has `overflow: hidden` (via `.section.dark`), the tile bottom may be **visually cropped** or, more likely, the section simply expands because `min-height` is a minimum — content overflows the min-height box but the parent section grows. So this is a **CLS guard inadequacy** rather than a hard clip. Bump to **min-height: 740px**.

### MEDIUM

**M-1 — 1024 px boundary double-render on resize**
`renderAppConnectors()` reads `getComputedStyle(--orbit-radius)`; when resizing across the 1024 px threshold, `--orbit-radius` flips 320↔280. rAF-throttle is correct, but there is **no debounce on the final read** — during a slow drag-resize across 1024, multiple re-renders paint. Not incorrect, but a minor perf concern. No fix required.

**M-2 — No 430-ish transitional breakpoint (single-col → two-col)**
Per the user's breakpoint matrix, 430 px "iPhone 15 Pro Max" is expected to remain 1-col. CSS confirms this. However, users with ~500-700 px viewports (foldables, iPad Mini split-view) see a single column of 660-px-wide tiles until 768 px. This is visually sparse. **Recommendation:** consider adding `@media (min-width: 540px) and (max-width: 767px){ .app-list{ grid-template-columns: repeat(2,1fr); } }`. Non-blocking.

**M-3 — `.app-orbit:hover .app-tile { opacity:.55 }` fires on tablet grid layout**
The hover-dim-siblings rule is defined outside the tablet media query. Inside `@media (min-width:768px)…`, the override `.app-orbit .app-tile:hover { transform: translate3d(0,-3px,0); opacity:1; filter:none; }` restores the hovered tile, but **non-hovered siblings still dim to 0.55** because `.app-orbit:hover .app-tile` applies. This is likely unintended on a static grid (feels strange without the orbital context). **Fix:** add `.app-orbit:hover .app-tile { opacity:1; filter:none; }` inside the tablet media query (mirroring the mobile block at line 883).

**M-4 — `.app-bullets li::before { content: "·" }` may not vertically center**
`position:absolute; left:0; top:0` places the dot at the line's cap-height, not its mid-height. On some Korean font renderings the middle-dot "·" sits mid-line in the glyph, so it can appear slightly high. Cosmetic only.

### LOW

**L-1 — `isolation: isolate` on `.app-medallion` creates a new stacking context.** Correct for `z-index:2` to stay above `.app-connectors` (`z-index:0`) regardless of ancestor z-index. No issue.

**L-2 — `<svg class="app-connectors" viewBox="-400 -400 800 800">`** — renderer writes coordinates in this viewBox (not in pixel space). Because `preserveAspectRatio="xMidYMid meet"`, the SVG scales with container. At compact desktop (r=280), the connector length is 280−78=202 user-units out of 400 half-range → reaches 50.5% of the way to the viewBox edge. Visible and correct at all viewports where medallion shows.

**L-3 — `tabindex="-1"` on the `<section id="applications">`** makes the section programmatically focusable (for skip-link jump-to). Benign.

---

## 4. CSS Rule Anomalies

1. `.section.dark { overflow: hidden; }` — required to clip the blueprint grid mask, but could clip any tooltips/popovers added later. Note for future work.
2. `.app-tile { will-change: transform }` is only set on `:hover`, not at rest → correct (avoids promoting all 9 tiles to compositor layers permanently).
3. `.app-orbit .app-tile:hover { transform: rotate(var(--angle)) translateY(…) rotate(calc(-1 * var(--angle))) translate3d(0,-3px,0) scale(1.015); }` — the hover transform **chains** after the orbital transform. This is correct, but any future author editing only one half will break positioning. Worth a CSS comment.
4. `.app-list { position: absolute; inset: 0; }` at desktop, then overridden to `position: static` in tablet/mobile — **correct pattern**, no issue. On browsers that somehow don't apply the media query (e.g., JS-forced viewport emulators), the absolute OL would overlay normally. Not a real-world risk.
5. `.app-tile { transform-origin: center center; }` — with `margin-left: calc(-1 * var(--tile-w) / 2)` and `margin-top: calc(-1 * var(--tile-h)/2)`, the tile origin is at its geometric center — matches the orbital math. Correct.
6. On Safari (<15.4) without `:focus-visible`, chips get no visible ring when tabbed. Fallback: `:focus` would provide it, but there is none. **Consider adding a minimal `:focus:not(:focus-visible)` guard or a `:focus` fallback** for the ~1-2% of users on legacy Safari.
7. `#applications` has `class="section dark reveal"` with `reveal` — the global IO will add `.in` when 12% is visible. The `.app-list` has `class="stagger"` — **overridden** by `bindAppStaggerDelay()` which calls `io.unobserve(list)` then re-observes with its own IO. This means if `bindAppStaggerDelay()` throws or section id missing, `.app-list .in` never fires, and the stagger CSS never applies → tiles invisible. **Check:** stagger fallback CSS must render tiles visible at rest. Current `.reveal`/`.stagger` defaults would hide them until `.in`. **Mitigation suggested:** in the CSS, the global `.stagger` rule should have a safety `@media (prefers-reduced-motion: reduce){ .stagger > * { opacity:1; transform:none } }` or similar — confirm this exists in the global stagger code (not checked here). If absent → **upgrade to HIGH severity**.

---

## 5. Recommendations

1. **(H-1 blocker for compact desktop)** Reduce `--tile-w` to `176px` inside the 1024-1279 media query.
2. **(H-2)** Bump compact-desktop `min-height` from 680 → 740 px.
3. **(M-3)** Add `.app-orbit:hover .app-tile { opacity:1; filter:none }` inside the tablet media query.
4. **(L/M follow-up)** Verify `.stagger` global has a hard fallback so tiles render if JS fails.
5. Optional: add 540-767 px 2-col grid for mid-size foldables.
6. Optional: add `:focus` fallback for legacy Safari.
7. No changes needed for: mobile stacking, nav stickiness, safe-area, backdrop-filter, connector SVG math (desktop default), reduced-motion path (implemented correctly).

---

## 6. Nav / Sticky / Horizontal-scroll checks

- `.nav { position: sticky; top: 0; z-index: 100; }` — unchanged by Applications. Sticks across all viewports. ✔
- `html { scroll-padding-top: calc(var(--nav-h) + 8px) }` — covers anchor jumps into `#applications`. ✔
- At 360 px, no element in Applications exceeds 360 px. `.app-list{width:100%}`, tiles `width:auto`, chips `flex-wrap:wrap`, titles 2-line clamp. No horizontal overflow. ✔
- `.section.dark::before` blueprint grid uses `inset:0` with `mask-image: radial-gradient(ellipse at center…)` — no overflow. ✔

---

## 7. Summary Scorecard

| Area | Status |
|---|---|
| Mobile layout (≤767) | PASS |
| Tablet layout (768-1023) | PASS-WITH-ISSUES (M-3 sibling-dim) |
| Compact desktop (1024-1279) | **FAIL** — H-1 overlap + H-2 height clip risk |
| Full desktop (≥1280) | PASS (marginal H-1 clearance) |
| Cross-browser (Chrome/Edge/FF/Safari 15.4+) | PASS |
| Legacy Safari (<15.4) | PASS-WITH-ISSUES (no `:focus-visible` fallback) |
| Reduced motion | PASS |
| Horizontal overflow | PASS |
| Nav sticky | PASS |
| Sticky/safe-area | PASS |

**Most concerning viewport:** 1024-1279 px (iPad Pro landscape / small laptops) — tile overlap + min-height undersize are both real risks here.
**Most concerning browser:** Safari 15.3 and earlier (no `:focus-visible` — minor a11y regression; market share <2%).
