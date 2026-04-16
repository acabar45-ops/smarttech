# Applications Section — Motion Specification

**Owner:** Motion Designer, SMARTECH
**Date:** 2026-04-16
**Scope:** Applications section only. Reuses existing site tokens. Does NOT modify `index.html`.

---

## 0. Existing Tokens (Verified)

From `index.html:262-275`:

```css
:root { --ease: cubic-bezier(.22,1,.36,1); }

.reveal{
  opacity:0;
  transform:translateY(24px) scale(.98);
  transition:opacity .7s var(--ease), transform .7s var(--ease);
  will-change:opacity,transform;
}
.reveal.in{ opacity:1; transform:none; }

.stagger.in > *:nth-child(n) { transition-delay: (n-1) * 80ms; }  /* up to 9 */

@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.001ms!important;
    animation-iteration-count:1!important;
    transition-duration:.001ms!important;
  }
  .hero-bg{animation:none}
  .reveal{opacity:1;transform:none}
}
```

**Rule of engagement:** Reuse `.reveal` + `.stagger` + `--ease` wherever possible. Only introduce new keyframes for things these can't express (rotation, pulse, stroke reveal).

---

## 1. Section Entry — Desktop Orbital

### Decision
**Reuse `.reveal` + `.stagger`.** No bespoke choreography — consistency with the rest of the site beats a custom fan-out.

### DOM order (IntersectionObserver adds `.in` to `.applications` root)

```
.applications.reveal.in
  └─ .app-medallion.reveal           (child 1 via parent .stagger? NO — see below)
  └─ .app-orbit.stagger.in
        ├─ svg.app-connectors        (sibling, not a stagger child → revealed separately)
        ├─ .app-tile.reveal  ×6..9   (stagger children, 80ms each)
```

Because the medallion sits at the center and the tiles fan around it, we want the medallion present **before** the tiles arrive, not last. So:

