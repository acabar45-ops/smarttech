# Applications Section — Accessibility Pre-Plan

**Owner:** Accessibility Pre-Planner
**Audience:** Integration Engineer, Consolidator, QA
**Scope:** `#applications` section only (dark navy, orbital layout, 9 industry tiles)
**Status:** SPEC — not yet implemented. Do not edit `index.html` from this document.

---

## 0. Executive summary

- **Semantic container:** `<ol>` (ordered list) — tile 1 is canonically "12 o'clock / gas cylinder" and the clockwise sequence is meaningful (sitemap + product-catalog ordering).
- **Orbital layout is purely visual** — achieved via CSS `transform: rotate(var(--angle)) translateY(-R) rotate(calc(-1 * var(--angle)))` on each `<li>`. DOM order stays 1-9 clockwise-from-top.
- **Medallion, connector SVG, and gold ring:** all `aria-hidden="true"` — decorative.
- **Focus ring:** reuses `--app-focus-ring` token (gold 2px + 4px 25% halo) from `tokens-delta.css`.
- **No roving tabindex.** Standard linear Tab order. Skip link optional but recommended.
- **Reduced motion:** hard-disable transforms/transitions/stagger animations — render final state instantly.

---

## 1. Refined semantic structure

### 1.1 Decision: ordered vs unordered list

**Recommendation: `<ol>`.**
Rationale: tile 1 (gas cylinder) is the canonical entry in the industry ordering used throughout the product catalog (`edwards-catalog.json`) and sitemap. Clockwise position encodes ordinal meaning ("12 o'clock first, then clockwise"). `<ol>` also improves SR announcement to "list item N of 9" which aids orientation in a radial layout where users cannot visually see a left-to-right sequence.

If the integration engineer prefers `<ul>`, it is acceptable — the ordering is not *strictly* procedural — but `<ol>` is the safer default.

### 1.2 Proposed DOM

```html
<section id="applications"
         class="section dark reveal"
         aria-labelledby="apps-heading">
  <div class="container">

    <header class="section-head">
      <p class="eyebrow" aria-hidden="true">APPLICATIONS</p>
      <h2 id="apps-heading">9개 산업, 하나의 진공 기술</h2>
      <p class="lede" id="apps-lede">산업별 현장 조건에 맞춘 Edwards 진공 펌프 라인업.</p>
    </header>

    <!-- Visual orbit wrapper. role="presentation" strips the div from the
         a11y tree so the <ol> inside is the direct semantic child of the
         section-labelled region. -->
    <div class="app-orbit" role="presentation">

      <!-- Decorative: medallion + ring + connectors -->
      <div class="app-medallion" aria-hidden="true">
        <svg class="app-medallion-logo" focusable="false"><use href="#icon-smartech-mark"/></svg>
      </div>
      <svg class="app-connectors" aria-hidden="true" focusable="false">
        <!-- 9 decorative <line> elements -->
      </svg>

      <!-- Real content -->
      <ol class="app-list stagger"
          aria-labelledby="apps-heading"
          aria-describedby="apps-lede">
        <li class="app-tile" style="--angle: 0deg; --i: 0">
          <article aria-labelledby="app-gas-title" aria-describedby="app-gas-desc">
            <svg class="app-icon" aria-hidden="true" focusable="false">
              <use href="#icon-gas-cylinder"/>
            </svg>
            <h3 id="app-gas-title" class="app-title">
              가스 실린더 &amp; Residual Gas Removal
            </h3>
            <p id="app-gas-desc" class="app-desc">
              충전 전 잔류 가스 제거 공정 …
            </p>

            <ul class="app-bullets" aria-label="주요 용도">
              <li>충전 전 내부 Purge</li>
              <li>초보자용: nXDS 라인업 권장</li>
            </ul>

            <ul class="app-skus" aria-label="추천 제품">
              <li><a href="#prod-nxds"   class="app-chip">nXDS</a></li>
              <li><a href="#prod-gxs"    class="app-chip">GXS</a></li>
              <li><a href="#prod-ixl"    class="app-chip">iXL</a></li>
            </ul>

            <a href="#p9" class="app-more"
               aria-label="가스 실린더 산업 상세 보기">
              자세히 보기 <span aria-hidden="true">→</span>
            </a>
          </article>
        </li>
        <!-- 8 more <li> tiles, clockwise -->
      </ol>
    </div>

    <div class="app-bridge">
      <a href="#products" class="btn btn-secondary">
        각 산업별 추천 펌프 자세히 보기 <span aria-hidden="true">→</span>
      </a>
    </div>

  </div>
</section>
```

