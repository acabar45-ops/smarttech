# Applications Section — Accessibility QA Report

**Auditor:** Accessibility Auditor (Wave 6 QA)
**Date:** 2026-04-16
**Scope:** `index.html` — `#applications` section (lines 1135–1343) + regression spot-check on surrounding sections
**Conformance target:** WCAG 2.2 Level AA
**File state:** audit-only, no edits to `index.html`

---

## 0. Verdict

**PASS-WITH-ISSUES.**

Zero **blockers** (nothing that would prevent shipping on an a11y basis alone).
**1 major** (contrast failure on `--app-text-muted` driven sub-lede).
**3 minor** + **2 nit**.

The section is fundamentally well-built: correct landmark region, correct `<ol>`/`<li>` semantics, real `<a>` elements for every interactive thing, `aria-hidden` on every decorative graphic, `:focus-visible` rings on every interactive element, `pointer-events:none` on connectors, mobile touch targets expanded to 44px, and a global + section-specific reduced-motion block. The only material WCAG AA miss is a single muted-white token used as body copy at 14px — fix is token-scoped.

---

## 1. PASS/FAIL Checklist

### 1.1 Semantics

| # | Item | Result | Evidence |
|---|---|---|---|
| S1 | `<section id="applications">` has `aria-labelledby` → h2 id | **PASS** | `aria-labelledby="apps-heading"` at line 1143; target `<h2 id="apps-heading">` at line 1149 |
| S2 | Tiles are `<li>` inside `<ol>` | **PASS** | `<ol class="app-list stagger">` at 1173; 9× `<li class="app-tile">` at 1177/1194/1211/1229/1246/1262/1279/1296/1314 |
| S3 | No `<article>` wrapper inside `<li>` (D5) | **PASS** | Tiles go directly `<li>` → `<svg>/<h3>/<p>/<ul>/<a>`; grep for `<article` in 1175–1330 = 0 matches |
| S4 | Medallion has `aria-hidden="true"` | **PASS** | Line 1158 — `<div class="app-medallion reveal" aria-hidden="true">` |
| S5 | Connector `<svg>` has `aria-hidden="true"` AND `pointer-events:none` in CSS | **PASS** | Line 1167 HTML `aria-hidden="true" focusable="false"`; line 620 CSS `pointer-events:none` on `.app-connectors`; JS at 2158 also sets `pointer-events="none"` on each path |
| S6 | `.app-orbit` wrapper has `role="presentation"` | **PASS** | Line 1155 |
| S7 | Nested bullet `<ul>` and chip `<ul>` each have `aria-label` | **PASS** | `aria-label="주요 용도"` and `aria-label="추천 제품"` on every tile |
| S8 | Arrow glyphs in link text wrapped in `aria-hidden` span | **PASS** | Every `.app-more` uses `<span aria-hidden="true">→</span>` |
| S9 | Bridge CTA inline SVG arrow has `aria-hidden="true"` | **PASS** | Line 1338 |

### 1.2 Headings

| # | Item | Result | Evidence |
|---|---|---|---|
| H1 | Section uses `<h2>`, not `<h1>` | **PASS** | Line 1149 |
| H2 | Tile titles are `<h3>` | **PASS** | 9× `<h3 class="app-title">` in tiles |
| H3 | No heading level skip (h1→h2→h3 only) | **PASS** | Document uses single `<h1>` at 964 (hero), `<h2>` for section heads, `<h3>` for tiles. No h4/h5 above an h3, no h2 without a preceding h1. |

### 1.3 Interactive elements