- `.applications` gets `.reveal` with a 0ms delay → whole section fades in.
- `.app-medallion` gets `.reveal` with its own parent-scoped delay of `0ms` (first to land).
- `.app-orbit` gets `.reveal.stagger`, and its `.in` class is added **150ms after** the section's `.in` via a `setTimeout` inside the IntersectionObserver callback. This makes tiles visibly arrive after the medallion without inventing new CSS.
- Connector `<svg>` sits inside `.app-orbit` but is NOT a stagger child (it's absolutely positioned behind tiles). Give it class `.reveal` with inline `style="transition-delay:720ms"` so it fades in AFTER the last tile (tile 6 lands at ~400ms + 700ms duration; 720ms is a comfortable handoff).

### Timeline (section scrolled into view at t=0)

| t (ms) | Element | State |
|--------|---------|-------|
| 0      | `.applications` | `.in` added → opacity 0→1, translateY 24→0 over 700ms |
| 0      | `.app-medallion` | `.in` added → fade + rise 700ms |
| 150    | `.app-orbit.stagger` | `.in` added |
| 150    | tile 1 | begins 700ms reveal |
| 230    | tile 2 | begins (80ms stagger) |
| 310    | tile 3 | begins |
| 390    | tile 4 | begins |
| 470    | tile 5 | begins |
| 550    | tile 6 | begins |
| 870    | svg connectors container | `.reveal.in` fires (opacity 0→1) |
| 870    | each `<path class="connector">` | `stroke-dashoffset` animates from `var(--len)` → `var(--len)` (stays hidden at rest; revealed only on hover — see §2) |
| 1250   | last tile finishes reveal | — |
| 1570   | connector container fully faded in | — |

### CSS pseudocode (additive, not a rewrite)

```css
/* Orbit section — nothing new; uses existing .reveal + .stagger */
.applications.reveal { /* inherits */ }
.app-medallion.reveal { /* inherits */ }
.app-orbit.reveal.stagger { /* inherits */ }
.app-orbit > .app-connectors.reveal { transition-delay: 720ms; }

/* Connector baseline: invisible dashed paths, animated on tile hover only */
.app-connectors path {
  stroke: var(--gold-dim, rgba(196,161,90,.25));
  stroke-width: 1;
  fill: none;
  stroke-dasharray: var(--len, 200);
  stroke-dashoffset: var(--len, 200); /* fully hidden */
  transition: stroke-dashoffset .45s var(--ease), stroke .25s var(--ease);
}
```

---

## 2. Tile Hover — Desktop

### Decisions
- Tile lift: **`translate3d(0,-3px,0) scale(1.015)`** — subtle. Not 1.02 (too much on a dense grid).
- Border: gold accent at `rgba(196,161,90,.6)` appears.
- Connector line: animates `stroke-dashoffset` from `var(--len)` → `0` (draws from medallion outward).
- Connector color: `--gold-dim` → `--gold-strong` (`rgba(196,161,90,.9)`).
- Other tiles: dim to `opacity:.55` and `filter:saturate(.85)`.
- Durations: **240ms in**, **420ms out** (longer release feels expensive, not jittery).

### Timeline on hover-in (t=0 = `pointerenter`)

| t (ms) | Property | From → To |
|--------|----------|-----------|
| 0      | tile transform | `none` → `translate3d(0,-3px,0) scale(1.015)` |
| 0      | tile border-color | default → `rgba(196,161,90,.6)` |
| 0      | tile box-shadow | none → `0 8px 24px rgba(0,0,0,.35)` |
| 0      | sibling tiles opacity | 1 → .55 |
| 0      | connector stroke-dashoffset | `var(--len)` → `0` |
| 0      | connector stroke | `--gold-dim` → `--gold-strong` |
| 240    | all in-state reached | — |

On `pointerleave`: same properties animate back over **420ms** with `var(--ease)`.

### CSS pseudocode

```css
.app-tile{
  transition:
    transform .24s var(--ease),
    border-color .24s var(--ease),
    box-shadow .24s var(--ease),
    opacity .24s var(--ease),
    filter .24s var(--ease);
  border:1px solid rgba(255,255,255,.08);
  will-change: auto;              /* not set by default */
}
.app-orbit:hover .app-tile{        /* siblings dim */
  opacity:.55; filter:saturate(.85);
  transition-duration:.42s;        /* longer out-feel on siblings too */
}
.app-orbit .app-tile:hover{
  opacity:1; filter:none;
  transform: translate3d(0,-3px,0) scale(1.015);
  border-color: rgba(196,161,90,.6);
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
  will-change: transform;          /* hint only when actually hovered */
}
/* Connector targeting: JS adds data-active on matching path */
.app-connectors path[data-active="true"]{
  stroke-dashoffset:0;
  stroke: var(--gold-strong, rgba(196,161,90,.9));
}
/* On leave: longer release */
.app-tile{ transition-duration:.42s; }           /* default = out */
.app-orbit .app-tile:hover{ transition-duration:.24s; }  /* in is faster */
```

### JS (tile → connector association)

```js
// Each tile has data-tile-id="fd"; each connector path has data-tile-id="fd"
document.querySelectorAll('.app-tile').forEach(tile => {
  const id = tile.dataset.tileId;
  const path = document.querySelector(`.app-connectors path[data-tile-id="${id}"]`);
  tile.addEventListener('pointerenter', () => path?.setAttribute('data-active','true'));
  tile.addEventListener('pointerleave', () => path?.removeAttribute('data-active'));
});
```

---

## 3. SKU Chip Hover

### Decisions
- Border: `1px solid rgba(196,161,90,.35)` → `rgba(196,161,90,.7)`.
- Text: `#fff` → `#E6C67A` (gold).
- Background: transparent → `rgba(196,161,90,.15)`.
- Duration: **150ms in, 220ms out**.

### CSS pseudocode

```css
.sku-chip{
  transition:
    color .15s var(--ease),
    background-color .15s var(--ease),
    border-color .15s var(--ease),
    transform .1s var(--ease);
  border:1px solid rgba(196,161,90,.35);
  color:#fff;
  background:transparent;
}
.sku-chip:hover{
  color:#E6C67A;
  background:rgba(196,161,90,.15);
  border-color:rgba(196,161,90,.7);
  transition-duration:.15s;
}
.sku-chip{ transition-duration:.22s; } /* out slower; override by :hover above */
```

---

## 4. SKU Chip Click → `.is-focus` Pulse

### Decisions
- `:active` → `transform: scale(.97)` (pressed feel, 80ms).
- After click, `goSection('products')` scrolls to Products section.
- Destination product card receives `.is-focus` class for **1200ms**, then removed.
- Pulse: scale 1 → 1.03 → 1, combined with gold glow ring that fades.

### Keyframes

```css
.sku-chip:active{
  transform: scale(.97);
  transition-duration: .08s;
}

@keyframes isFocusPulse{
  0%   { transform: scale(1);     box-shadow: 0 0 0 0   rgba(196,161,90,0);    }
  20%  { transform: scale(1.03);  box-shadow: 0 0 0 6px rgba(196,161,90,.35);  }
  60%  { transform: scale(1.01);  box-shadow: 0 0 0 12px rgba(196,161,90,.12); }
  100% { transform: scale(1);     box-shadow: 0 0 0 18px rgba(196,161,90,0);   }
}
.product-card.is-focus{
  animation: isFocusPulse 1.2s var(--ease) 1 both;
  outline: 1px solid rgba(196,161,90,.6);  /* stays until class removed */
}

@media (prefers-reduced-motion: reduce){
  .product-card.is-focus{
    animation: none;
    outline: 2px solid rgba(196,161,90,.8);  /* static focus ring replaces pulse */
  }
}
```

### JS pseudocode

```js
function handleChipClick(chipEl){
  const targetProductId = chipEl.dataset.productId;
  goSection('products');                              // existing helper
  requestAnimationFrame(() => {
    // Wait for scroll settle (rAF x2 is usually enough with smooth-scroll disabled;
    // if smooth, use scrollend event or 500ms fallback).
    setTimeout(() => {
      const card = document.querySelector(
        `.product-card[data-product-id="${targetProductId}"]`
      );
      if (!card) return;
      card.classList.remove('is-focus');              // restart if already set
      void card.offsetWidth;                          // reflow to replay animation
      card.classList.add('is-focus');
      setTimeout(() => card.classList.remove('is-focus'), 1200);
    }, 500);
  });
}
```

---

## 5. Center Medallion

### Decisions
- Gold ring: **rotates slowly, 60s, linear, infinite**.
- Inner text ("Vacuum Applications"): fully static, counter-rotation not needed because it sits in a non-rotating child.
- Disabled under `prefers-reduced-motion`.
- Does NOT conflict with hero's 26s `heroDrift` — this is scoped to `.app-medallion-ring` only and is a transform (cheap), not a gradient animation.

### CSS pseudocode

```css
@keyframes medallionSpin{
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.app-medallion-ring{
  animation: medallionSpin 60s linear infinite;
  transform-origin: 50% 50%;
  will-change: transform;
}
.app-medallion-label{ /* child, NOT inside .app-medallion-ring */
  /* static, no animation */
}
@media (prefers-reduced-motion: reduce){
  .app-medallion-ring{ animation: none; }
}
```

**DOM shape required:**
```
.app-medallion
  ├─ .app-medallion-ring   ← rotates (just the ring SVG/border)
  └─ .app-medallion-label  ← static, centered, text + icon
```

---

## 6. Mobile (≤767px)

### Decisions
- Orbital hidden at ≤767px; 1-column stack of tiles.
- Each `.app-tile` keeps `.reveal`; parent stack keeps `.stagger` (tiles remain direct children, so nth-child still works).
- Hover states replaced with `:active` press feedback.
- Medallion hidden (`display:none`) → no rotation, no cost.
- Connectors SVG hidden (`display:none`).

### CSS pseudocode

```css
@media (max-width:767px){
  .app-medallion,
  .app-connectors{ display:none; }
  .app-orbit{
    display:flex;
    flex-direction:column;
    gap:12px;
  }
  .app-tile:hover{ transform:none; box-shadow:none; border-color:inherit; }
  .app-tile:active{
    transform: scale(.98);
    transition-duration: .08s;
  }
  .app-orbit:hover .app-tile{ opacity:1; filter:none; }  /* kill desktop dim */
}
```

---

## 7. `prefers-reduced-motion: reduce`

Global rule already exists in `index.html:275` and zeros out all transitions/animations and restores `.reveal` state. Applications-section additions must not re-enable motion. Audit matrix:

| Motion                     | Reduced-motion behavior             | Source |
|----------------------------|-------------------------------------|--------|
| `.reveal` fade/translate   | Instant (opacity 1, transform none) | global rule (index.html:275) |
| `.stagger` delays          | Effectively 0 (transition is .001ms)| global rule |
| Tile hover lift            | Still applies but completes in .001ms → visually no animation, final state still reached | global rule |
| Sibling tile dim on hover  | Same — snaps, doesn't tween         | global rule |
| Connector stroke reveal    | Snaps to drawn/undrawn state        | global rule |
| SKU chip hover             | Snaps                               | global rule |
| `.is-focus` pulse          | **Explicitly replaced** with static outline (see §4) | local override |
| Medallion 60s rotation     | **Explicitly disabled** (animation:none) | local override |
| Hero `heroDrift` 26s       | Already disabled globally (`.hero-bg{animation:none}`) | global rule — confirmed, carry same approach |
| Scroll-linked animations   | None introduced in this section     | N/A |

**Confirmation: reduced-motion path is complete.** Every new animation in this spec either falls under the global `*` transition-duration override or has a local `@media (prefers-reduced-motion: reduce)` override that disables/replaces it with a static equivalent.

---

## 8. Performance Budget

### Simultaneous animating properties — worst case

**Tile hover-in** (single tile):
1. hovered tile: `transform`
2. hovered tile: `border-color`
3. hovered tile: `box-shadow`
4. connector path: `stroke-dashoffset`
5. connector path: `stroke`
6. sibling tiles (grouped as one composited layer via parent selector): `opacity` + `filter`

Counted as properties, roughly 5-6 concurrent. **Under the 6-parallel cap.** Note: `box-shadow` and `filter` are paint-bound, not compositor-bound — they are the main risk. If profiling shows jank, demote `box-shadow` to a pseudo-element with `opacity` transition (compositor-only).

### `translate3d` GPU compositing — **Yes**
Tile hover uses `translate3d(0,-3px,0)` (not `translateY`) to force a compositor layer. Medallion ring rotation uses `transform: rotate()` which is compositor-promoted automatically.

### `will-change` hints
- **Do NOT** put `will-change: transform` on `.app-tile` by default — 6-9 always-promoted layers waste memory.
- Apply **`will-change: transform` inside `:hover` only** (see §2 CSS). Browser keeps the layer for the hover duration and releases after.
- `:focus-within` alternative rejected: fires too broadly (any child input focus would promote).
- `.app-medallion-ring` keeps `will-change: transform` permanently — it's a single element and is always animating.

### Risks flagged
1. **`box-shadow` on tile hover** — paint cost. Mitigation noted above.
2. **`filter: saturate()` on sibling tiles** — also paint-bound. Acceptable at 5-8 tiles; reconsider if tile count grows.
3. **Connector `stroke-dashoffset`** — not compositor-accelerated in any browser. Fine at 6-9 short paths, would be a problem at 50+.
4. **Medallion rotation** — 60s is slow enough to be imperceptible power drain; still gated by reduced-motion.

---

## 9. Loading / No-JS Fallback

### Before IntersectionObserver fires
Tiles render at `.reveal` rest state: `opacity:0; transform:translateY(24px) scale(.98)`. This is the existing site behavior and stays consistent.

### If JS fails entirely
User sees a blank Applications section — unacceptable. Two fallback layers:

**Layer 1 — `prefers-reduced-motion: reduce`** (already in index.html:275):
```css
.reveal{ opacity:1; transform:none; }
```
Covers users who have the preference. Does NOT cover JS failure for motion-accepting users.

**Layer 2 — `@supports` + `<noscript>` recommended addition:**

Recommended: add a `<noscript>` block inside `<head>` that injects a style resetting `.reveal`:

```html
<noscript>
  <style>
    .reveal{ opacity:1 !important; transform:none !important; }
    .app-connectors path{ stroke-dashoffset:0; stroke:var(--gold-dim); }
  </style>
</noscript>
```

`@supports not (animation: foo)` is NOT the right feature query here (all target browsers support `animation`). The real failure mode is "JS didn't run," which `<noscript>` handles precisely.

**Recommendation:** Ship the `<noscript>` fallback. It costs 4 lines and prevents the worst-case silent-blank-section failure. (Note: This recommendation is additive to `index.html` and belongs in a separate PR — this spec does not edit that file.)

---

## 10. Browser Support Notes

| Feature                          | Min support                    | Notes |
|----------------------------------|--------------------------------|-------|
| `cubic-bezier()`                 | Universal                      | — |
| `transform: translate3d`         | Universal                      | — |
| `stroke-dashoffset` transition   | All evergreen                  | Not GPU-accelerated |
| `@keyframes` + `animation`       | Universal                      | — |
| `prefers-reduced-motion`         | Safari 10.1+, Chrome 74+, FF 63+ | All targets covered |
| `will-change`                    | All evergreen                  | Use sparingly |
| `:focus-within`                  | All evergreen (Safari 10.1+)   | Not used here — rejected in §8 |
| `pointerenter`/`pointerleave`    | All evergreen                  | Better than mouseenter on hybrid touch |
| IntersectionObserver             | All evergreen                  | Existing site dependency |
| SVG inside HTML                  | Universal                      | — |

No vendor prefixes required for target browser matrix (last 2 versions of evergreen + Safari 14+).

---

## Appendix — Animation Inventory

| # | Name                        | Trigger                    | CSS-only | JS needed |
|---|-----------------------------|----------------------------|----------|-----------|
| 1 | Section reveal              | IntersectionObserver       | CSS      | JS adds `.in` (existing) |
| 2 | Medallion reveal            | IntersectionObserver       | CSS      | JS adds `.in` (existing) |
| 3 | Orbit stagger reveal        | IntersectionObserver + 150ms | CSS    | JS (small timeout) |
| 4 | Connector container fade    | IntersectionObserver       | CSS      | JS adds `.in` |
| 5 | Tile hover lift             | `:hover`                   | CSS      | — |
| 6 | Sibling tile dim            | `:hover` on parent         | CSS      | — |
| 7 | Connector stroke reveal     | tile hover                 | CSS      | JS sets `data-active` |
| 8 | Connector color shift       | tile hover                 | CSS      | JS (same as #7) |
| 9 | SKU chip hover              | `:hover`                   | CSS      | — |
| 10 | SKU chip press             | `:active`                  | CSS      | — |
| 11 | `.is-focus` pulse          | post-navigation            | CSS keyframes | JS adds/removes class |
| 12 | Medallion ring rotation    | always (desktop, no RM)    | CSS      | — |
| 13 | Mobile tile press          | `:active`                  | CSS      | — |

**Total distinct animations: 13.**
**CSS-only: 8.** (5, 6, 8, 9, 10, 12, 13 — and #8 is CSS transition driven by a JS-set attribute, so partial.)
**Require JS: 5.** (1, 2, 3, 4, 7, 11 — class/attribute toggling; #8 shares JS with #7.)

End of spec.
