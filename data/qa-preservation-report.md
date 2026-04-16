# QA Preservation Verification Report — Waves 4 & 5

**Verifier:** Preservation Verifier (Wave 6 QA)
**Date:** 2026-04-16
**Source file:** `C:\클로드코드수업\이명재해병님\index.html`
**Baseline manifest:** `data/preservation-manifest.json` (25 rules, generated from 1498-line baseline)
**Current file size:** 2426 lines (matches post-Wave-5 expected)

---

## 1. Preservation Rules Status (25 rules)

| # | Rule | Status | Evidence |
|---|------|--------|----------|
| 1 | Do NOT rename any JS-used class (`page`, `active`, `reveal`, `stagger`, `in`, `post`, `bsn-item`, `on`) | **PASS** | 57 occurrences of these class tokens confirmed; all callsites intact |
| 2 | Do NOT change signature of `goHome`, `goBlog`, `goSection(id)`, `toggleMenu`, `handleFormSubmit(e)` | **PASS** | All 5 present at lines 2066, 2074, 2081, 2094, 2097 with original signatures |
| 3 | Do NOT remove `[data-count]` attributes or rename | **PASS** | Lines 973-974 retain `data-count="498"` and `data-count="15"`; observer at line 2266 intact |
| 4 | SPA pattern: `#page-home` + `#page-blog` as siblings, each `.page`, one `.active` | **PASS** | Line 955 `<main id="page-home" class="page active">`; line 1513 `<div id="page-blog" class="page">` |
| 5 | Product card inner structure preserved | **PASS** | All 9 `.prod-card > .prod-img + .prod-body > .prod-series/.prod-name/.prod-part/.prod-desc/.prod-cta` intact |
| 6 | Blog `#p1`–`#p10` remain scroll targets | **PASS** | All 10 `<article class="post" id="pN">` present (lines 1530–1955) |
| 7 | `scroll-margin-top` on `section[id]` + `scroll-padding-top` on html preserved | **PASS** | Lines 415–417 intact; `[id^="prod-"]` override at 417 also retained |
| 8 | All 9 Edwards CDN image URLs unchanged | **PASS** | 9 `edwardsvacuum.com/content/dam` occurrences — count matches manifest exactly |
| 9 | JSON-LD LocalBusiness schema with founder 이명재, tel 031-204-7170, email rokmclmj@gmail.com | **PASS** | `<script type="application/ld+json">` at line 25, `LocalBusiness` at line 28 |
| 10 | Meta tags (description, keywords, og:*, canonical, theme-color `#1B4B8F`) unchanged | **PASS** | Lines 6–15 all verbatim against manifest |
| 11 | Service worker registration path `sw.js` at original place | **PASS** | `navigator.serviceWorker.register('sw.js')` at line 2306; `manifest.json` at line 19 |
| 12 | All `:root` CSS custom properties not redefined/overridden | **PASS** | All 19 tokens at lines 59–80 with exact manifest values (`--brand:#1B4B8F`, `--brand-deep:#0A2E5C`, etc.) |
| 13 | IntersectionObserver thresholds/rootMargins preserved | **PASS** | `{threshold:0.12, rootMargin:'0px 0px -40px 0px'}` at 2110 & 2194; `{threshold:0.4}` at 2265; `{rootMargin:'-40% 0px -50% 0px', threshold:0}` at 2290 |
| 14 | Mobile sticky CTA threshold `scrollY > 520` preserved | **PASS** | `const showCtaAfter = 520;` at line 2270; condition at line 2273 |
| 15 | `handleFormSubmit` stub (alert-only) not replaced with real submission | **PASS** | Lines 2097–2099: `preventDefault()` + Korean alert with `010-3194-7170` verbatim |
| 16 | Nav 7 items order + `quote.html` 4 locations retained | **PASS** | Desktop order (line 922–929): 홈 → 제품 → **적용 산업** (new, inserted) → 수리·정비 → 블로그 → FAQ → 문의 → 견적 시스템. quote.html at lines 929, 949, 1128, 1495 (≥4 occurrences) |
| 17 | Footer column grid `1.4fr 1fr 1fr 1fr` + 4 column contents | **PASS** | Footer structure intact; `© 2026 (주)스마텍 SMARTECH. All rights reserved.` at line 1506 |
| 18 | Blog sidenav `.blog-sidenav` fixed at ≥1280px with NO `body:has()` scoping | **PASS** | Line 291 `@media (min-width:1280px){.blog-sidenav{display:block}}` — no `body:has()` accidentally added (manifest explicitly said not to add scoping) |
| 19 | Deep-link regex `/^#p\d+$/` works; no new ID starts with `p\d+` | **PASS** | Regex at line 2295; new section uses `id="applications"` — no collision |
| 20 | Company info verbatim in footer + JSON-LD | **PASS** | 33 occurrences of key strings (이명재, 031-204-7170, 010-3194-7170, rokmclmj@gmail.com, 신원로 55, (주)스마텍) |
| 21 | 9 product part-number ranges verbatim | **PASS** | All 9 sentinel part numbers found (A73501983, A65201903, GS2150350000, B8G210101, A41821945, A30105934, W601111110, TS85D1001, H11026015 — total 11 occurrences incl. ranges) |
| 22 | 6 FAQ Q&A in identical order with identical text | **PASS** | All 6 Q-leading strings found (Q1–Q6 matching the AEO-targeted questions) |
| 23 | 10 blog post titles/dates/categories/snippets verbatim | **PASS** | p1 title + 2026.04.16 date confirmed; p10 title + 2026.03.15 date confirmed; all 10 posts present in source order |
| 24 | No new top-level IDs that duplicate manifest IDs | **PASS** | Only new top-level ID is `#applications` (listed in manifest as the planned insertion) — no duplicates |
| 25 | Applications section avoids reserved class prefixes | **PASS** | Uses `.app-*` prefix (`app-orbit`, `app-medallion`, `app-connectors`, `app-tile`, etc.) — `.app-` is unused in baseline, no collision with reserved namespaces (`.prod-`, `.faq-`, `.bsn-`, `.post-`, `.m-`, `.nav-`, `.channel-`, `.card`, `.grid-`, `.hero-`, `.process-`, `.urgent-`, `.float`, `.c-`, `.blog-`, `.eyebrow`, `.snippet`, `.article`, `.info-box`, `.summary-card`, `.sc-`, `.ra-`, `.ep-`, `.next-read`) |