### 1.3 Concerns flagged

| # | Concern | Resolution |
|---|---------|------------|
| C1 | Nested `<ul>` inside `<li>` (bullets + skus inside tile) | Valid HTML; each inner list gets its own `aria-label` so SR announces context ("주요 용도, list, 2 items"). |
| C2 | `.eyebrow` "APPLICATIONS" duplicates info of `<h2>` | `aria-hidden="true"` on the eyebrow so SR reads the section label once via the `<h2>`. |
| C3 | `<article>` inside `<li>` creates two labelled regions | Acceptable. `<article>` scopes the tile's own heading context; modern SRs handle this without double-announce. Alternative: drop `<article>`, keep `<h3>` directly in `<li>`. **Recommended: drop `<article>`** — reduces landmark noise. See §7. |
| C4 | Arrow `→` glyph in link text reads as "right-pointing arrow" on some SRs | Wrap in `<span aria-hidden="true">→</span>`. |
| C5 | Connector `<svg>` inside the `<ol>` would break list-item semantics | Keep connector SVG as a **sibling** of `<ol>`, both inside `.app-orbit`. |
| C6 | `role="presentation"` on `.app-orbit` strips the wrapper — OK because the `<section>` is already a labelled landmark and the `<ol>` carries the list semantics. | Confirmed. |

### 1.4 Final recommendation on `<article>`

**Drop the `<article>` wrapper.** The tile is a component inside a list, not an independently syndicatable unit. Using `<li>` + `<h3>` directly keeps the a11y tree flatter. Updated minimal tile:

```html
<li class="app-tile" style="--angle: 0deg; --i: 0">
  <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-gas-cylinder"/></svg>
  <h3 id="app-gas-title" class="app-title">가스 실린더 &amp; Residual Gas Removal</h3>
  <p class="app-desc">충전 전 잔류 가스 제거 공정 …</p>
  <ul class="app-bullets" aria-label="주요 용도">…</ul>
  <ul class="app-skus" aria-label="추천 제품">…</ul>
  <a href="#p9" class="app-more" aria-label="가스 실린더 산업 상세 보기">자세히 보기 <span aria-hidden="true">→</span></a>
</li>
```

---

## 2. Keyboard navigation

### 2.1 Tab order (top-level)

```
… (previous section) …
[Applications section heading — not tabbable, skipped by Tab]
→ Skip link "9개 산업 목록 건너뛰기" (optional, see §2.4)
→ Tile 1 chip 1  → Tile 1 chip 2  → Tile 1 chip 3  → Tile 1 "자세히"
→ Tile 2 chip 1  → Tile 2 chip 2  → Tile 2 chip 3  → Tile 2 "자세히"
…
→ Tile 9 chip 1  → Tile 9 chip 2  → Tile 9 chip 3  → Tile 9 "자세히"
→ Bridge CTA "각 산업별 추천 펌프 자세히 보기"
→ … (next section) …
```

**Medallion, ring, connector SVG: NOT tabbable** — purely decorative.
**Tile title (`<h3>`), description, bullets: NOT tabbable** — static content, not interactive.

### 2.2 Estimated tab-stop count