| # | Item | Result | Evidence |
|---|---|---|---|
| I1 | SKU chips are `<a>`, never `<span>+onClick` or `<button>` | **PASS** | Every `.app-chip` is `<a class="app-chip" href="...">` (lines 1186–1325) |
| I2 | "자세히 보기" links are `<a>` | **PASS** | Every `.app-more` is `<a href="#pN">` |
| I3 | Bridge CTA is `<a>` | **PASS** | Line 1334 `<a class="btn btn-secondary" href="#products" onclick="goSection('products');return false;">` |
| I4 | All interactive elements have accessible names | **PASS** | Every chip has both inner text ("nXDS") and `aria-label` (see nit N2 below re: redundancy). `.app-more` has inner text and `aria-label`. Bridge CTA has inner text + `aria-label`. |
| I5 | `:focus-visible` styled (not just `:focus`) | **PASS** | Lines 777–783: `.app-chip:focus-visible, .app-more:focus-visible, .app-bridge .btn:focus-visible { outline:none; box-shadow:var(--app-focus-ring); }` — ring is 2px gold + 4px gold-25% halo |
| I6 | Touch targets ≥ 44×44 CSS px on mobile | **PASS** | Line 886 `@media (max-width:767px){ .app-chip{min-height:44px;padding:10px 14px}; .app-more{min-height:44px} }`. Desktop chip is 28px min-height (line 748) which is acceptable per WCAG 2.5.8 AA (24×24 minimum); mobile is the primary touch surface and hits 44px. |
| I7 | Tile body itself NOT clickable (no whole-tile `<a>` wrapper) | **PASS** | `<li>` contains no wrapping anchor; only `.app-chip` and `.app-more` are focusable. |
| I8 | `focusable="false"` on decorative SVGs (IE/legacy guard) | **PASS** | Every `.app-icon`, `.app-connectors`, and bridge-CTA arrow SVG has `focusable="false"` or is `aria-hidden` only — verified on lines 1167, 1178, 1195, 1212, 1230, 1247, 1263, 1280, 1297, 1315, 1338 |

### 1.4 Reduced motion

| # | Item | Result | Evidence |
|---|---|---|---|
| RM1 | Global `@media (prefers-reduced-motion:reduce)` neutralizes animation-duration and sets `.reveal` to final state | **PASS** | Line 275: `*,*::before,*::after{animation-duration:.001ms!important; transition-duration:.001ms!important}` + `.reveal{opacity:1;transform:none}` |
| RM2 | Medallion rotation disabled | **PASS** | Line 900: `.app-medallion-ring { animation: none; }` (also caught by global rule) |
| RM3 | Tile reveal/stagger disabled | **PASS** | Global rule sets `.reveal{opacity:1;transform:none}` and zero transition-duration; JS at line 2184 also `if(reducedMotion){ list.classList.add('in'); return; }` so the 150ms delayed IO gate is bypassed. |
| RM4 | Tile transition suppressed | **PASS** | Line 901: `.app-tile { transition: none; }` |
| RM5 | Connector transition suppressed | **PASS** | Line 902: `.app-connectors path { transition: none; }` |
| RM6 | `.is-focus` pulse neutralized | **PASS** | Lines 903–907: `.prod-card.is-focus { animation:none; outline:2px solid var(--app-gold); outline-offset:4px; }` — static outline replaces the pulse |
| RM7 | Hero drift respects RM | **PASS** | Line 275: `.hero-bg{animation:none}` |
| RM8 | Connector stroke-dashoffset animation (if any) disabled | **N/A / PASS** | No stroke-dashoffset animation is actually wired in CSS or JS — connectors are static dashed lines with only `stroke`/`stroke-width` transitions on hover, and those are killed by RM2+global rule. The a11y-plan mentioned stroke-dashoffset but the implementation doesn't use it, so nothing to disable. |

### 1.5 Keyboard navigation (mental walkthrough)

Tab sequence inside `#applications`:

```
Tile 1 (gas-cylinder): nXDS chip → E2M chip → nEXT chip → "가스 퍼지…" more-link    [4 stops]
Tile 2 (insulated):    T-Station → nXDS → ELD500 → "극저온 배관…"                    [4 stops]
Tile 3 (battery):      GXS160 → GXS250/2600 → nES → EXS → "이차전지…"               [5 stops]
Tile 4 (furnace):      GXS 시리즈 → EXS → EH → "진공로…"                              [4 stops]
Tile 5 (oven):         nXDS → GXS → "저온 건조…"                                      [3 stops]
Tile 6 (OLED):         GXS → EXS → iXH → "OLED 증착…"                                 [4 stops]
Tile 7 (freeze-dry):   EM 시리즈 → GXS → EXS → "동결건조…"                           [4 stops]
Tile 8 (coating):      nES → EXS → GXS → STP Turbo → "AR/AF…"                         [5 stops]
Tile 9 (research):     nXRi → nXDS → nEXT → "분석 장비…"                              [4 stops]
Bridge CTA                                                                               [1 stop]
                                                                          TOTAL = 38 stops
```