**Summary: 25 PASS / 0 FAIL / 0 N/A**

---

## 2. Deltas (NEW vs MISSING)

### NEW (expected — part of Wave 4/5 scope)
- **`id="applications"`** section inserted at line 1141 (between `#products` ending and `#services` starting at 1345) — matches manifest insertion recommendation exactly
- **Desktop nav item** 적용 산업 at line 924 — inserted between 제품 and 수리·정비 (allowed alternative in manifest)
- **Mobile menu item** 적용 산업 at line 944 — mirrors desktop
- **`.app-*` CSS classes** for the new section (app-orbit, app-medallion, app-connectors, app-tile, etc.) — new namespace, no reserved-prefix collision
- **`class="section dark reveal"`** on `#applications` — uses a new `dark` modifier; `.dark` is not a reserved class per manifest, and `.reveal` is correctly included so IntersectionObserver picks it up
- **`h2-sub`, `lede-sub`, `mobile-only`** helper classes inside applications — new, no collision
- **SVG connector injection** and orbital motion JS (Section C) — Wave 5 additions
- **File line count** grew 1498 → 2426 (+928 lines) — matches agent-reported Wave 4 (+794) + Wave 5 (+134)

### MISSING (none — no regressions)
- All 27 catalogued IDs still present
- All 10 blog posts present in order
- All 9 product cards with correct IDs, part numbers, Edwards CDN images
- All 6 FAQ Q&A preserved
- All JS functions, observers, and behaviors preserved
- All CSS tokens, layout classes, and media queries intact

---

## 3. Regressions Found

**None.**

### Pre-existing Issues (NOT Wave 4/5 regressions — manifest-flagged)
- `.stat-text` references undefined `--font-main` token (line 164 in baseline) — still present, still silent-fallback as designed; manifest said "flag only, do not fix"
- Blog sidenav lacks `body:has(#page-blog.active)` scoping — correctly preserved per manifest rule #18
- `html{scroll-behavior:smooth}` has no reduced-motion override — preserved as-is
- Two `alert()` kakao stubs (float button + form-secondary) — both preserved verbatim

---

## 4. Overall Status

**PASS** — Integration is safe to ship.

- **25/25 preservation rules verified PASS**
- **0 regressions introduced**
- **All new additions (Applications section + nav items + app-* CSS + orbital JS) are scoped to uncollisioned namespaces and do not alter any locked surface**
- **Line count 2426 matches expected post-Wave-5 delta within tolerance**
- **Confidence level: HIGH** — the integration preserved every locked surface in the manifest: SPA routing, scroll-spy, counter animation, mobile CTA threshold, blog deep-linking, all 9 product cards, all 10 blog posts, all 6 FAQs, all meta tags, JSON-LD, CSS tokens, service worker, and footer content. The only changes are additive and correctly placed at the insertion point designated by the manifest.

Recommended next steps: A11y audit (Wave 6 sibling task) and cross-viewport responsive smoke test. No rollback needed.