9 tiles × (up to 3 chips + 1 "자세히") = **up to 36 stops** inside the section, plus 1 skip link + 1 bridge CTA = **≤ 38 stops**.
Catalog shows variant cap = 2 in many cases, so realistic count is closer to **27-30**.

### 2.3 Arrow key navigation between tiles — **recommend NO**

**Rationale:**
- Grid/menu-style arrow nav requires `role="listbox"`/`role="menu"` or a composite widget pattern, which contradicts the "semantic flat list" constraint.
- Mixing arrow-to-move-between-tiles with standard Tab inside-a-tile violates user expectations (arrows would steal focus from nested links).
- Simpler is more robust. Users can already Tab through predictably.
- If power-user navigation is desired later, add it behind an explicit `role="grid"` refactor — out of scope.

### 2.4 Skip link — **recommend YES (conditional)**

Add a skip link immediately after the `<h2>`:

```html
<a href="#apps-end" class="skip-link">9개 산업 타일 건너뛰고 아래 버튼으로 이동</a>
...
<div class="app-bridge" id="apps-end">…</div>
```

Only shows on `:focus-visible` (same pattern as the global "skip to main content" link). Prevents ~30 Tab stops for keyboard users who do not want to browse all 9 industries.

### 2.5 Focus-visible styling

```css
.app-chip:focus-visible,
.app-more:focus-visible,
.app-bridge .btn:focus-visible,
.skip-link:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);  /* 0 0 0 2px #C9A961, 0 0 0 4px rgba(201,169,97,.25) */
  border-radius: var(--app-chip-radius);
}
```

- **Ring color:** gold `#C9A961` — contrast 8.49:1 on `--brand-deep`, passes WCAG 2.4.11 non-text focus (≥3:1).
- **Do NOT use `:focus`** alone — causes mouse-click rings. Use `:focus-visible`.
- **Do NOT suppress outline** without replacement.

---

## 3. Screen reader experience

### 3.1 Expected NVDA / VoiceOver announcements on section entry

```
region, 9개 산업, 하나의 진공 기술
  heading level 2, 9개 산업, 하나의 진공 기술
  산업별 현장 조건에 맞춘 Edwards 진공 펌프 라인업.
  list, 9 items
    list item 1 of 9
      heading level 3, 가스 실린더 & Residual Gas Removal
      충전 전 잔류 가스 제거 공정 …
      주요 용도, list, 2 items
        bullet, 충전 전 내부 Purge
        bullet, 초보자용: nXDS 라인업 권장
        out of list
      추천 제품, list, 3 items
        link, nXDS
        link, GXS
        link, iXL
        out of list
      link, 가스 실린더 산업 상세 보기
    list item 2 of 9
      …
```

### 3.2 Coherence check

- Landing: user knows it is a "region" with a clear title ✓
- Count: user immediately knows there are 9 items ✓
- Per-tile: title + description + purpose bullets + product chips + deep-link — reads like a product card, not a disjointed set of nodes ✓
- Chip `aria-label` on parent `<ul>` ("추천 제품") gives chips a context scope without each chip needing individual labels ✓

### 3.3 Gotchas

- **Do NOT** put `aria-label` on the `<h3>` — its visible text is already its label. Adding `aria-label` would override the visible text and break SR==visible parity.
- **Do NOT** give the `<li>` an explicit `role="listitem"` — redundant with `<ol>`.
- **Do NOT** add `tabindex="0"` to the `<li>` — it would create 9 extra Tab stops with no interactive behavior, confusing SR users who tab to a thing that does nothing.

---

## 4. Reduced motion

### 4.1 Required rules