| # | Item | Result | Notes |
|---|---|---|---|
| K1 | Tab enters section cleanly (no dead stop on section/header) | **PASS** | `tabindex="-1"` on `<section>` makes it scriptable but not tabbable — correct. |
| K2 | Every focusable element has visible focus ring | **PASS** | `:focus-visible` rule at 777–783 covers chips, more-links, bridge CTA. |
| K3 | No focus trap | **PASS** | No `tabindex>0`, no JS focus trapping, no modal. Tab flows linearly. |
| K4 | No tile has more than 4 focusable elements | **MINOR FAIL** | Tile 3 (이차전지) and Tile 8 (코팅) each have **5 focusable elements** (4 chips + 1 more-link). The a11y-plan §2.2 scoped "up to 3 chips" and the follow-up "variants max 2" commit (f3a0be4) set a cap=2 per SKU type. See Issue M1. |
| K5 | Reverse Tab (Shift+Tab) reverses cleanly | **PASS** | Standard source-order tab ring. |
| K6 | `tabindex="-1"` only where intentional | **PASS** | Only on `#applications` section (line 1144) for nav-hash focus — correct use per plan §7.2. |
| K7 | Skip link for 38 tab-stops | **NOT PRESENT** | Nice-to-have from plan §2.4, not implemented. Not a WCAG failure (2.4.1 is satisfied by page-level skip link / landmark nav). See Recommendation R1. |

### 1.6 Screen reader flow (NVDA + Firefox mental walkthrough)

Entering `#applications`:

```
region, 9대 산업을 잇는 진공 솔루션
  heading level 2, 9대 산업을 잇는 진공 솔루션
  반도체부터 이차전지·제약 동결건조까지, …               ← lede (from <p class="lede">)
  list, 9 items
    list item 1 of 9
      heading level 3, 가스 실린더 & 잔류가스 제거
      실린더 충전 전 잔류가스를 제거해 …
      주요 용도, list, 2 items
        • 충전 전 내부 Purge…
        • 추천 모델: nXDS, E2M, nEXT
        out of list
      추천 제품, list, 3 items
        link, nXDS 제품 상세 보기              ← aria-label wins over inner "nXDS"
        link, E2M 견적 페이지로 이동
        link, nEXT 제품 상세 보기
        out of list
      link, 가스 퍼지·잔류가스 제거 가이드 블로그 글 보기
    list item 2 of 9
      …
    (… 7 more …)
    out of list
  link, 각 산업별 추천 Edwards 펌프 전체 카탈로그로 이동
```

| # | Item | Result | Notes |
|---|---|---|---|
| SR1 | Section announced as labelled region | **PASS** | `<section aria-labelledby>` produces region landmark |
| SR2 | List count announced ("list, 9 items") | **PASS** | `<ol>` carries implicit list role |
| SR3 | Per-tile structure flows (heading → desc → bullets → chips → more-link) | **PASS** | DOM order matches reading order |
| SR4 | Eyebrow "APPLICATIONS" hidden from SR | **PASS** | `aria-hidden="true"` on line 1148 |
| SR5 | `h2-sub` English subtitle hidden from SR | **PASS** | `aria-hidden="true"` on line 1150 — correct, avoids double-announce of the semantic title. |
| SR6 | Arrow glyphs not announced | **PASS** | All arrows in `<span aria-hidden="true">` |
| SR7 | Chip `aria-label` overrides text name | **NIT** | chips with `aria-label="nXDS 제품 상세 보기"` override the visible text "nXDS". Accessible-name-and-label.readable parity is mostly preserved (visible text is a proper prefix of the label) but this is the "label-in-name" gray area for SC 2.5.3. See Nit N2. |

### 1.7 Mobile

| # | Item | Result | Evidence |
|---|---|---|---|
| M1 | Chip touch target ≥ 44×44px on ≤767px | **PASS** | Line 886 min-height:44px, padding:10px 14px |
| M2 | More-link touch target ≥ 44px on ≤767px | **PASS** | Line 887 |
| M3 | Bridge CTA ≥ 44px (`.btn` default) | **PASS** | Global `.btn` is 48px |
| M4 | Hover-only affordances have tap alternative | **PASS** | On mobile, the orbital fan-out and tile-hover connector-highlight simply don't apply — the layout collapses to a single-column stack (lines 862–890). `.app-orbit:hover .app-tile{opacity:1;filter:none}` at line 883 explicitly neutralizes the hover-dim-others pattern on mobile. Tap-active state at line 885 provides tactile feedback. |
| M5 | No `user-scalable=no` in viewport | **PASS** | Line 5: `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` — no scale lock |
| M6 | 200% zoom / reflow | **PASS** (inferred) | Grid layout at tablet breakpoint (768–1023) and 1-col stack (≤767) covers the zoom-equivalent layouts. No fixed-width content in the section. |