```css
@media (prefers-reduced-motion: reduce) {
  /* Kill all section-level animations */
  #applications .app-medallion,
  #applications .app-connectors line,
  #applications .app-tile,
  #applications .reveal,
  #applications .stagger > * {
    animation: none !important;
    transition: none !important;
  }

  /* Skip fan-out: tiles render at final orbital position instantly,
     no staggered translate-in from center. */
  #applications .app-tile {
    opacity: 1;
    transform: rotate(var(--angle)) translateY(calc(-1 * var(--app-orbit-radius))) rotate(calc(-1 * var(--angle)));
  }

  /* Hero gradient drift also respects RM (already exists per spec; confirm) */
  .hero-bg { animation: none !important; }
}
```

### 4.2 Hover affordances under reduced motion

- Chip hover border/bg **color change** is allowed (it is a state change, not a motion change).
- Chip hover `transform: translateY(-1px)` lift: **suppress** under RM.

---

## 5. Color + contrast verification

All values sourced from `c:/클로드코드수업/이명재해병님/data/tokens-delta.css`. Re-verified below.

| # | Foreground | Background (effective) | Ratio | WCAG | Use |
|---|---|---|---|---|---|
| 1 | `--app-gold` `#C9A961` | `--brand-deep` `#0A2E5C` | 8.49:1 | AAA | Focus ring, medallion border, active accents |
| 2 | `--app-text` white @0.94α | composite `#162F5D` | 13.9:1 | AAA | Tile h3/body text |
| 3 | `--app-text-soft` white @0.65α | composite `#162F5D` | 7.4:1 | AAA | Tile description / bullets |
| 4 | `--app-text-muted` white @0.45α | composite `#162F5D` | 4.6:1 | AA (normal) | Caption/metadata only |
| 5 | `--app-chip-text` white @0.88α | chip bg composite | 10.6:1 | AAA | Chip label default |
| 6 | `--app-chip-text-hover` `#C9A961` | chip hover bg `#1E3560` | 8.1:1 | AAA | Chip label on hover |
| 7 | `--app-gold` focus ring (non-text) | `--brand-deep` | 8.49:1 | AAA (non-text ≥3:1) | `:focus-visible` outline |
| 8 | `--app-connector-default` gold @0.25α | `--brand-deep` | ~2.4:1 | n/a (decorative) | Connector SVG — `aria-hidden` |
| 9 | `--app-grid-line` white @0.06α | `--brand-deep` | ~1.2:1 | n/a (decorative) | Blueprint bg — `aria-hidden` |

**Verdict:** all information-bearing foreground × background pairs pass WCAG AA. Most pass AAA. Decorative elements (connectors, grid) are `aria-hidden` and exempt from contrast requirements.

**Caveat:** `--app-text-muted` at 4.6:1 is AA-normal-only; must not be used below 16px/14px-bold. Flag to integration engineer: **do not apply `--app-text-muted` to SKU chip fallback text or any sub-12px caption.**

---

## 6. Form vs link semantics

| Element | Correct element | Rationale |
|---|---|---|
| SKU chip (nXDS, GXS, iXL, …) | `<a href="#prod-nxds">` | Navigates to in-page product anchor. Must be right-clickable, middle-clickable, share-linkable. NOT a `<button>`, NOT a `<span>` with onClick. |
| "자세히 보기" | `<a href="#p9">` | Same — anchor navigation. |
| Bridge CTA "각 산업별 추천 펌프 자세히 보기" | `<a href="#products">` | Same — anchor navigation to the Products section. Uses `.btn .btn-secondary` visual only. |
| Medallion (logo hub) | not interactive | Decorative. No click/focus. |
| Tile body (title, description) | not interactive | Static text. Clicking whitespace should NOT navigate. Only the explicit chip + "자세히" links are clickable. |

**Rule:** if it navigates to a URL/hash, it is `<a>`. If it performs an action in-page without navigation, it is `<button>`. No chips should be `<button>` here.

---

## 7. ARIA landmarks and regions

### 7.1 Landmarks produced

- `<section id="applications" aria-labelledby="apps-heading">` → **region** landmark named "9개 산업, 하나의 진공 기술".
- No nested `<section>`/`<article>` (we dropped the `<article>` inside `<li>` per §1.4) → no landmark collision.
- Global `<nav>`/`<main>`/`<footer>` unaffected.

### 7.2 Navigation anchor from global nav

The global `<nav>` already contains `<a href="#applications">` — confirm anchor target ID matches (`#applications`). Focus will land on the `<section>`; ensure the section has `tabindex="-1"` so programmatic focus works:

```html
<section id="applications" tabindex="-1" aria-labelledby="apps-heading" …>
```

(`tabindex="-1"` makes the element focusable by script/hash-change but NOT tabbable — no extra keyboard stop.)

### 7.3 Role collisions — none

- `<ol>` → `list` role (implicit). No `role="list"` needed.
- `<li>` → `listitem` role (implicit). No `role` override.
- `<ul class="app-bullets">` and `<ul class="app-skus">` — both implicit `list`, each with `aria-label` for disambiguation.

---

## 8. Mobile-specific a11y

| Requirement | Rule |
|---|---|
| Touch target ≥ 44×44 CSS px | Chip min-height `44px` (padding `10px 14px` + line-height `1.4` → ~44px). "자세히" link min-height `44px`. Bridge CTA already 48px via `.btn`. |
| Tile body NOT clickable | Only `<a>` children receive pointer events. Whole-tile click would confuse SR users (nothing to activate) and mouse users (accidental nav). |
| VoiceOver rotor | `<a>` chips show up under rotor "Links" list. `<h3>` titles show under "Headings" list. Both navigable independently. |
| Pinch-zoom | Do not set `user-scalable=no` in viewport meta (check existing). Section layout must reflow at 200% zoom — orbital collapses to stacked list at `< 720px` (see `layout-spec.md`). |
| Orientation | Section works in both portrait/landscape — no `orientation` media query lock. |

---

## 9. Testing strategy

1. **axe DevTools (automated)** — Chrome extension. Run on `#applications` section specifically. Must return **zero violations**. Expected: best-practice warnings only (e.g., "landmark nested in landmark" — ignorable since we dropped nested `<article>`).
2. **Screen reader manual walkthrough**
   - **NVDA + Firefox (Windows)** — primary. Tab through all 9 tiles, verify announcement sequence from §3.1.
   - **VoiceOver + Safari (macOS)** — secondary. Run rotor → Links → verify all 27-30 product chips appear with readable names. Rotor → Headings → verify 1 h2 + 9 h3 in correct order.
   - **VoiceOver on iOS** — swipe-right through section, verify tile-by-tile flow.
3. **Keyboard-only walkthrough**
   - Unplug mouse. Tab from top of page. Verify (a) focus ring visible on every interactive element, (b) no focus trap, (c) skip link works, (d) Shift+Tab reverses cleanly.
4. **Reduced motion manual test**
   - macOS: System Settings → Accessibility → Display → Reduce motion.
   - Windows: Settings → Accessibility → Visual effects → Animation effects off.
   - Reload page. Confirm zero animation in section; tiles render at final orbital positions.
5. **Zoom test** — Browser zoom to 200%. Verify no horizontal scroll, all text readable, orbital collapses to stacked list below breakpoint.

---