### 1.8 Other

| # | Item | Result | Evidence |
|---|---|---|---|
| O1 | No stray `tabindex>0` | **PASS** | Only `tabindex="-1"` on section (intentional) |
| O2 | All `<img>` have `alt` | **PASS** | Section uses only `<svg use>` icons (aria-hidden), no `<img>` elements |
| O3 | Chip `href`s resolve to real targets | **PASS w/ ACCEPTED-DEVIATION** | 6 of the `#prod-*` anchors resolve: `#prod-nxds, #prod-gxs, #prod-next, #prod-rv, #prod-eh, #prod-tstation` exist at lines 990/1020/1035/1005/1065/1095. The remaining chip hrefs point to `quote.html?model=…` — valid external targets per the catalog's "prefer quote page for unlisted variants" pattern (commits d34ed4b, f3a0be4). Not a WCAG issue. |
| O4 | More-link `href`s resolve (`#p2, #p4, #p6, #p7, #p9, #p10`) | **PASS** | All exist per preservation manifest (`p1`–`p10`). |

---

## 2. Color Contrast Matrix

All ratios computed from the actual token values in `:root` (lines 459–506). Alpha-composited over `--brand-deep #0A2E5C` where applicable.

| # | Foreground | Background (effective) | Computed ratio | WCAG AA | AAA | Used at |
|---|---|---|---|---|---|---|
| C1 | `--app-text` white α=0.94 → ~#F0F2F5 | `--brand-deep` #0A2E5C | **12.06 : 1** | ✓ pass | ✓ pass | h2, .app-title, .app-medallion-title |
| C2 | `--app-text-soft` white α=0.65 → ~#A9B5C5 | #0A2E5C | **6.54 : 1** | ✓ pass | ✓ pass | .app-desc, .app-bullets, .lede, .h2-sub |
| C3 | **`--app-text-muted` white α=0.45 → ~#788CA5** | **#0A2E5C** | **3.92 : 1** | ✗ **FAIL** (normal) | ✗ fail | `.section.dark .lede-sub` at 14px (line 543) → **used on `.lede-sub.mobile-only` line 1152** |
| C4 | `--app-gold` #C9A961 | #0A2E5C | **5.99 : 1** | ✓ pass | ✗ fail AAA | Eyebrow, `.app-medallion-kicker`, `.app-icon`, `.app-more` text, `.app-bridge .btn-secondary` text |
| C5 | `--app-chip-text` white α=0.88 on chip bg white α=0.08 (effective ~#1D3F69) | chip bg ~#1D3F69 | **8.69 : 1** | ✓ pass | ✓ pass | Default chip label |
| C6 | `--app-gold` #C9A961 | chip hover bg (gold α=0.15 on #0A2E5C ~ #26405D) | **4.70 : 1** | ✓ pass (normal, 11.5px mono: see note) | ✗ fail AAA | Chip label on hover/focus |
| C7 | `--app-gold` ring (non-text 2px) | #0A2E5C | **5.99 : 1** (≥3:1 required) | ✓ pass non-text | — | `:focus-visible` outline |
| C8 | `--brand-deep` text | `--app-gold` button fill (hover) | **5.99 : 1** | ✓ pass | ✗ fail AAA | Bridge CTA hover state |
| C9 | `--app-connector-default` gold α=0.25 | #0A2E5C | ~1.9 : 1 | n/a (decorative, aria-hidden) | — | Connector paths |
| C10 | `--app-grid-line` white α=0.06 | #0A2E5C | ~1.1 : 1 | n/a (decorative, aria-hidden, masked further by radial gradient) | — | Blueprint grid bg |

**Note on C3:** The a11y plan §5 row 4 asserted 4.6:1, but the actual ratio against `--brand-deep` is **3.92:1**. The plan was computed either against a lighter composite or with a different gamma model. This means `--app-text-muted` **fails WCAG AA 1.4.3** when applied to any body-copy-sized text on the dark section. This is currently the case at:

- **Line 543** (CSS): `.section.dark .lede-sub { color: var(--app-text-muted); font-size: 14px; }` — 14px normal text.
- **Line 1152** (HTML): `<p class="lede-sub mobile-only">반도체·이차전지·제약·연구 등 …</p>` — rendered on mobile.

**Note on C6:** chip text is 11.5px mono (line 739). At ≤13.3px normal, 4.70:1 passes AA by a narrow 0.2 margin. Acceptable but tight — any future reduction of opacity or darkening of hover bg would break it.

**Note on C4 eyebrow:** eyebrow letterspace .18em at small size — passes for its 13px size treating it as normal text.

---

## 3. Issues Found

### Major

**M1 — `--app-text-muted` (#788CA5 composite) fails WCAG AA 1.4.3 on dark section.**
**File:line:** `index.html:543` (CSS rule), `index.html:1152` (HTML usage).
**Severity:** Major (AA failure, user-facing).
**Description:** `.section.dark .lede-sub` renders at 14px normal-weight on `--brand-deep #0A2E5C`. Measured contrast 3.92:1 vs. required 4.5:1. The plan document claimed 4.6:1 but actual math yields below-AA. Currently only affects the mobile-only sub-lede string, but the CSS rule is generic and any future use of `--app-text-muted` on the dark band at <18px will also fail.
**Recommended fix:** Either raise the opacity of `--app-text-muted` from 0.45 → 0.55 (which yields ~5.0:1), OR swap `.section.dark .lede-sub` to use `--app-text-soft` (6.54:1). Second option is safer and token-scope-preserving. Follow-up PR should NOT change `--app-text-muted` in `:root` tokens without auditing any other usages first (grep shows usage only in `.section.dark .lede-sub`).

### Minor

**m1 — Tiles 3 and 8 exceed the "max 2 variants" / "up to 3 chips" cap.**
**File:line:** `index.html:1219–1224` (Tile 3, 4 chips), `index.html:1304–1309` (Tile 8, 4 chips).
**Severity:** Minor (spec-drift, not a11y failure).
**Description:** Plan §2.2 scoped "up to 3 chips"; commit f3a0be4 ("variants max 2") tightened this. Tile 3 has 4 chips (GXS160, GXS250/2600, nES, EXS) and Tile 8 has 4 chips (nES, EXS, GXS, STP Turbo). Adds 2 extra tab stops, taking total from an expected ~28–30 to 38. Not a WCAG violation but contradicts the design contract.
**Recommended fix:** Either (a) merge GXS160 + GXS250/2600 into "GXS 시리즈" chip, and drop one of nES/EXS in tile 8, OR (b) update the design spec to accept cap=4. Coordinate with the Product Typing spec.

**m2 — `<p class="h2-sub">` uses `aria-hidden="true"` but is visually readable.**
**File:line:** `index.html:1150`.
**Severity:** Minor.
**Description:** The English subtitle "Vacuum Applications Across 9 Industrial Domains" is visible to sighted users but hidden from screen readers. For low-vision SR users who rely on both, this creates a mismatch. The eyebrow at line 1148 is already `aria-hidden`, and the h2 conveys the same info in Korean, so double-hiding isn't strictly wrong — but the English subtitle carries *additional* info (it's an English translation, not a duplicate).
**Recommended fix:** Remove `aria-hidden="true"` from the h2-sub, OR mark it with `lang="en"` and keep it announced so bilingual/English SR users benefit. Lowest-risk option: remove the `aria-hidden` and add `lang="en"`.

**m3 — Bridge CTA uses `<a href="#products" onclick="return false;">` pattern.**
**File:line:** `index.html:1334–1339`.
**Severity:** Minor (defensible; not a WCAG failure).
**Description:** The anchor hijacks click via `onclick="goSection('products');return false;"`. Keyboard users who activate with Enter still trigger `onclick`, which calls `goSection` — so keyboard parity holds. Middle-click / right-click-open-in-new-tab fall back to the `href="#products"` which still works (same page hash). No user-facing a11y bug. Flagged for consistency with modern practice (prefer `addEventListener` in JS block).
**Recommended fix:** None strictly required. If refactoring, move the handler into the JS section and drop the inline `onclick`.

### Nit

**N1 — Plan's color contrast table (a11y-plan.md §5) reports optimistic ratios.**
**Severity:** Nit (documentation quality).
**Description:** Plan claims gold on brand-deep = 8.49:1; actual = 5.99:1. Claims white-α45 = 4.6:1; actual = 3.92:1. Other pairs broadly match (α94 ≈ 12:1, α65 ≈ 6.5:1). The discrepancies don't change the overall AA verdict except for `--app-text-muted` (M1).
**Recommended fix:** Update plan's §5 table after this report lands; propagate the M1 decision into the tokens layer.

**N2 — Redundant `aria-label` on SKU chips where visible text already suffices.**
**File:line:** every `.app-chip` in tiles (e.g. line 1186).
**Severity:** Nit (SC 2.5.3 "Label in Name" gray area).
**Description:** Example: `<a class="app-chip" aria-label="nXDS 제품 상세 보기">nXDS</a>`. The visible text is "nXDS"; the aria-label is "nXDS 제품 상세 보기". Because the aria-label **starts with** the visible text, speech-input users can still say "nXDS" to activate — passes SC 2.5.3. However, the label is more verbose than the visible text, which can surprise users when SR announces a longer phrase than what they see. Acceptable pattern but could be simplified.
**Recommended fix:** Consider removing `aria-label` from chips with a single-word visible name (e.g. "nXDS" already tells the user what the link is) and rely on inner text + the parent `<ul aria-label="추천 제품">` context. Keep `aria-label` only where the visible text is ambiguous (e.g. "GXS250/2600" where the full context "GXS250/2600 제품 상세 보기" helps clarify). Non-blocking.

---

## 4. Recommendations (Non-blocking)

**R1 — Skip link for 38-tab-stop sequence.**
The section is a long tab-ring in the middle of the page. Keyboard users who only want the bridge CTA must Tab through every chip. Plan §2.4 already specified the implementation; it simply wasn't integrated. Low cost, meaningful usability win.

**R2 — Add `lang="en"` to the English h2-sub and English product names (SKUs).**
Currently the page `<html lang="ko">` implicitly covers everything. Korean SRs will pronounce "nXDS", "GXS", "T-Station" with Korean phonetic rules, which is actually fine for these being English-model-names, but adding `lang="en"` on the chip text would let SRs pronounce "nEXT", "EM 시리즈" more naturally. Nice-to-have.

**R3 — Verify medallion-glow `box-shadow` (0 0 48px rgba(201,169,97,0.18)) is not a motion trigger** under reduced motion. It isn't (it's a static shadow), but document this in the motion spec to avoid future confusion.