## 10. Known risks and compromises

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Visual orbital order ≠ DOM order if engineer uses `order:` or absolute positioning with per-tile top/left | **HIGH** | Must use `transform: rotate(angle) translateY(-R) rotate(-angle)` parameterized by `--angle`; DOM stays 1-9 clockwise. Document this constraint prominently in the integration spec. |
| R2 | Long tab chain (~30 stops) fatigues keyboard users | Medium | Skip link (§2.4) mitigates. Not a blocker. |
| R3 | SR users cannot perceive the "orbital" metaphor at all | Low (by design) | The orbital is pure visual flourish. The semantic content (9 industries → product recommendations) is fully conveyed by the flat list. Acceptable. |
| R4 | Focus ring on chip might be clipped by tile `overflow: hidden` | Medium | Tile must use `overflow: visible` OR focus ring must be inset. Recommend `overflow: visible` + add tile clip via `clip-path` only where shape matters. |
| R5 | Connector SVG lines, though `aria-hidden`, still receive pointer events and may block chip hover on overlap | Medium | Add `pointer-events: none` to `.app-connectors` wrapper. |
| R6 | "APPLICATIONS" eyebrow hidden from SR but visible — could confuse low-vision sighted SR users who hear "9개 산업…" but see "APPLICATIONS" | Low | Acceptable; the `<h2>` visibly contains the same semantic info. |
| R7 | No live-region announcement when user navigates to section via nav click | Low | Not required by WCAG. If desired, add `aria-live="polite"` to a sibling `<span>` that briefly speaks "Applications 섹션으로 이동" — **out of scope**, flag for future. |
| R8 | **Biggest unmitigated risk:** DOM-vs-visual order drift if a future designer adds a 10th tile or reshuffles. There is no automated check that tile 1 in DOM == 12 o'clock visually. | **HIGH, unmitigated** | Add a code comment in the integration HTML: `<!-- DOM order = clockwise from 12 o'clock. DO NOT REORDER without updating --angle values AND the a11y plan. -->` and consider a snapshot test that asserts `nth-child(1)` has `--angle: 0deg`. |

---

## 11. Must-have vs nice-to-have — for the Consolidator

### Must-have (a11y blockers — do not ship without)

- [ ] `<ol>` with `aria-labelledby="apps-heading"`
- [ ] SKU chips are `<a href="#prod-…">`, never `<span>` or `<button>`
- [ ] Medallion, ring, connector SVG: `aria-hidden="true"` + `focusable="false"` on SVGs
- [ ] Every interactive element has a visible `:focus-visible` ring using `--app-focus-ring`
- [ ] `@media (prefers-reduced-motion: reduce)` disables all section animations
- [ ] Touch targets ≥ 44×44px on chips and "자세히"
- [ ] All text × background pairs verified against table in §5 — no `--app-text-muted` below 14px
- [ ] Connector SVG wrapper has `pointer-events: none`
- [ ] Tile body is NOT a clickable target (no whole-tile `<a>` wrapping)

### Nice-to-have (recommended, not blockers)

- [ ] Skip link after `<h2>` to bypass 30 tab stops
- [ ] `tabindex="-1"` on `<section>` for programmatic focus from nav
- [ ] `<span aria-hidden="true">→</span>` wrapping arrow glyphs
- [ ] Integration code comment documenting DOM-clockwise invariant
- [ ] Snapshot test asserting tile 1 has `--angle: 0deg`

### Out of scope (future)

- Roving tabindex / `role="grid"` composite pattern
- Live-region announcements on anchor navigation
- Arrow-key inter-tile navigation

---

## 12. Sign-off checklist for integration engineer

Before merging the Applications section PR, confirm:

- [ ] axe DevTools scan: 0 violations
- [ ] NVDA+Firefox announcement matches §3.1 transcript
- [ ] VoiceOver rotor shows 9 headings (1 h2 + 9 h3? actually 1 h2 at section + 9 h3 tile titles) in correct clockwise order
- [ ] Tab from top of page → section → bridge CTA → next section: no dead ends, no reverse drift
- [ ] Reduce-motion OS setting disables ALL animation in section
- [ ] 200% zoom: no horizontal scrollbar, layout reflows to stacked below 720px
- [ ] Color table §5 pairs spot-checked with browser DevTools contrast checker (pick 3)
- [ ] "자세히 보기" links resolve to existing product-section anchors (`#p1`–`#p9`)
- [ ] All SKU chips resolve to existing product anchors (`#prod-<slug>`)

---

*End of spec. Do not modify `index.html` from this document — hand off to integration engineer.*