**R4 — Add a snapshot test for the DOM-clockwise invariant.**
From plan §10 R8 — unmitigated risk. A simple Jest/Playwright assertion that `.app-tile:nth-child(1)` has inline `--angle: 0deg` would catch regressions if a future editor reorders tiles.

**R5 — Consider replacing `.h2-sub aria-hidden="true"` pattern globally with sighted-visible + SR-announced.**
Currently both the "APPLICATIONS" eyebrow AND the "Vacuum Applications Across 9 Industrial Domains" subtitle are hidden from SR. Pattern is safe but information-losing. Part of m2.

---

## 5. Regression spot-check (existing sections)

Spot-checked Hero (964), Products (985), Services (1349), FAQ (1410), Contact (1428):

- Hero `<h1>` still singular and present at 964: **PASS**
- No duplicate IDs introduced by Applications: **PASS** (grep `id="applications"` appears only at 1141; all new IDs are tile-scoped via `data-tile-id` not `id`)
- `.reveal` class still active on existing sections: **PASS** — Applications uses the same IO and `.stagger` pattern, no conflict.
- `prefers-reduced-motion` global rule still covers `.hero-bg` and `.reveal`: **PASS** (line 275 unchanged)
- Scroll-margin-top at 64px still applied to all `section[id]` including `#applications`: **PASS** (line 416 rule is unchanged; `#applications` inherits)
- No existing `:focus-visible`, `:focus`, tabindex, or aria-label pattern was altered.

No regressions detected.

---

## 6. Summary

| Category | Count |
|---|---|
| Blocker | 0 |
| Major | 1 (M1: `--app-text-muted` contrast) |
| Minor | 3 (m1 chip cap drift, m2 h2-sub SR hiding, m3 inline onclick) |
| Nit | 2 (N1 plan contrast doc, N2 redundant aria-label) |
| Recommendations | 5 |

**Verdict: PASS-WITH-ISSUES.** Safe to ship after addressing M1 (token-scoped, ~5-minute fix). Everything else is defensible or nice-to-have.

---

*End of report. No `index.html` edits made.*
