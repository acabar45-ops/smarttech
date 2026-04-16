# SMARTECH Homepage — Sitemap & Routing Decision

**Author:** Information Architect
**Date:** 2026-04-16
**Scope:** Integration of new `#applications` section (9 vacuum industry domains) into existing single-page `index.html`.
**Decision mode:** Additive only. No existing anchor IDs, routing functions, or blog deep-links are modified.

---

## 1. Final Section Order (after integration)

```
1. Nav (sticky, 64px)
2. #hero              브랜드·CTA + 핵심 지표 4 셀
3. #products          Edwards 9 제품 카드 (light surface)
4. #applications      NEW — 9 산업 도메인 (dark navy #0A2E5C)   ← INSERT POINT
5. #services          수리·정비 서비스
6. #faq               자주 묻는 질문
7. #contact           견적·연락 폼
8. Footer             연락·법적 고지
9. #page-blog         SPA sibling page — 10 기술 포스트 (#p1–#p10)
```

**Rationale for slot 4:** `#products` answers "무엇을 파는가?" `#applications` answers "어디에 쓰는가?" Placing Applications immediately after Products lets a visitor who just browsed the catalog pivot naturally to "이게 우리 공정에 맞나?" without scrolling back. Services/FAQ/Contact remain the conversion funnel tail.

**Visual rhythm:** Section 4 is the only dark-navy block, creating a deliberate "break" between the product catalog (light) and services (light). This is intentional — it signals a conceptual shift from SKU to domain.

---

## 2. Navigation Definitions

### Current nav (verified at `index.html` lines 461–468)
```
홈 · 제품 · 수리·정비 · 블로그 · FAQ · 문의 · 견적 시스템
```

### Proposed desktop nav (in order)
```
홈 · 제품 · 적용 산업 · 수리·정비 · 블로그 · FAQ · 문의 · 견적 시스템
                  ↑ NEW (inserted between 제품 and 수리·정비)
```

**Link label:** `적용 산업`
**Why this label (not "응용 분야" / "산업 솔루션"):**
- 2 words, 4 chars — fits same visual weight as "수리·정비"
- `적용` verb-flavor pairs well with `제품` noun-flavor → visitor reads "제품 → 적용 산업" as a cause-effect chain
- `산업` is the SEO term Korean buyers actually type (vs. "응용")

### Proposed markup (desktop, reference only — do not edit)
```html
<a class="nav-link" href="#applications"
   onclick="goHome();goSection('applications');return false;">적용 산업</a>
```
Insert between existing `제품` link (line 463) and `수리·정비` link (line 464).

### Mobile hamburger menu (m-sheet)
```
홈
제품 라인업
적용 산업      ← NEW (inserted between 제품 라인업 and 수리·정비 서비스)
수리·정비 서비스
기술 블로그
FAQ
문의하기
견적 시스템
[견적 문의하기 CTA]
```

Insert line between `index.html:482` and `index.html:483`:
```html
<a class="m-link" href="#applications"
   onclick="toggleMenu();goHome();goSection('applications');return false;">적용 산업</a>
```

### Active state behavior
When `scroll` event fires and `#applications` intersects viewport center:
- `.nav-link[href="#applications"]` gets `.active`
- All sibling `.nav-link` lose `.active`
- Reuse existing scroll-spy logic (already watching `#products`, `#services`, `#faq`, `#contact`) — just add `'applications'` to the observer target array.

### CTA button
**Untouched.** `.btn-primary[href="#contact"]` (line 472) stays as-is. The Applications section is discovery, not conversion — the contact CTA remains the single conversion path.

---

## 3. Routing Rules

### 3.1 `goSection('applications')`
**No special handling required.** Reuse existing `goSection(id)` verbatim. The existing implementation uses `element.scrollIntoView({behavior:'smooth', block:'start'})` and respects `scroll-margin-top` set on `section[id]` (index.html:416) — `#applications` inherits this automatically.

### 3.2 Blog deep-links
`#p1` through `#p10` remain untouched. The Applications section does **not** share the `#p*` namespace. Verified at `index.html` lines 849–1274 — all 10 post IDs are intact and owned by `#page-blog`.

### 3.3 New URL fragment patterns
Register **per-tile anchors** so external traffic (Korean search results, partner emails, sales decks) can deep-link to a specific industry:

```
#app-battery      이차전지
#app-oled         OLED·디스플레이
#app-semi         반도체
#app-solar        태양광
#app-coating      박막·코팅
#app-analytical   분석기기 (질량분석·전자현미경)
#app-rnd          연구·대학 R&D
#app-leak         리크디텍션·헬륨 테스트
#app-industrial   일반 산업 (진공건조·탈기·성형)
```

(Final 9 industry labels subject to Wave 2a confirmation — anchors are stable naming contract regardless of display copy revisions.)

**Resolution rule:** On page load, `location.hash` is inspected:
1. If matches `#app-*` → scroll to `#applications`, then open the matching tile (desktop: highlight orbital node; mobile: scroll stacked card into view + `.is-focus` flash).
2. If matches `#p*` → existing blog deep-link handler takes over (no change).
3. Otherwise → existing `goSection` or `goHome` behavior.

### 3.4 Browser history
Per-tile clicks should use `history.replaceState()` (not push) to avoid polluting back-button history with every hover/open. Only update hash on explicit user click, not on scroll-spy observation.

---

## 4. Cross-Linking Specification (9 Applications → destinations)

Primary destination: the most relevant blog post (if one exists).
Fallback: `#products` with highlighted product card.
Tertiary: `quote.html` (external SPA) when neither blog nor product card fits.

| # | Application       | Anchor         | Primary link          | Fallback                    | Tertiary           |
|---|-------------------|----------------|-----------------------|-----------------------------|--------------------|
| 1 | 이차전지          | #app-battery   | #p4 (GXS · 이차전지)  | #products (GXS 카드 focus)  | quote.html?app=battery |
| 2 | OLED·디스플레이   | #app-oled      | #p6 (OLED 증착)       | #products (nEXT 카드 focus) | quote.html?app=oled |
| 3 | 반도체            | #app-semi      | #p10 (iXH 반도체 드라이) | #products (GXS 카드 focus) | quote.html?app=semi |
| 4 | 태양광            | #app-solar     | — (no post)           | #products (EH 카드 focus)   | quote.html?app=solar |
| 5 | 박막·코팅         | #app-coating   | #p6 (증착 공정 공유)  | #products (nEXT 카드 focus) | quote.html?app=coating |
| 6 | 분석기기          | #app-analytical| #p3 (터보펌프 기초)   | #products (nEXT 카드 focus) | quote.html?app=analytical |
| 7 | 연구·대학 R&D     | #app-rnd       | #p1 (RV·스크롤 선택)  | #products (nXDS 카드 focus) | quote.html?app=rnd |
| 8 | 리크디텍션        | #app-leak      | #p7 (헬륨 리크)       | #products (gauges focus)    | quote.html?app=leak |
| 9 | 일반 산업         | #app-industrial| #p2 또는 #p9          | #products (EH 카드 focus)   | quote.html?app=industrial |

**Total primary+fallback destinations defined:** 9 primary (7 blog-backed, 2 product-only) + 9 fallback product cards + 9 tertiary quote links = **27 link pairings**, all resolving inside the site (no 404 risk). Wave 2a copy review may swap one primary blog target, but fallback chain absorbs any change.

**Controversial pick:** #app-solar and #app-industrial have no dedicated blog post. Rather than force a weak post match, we promote the **product card fallback** to primary and label the link "제품 보기" instead of "자세히 읽기." This is honest UX — we don't pretend a post exists.

---

## 5. SKU Chip → Product Card Anchor Mapping

**Precondition:** Product cards need anchor IDs added. Currently they are `<article class="prod-card">` with no IDs (verified at `index.html:528, 542, 556, 570, 584, 598, 612, 626, 640`). Wave 4 HTML integration must add:

```html
<article class="prod-card" id="prod-nxds">  ...
<article class="prod-card" id="prod-rv">    ...
<article class="prod-card" id="prod-gxs">   ...
<article class="prod-card" id="prod-next">  ...
<article class="prod-card" id="prod-eds">   ...
<article class="prod-card" id="prod-eh">    ...
<article class="prod-card" id="prod-gauges"> ...
<article class="prod-card" id="prod-tstation"> ...
<article class="prod-card" id="prod-consumables"> ...
```

### Mapping table (SKU chip → anchor)

```
# matched to existing product card
nXDS, nXDS6i, nXDS10i, nXDS15i, nXDS20i        → #prod-nxds
RV, RV3, RV5, RV8, RV12                        → #prod-rv
GXS, GXS160, GXS250, GXS450, GXS750, GXS/4200F → #prod-gxs
nEXT, nEXT85, nEXT240, nEXT300, nEXT400        → #prod-next
EDS, EDS200, EDS300, EDS480                    → #prod-eds
EH, EH250, EH500, EH1200, EH2600, EH4200       → #prod-eh
Barocel, WRG, APG, TIC, Gauge                  → #prod-gauges
T-Station, T-station, TStation 85H, 300D       → #prod-tstation
오일, 그리스, O-ring, seals, filter, EM, consumables → #prod-consumables

# NO matching product card (must externalize)
nXRi       → quote.html?model=nXRi
nES        → quote.html?model=nES
EXS        → quote.html?model=EXS
STP Turbo  → quote.html?model=STP
iXH        → quote.html?model=iXH
E2M        → quote.html?model=E2M
ELD500     → quote.html?model=ELD500
```

### Recommendation for un-carded SKUs (nXRi, nES, EXS, STP, iXH, E2M, ELD500)

**Option (a) — link to `quote.html?model=X`.** RECOMMENDED.

**Rationale:**
- (b) "non-clickable tag" silently breaks the reader's flow when they try to click. Every other chip on the page is clickable — inconsistency is worse than a weak destination.
- (c) "inline popover" introduces a new UI primitive for ~5 edge-case SKUs. Maintenance cost > benefit. Also fails on mobile hover.
- (a) reuses existing infrastructure (`quote.html` is already built and linked from the nav). The `?model=X` query param lets the quote page pre-fill a model filter — even if Wave 4 doesn't implement pre-fill immediately, the link still lands the user on a functional page with working search. Progressive enhancement path is clean.
- SEO bonus: outbound anchors with `model=` params generate indexable URLs for long-tail "iXH 견적" / "E2M 가격" queries.

**Implementation note for Wave 5:** Chips with `data-sku="iXH"` (etc.) get handler:
```js
chip.addEventListener('click', (e) => {
  const sku = chip.dataset.sku;
  const anchor = SKU_TO_ANCHOR[sku];
  if (anchor?.startsWith('#prod-')) {
    goSection('products');
    flashCard(anchor);   // .is-focus for 1.2s
  } else {
    window.location.href = `quote.html?model=${encodeURIComponent(sku)}`;
  }
});
```

---

## 6. Scroll Anchor Rules

### 6.1 Scroll margin (inherited)
Existing rule at `index.html:416`:
```css
section[id]{scroll-margin-top:calc(var(--nav-h) + 8px)}
```
`#applications` is a `section[id]` — **inherits automatically**. No new CSS needed.

For per-tile anchors (`#app-battery` etc.), add one line:
```css
[id^="app-"]{scroll-margin-top:calc(var(--nav-h) + 8px)}
```

### 6.2 `.is-focus` flash on product card after SKU chip click

**CSS (Wave 4):**
```css
.prod-card.is-focus{
  animation: cardFocus 1.2s var(--ease) 1;
  position:relative; z-index:2;
}
@keyframes cardFocus {
  0%   { box-shadow: 0 0 0 0 rgba(10,46,92,0);   transform: translateY(0); }
  20%  { box-shadow: 0 0 0 6px rgba(10,46,92,.22); transform: translateY(-4px); }
  100% { box-shadow: 0 0 0 0 rgba(10,46,92,0);   transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce){
  .prod-card.is-focus{ animation: none; outline: 2px solid var(--brand); outline-offset: 4px; }
}
```

**JS pseudo-code (Wave 5):**
```js
function flashCard(anchor) {
  const el = document.querySelector(anchor);
  if (!el) return;
  // Wait for scroll to complete before flashing, so flash is visible in viewport
  setTimeout(() => {
    el.classList.remove('is-focus');  // reset if rapid repeat
    void el.offsetWidth;              // force reflow to restart animation
    el.classList.add('is-focus');
    setTimeout(() => el.classList.remove('is-focus'), 1200);
  }, 450); // matches smooth-scroll duration on most browsers
}
```

---

## 7. Breadcrumb / Context Semantics

**Recommendation: NO sticky mini-label.**

**Rationale:**
- The Applications section itself is ~9 tiles — roughly one viewport on desktop, ~3 viewports on mobile. That is not "deep enough" to lose orientation.
- The nav bar is already sticky (64px). Adding a second sticky strip on mobile eats ~10% of a 720px-tall phone viewport — more cost than value.
- The section's dark-navy background (#0A2E5C) is itself a powerful orientation cue — as long as the user sees dark, they know they are in Applications. Color-as-breadcrumb is cheaper than DOM-as-breadcrumb.
- Scroll-spy already highlights "적용 산업" in the nav when in-view — that IS the breadcrumb, for free.

**Revisit if:** Post-launch analytics show mobile users scrolling back up from within Applications >3× per session (signal of getting lost). If that happens, add a compact `position:sticky; top:64px` mini-strip "적용 산업 · 1/9" showing tile progress.

---

## 8. Discoverability Improvements

### 8.1 Reverse link on product cards ("쓰이는 공정: 이차전지 · OLED · 코팅")

**Recommendation: YES, but lightweight.**

Add a single line at the bottom of each `.prod-body`:
```html
<div class="prod-uses">
  쓰이는 공정:
  <a href="#app-battery">이차전지</a> ·
  <a href="#app-oled">OLED</a> ·
  <a href="#app-coating">코팅</a>
</div>
```

**Why:** Creates a **round-trip** between Products and Applications. A user who landed on `#products` via SEO now has a path into the domain narrative. Without reverse links, the Applications section is a dead-end pull (requires top-nav click to reach). With reverse links, Applications becomes genuinely networked into the page.

**Cost:** 9 cards × 1 line of copy × 2–4 anchor links = ~30 extra words of DOM. Trivial.

**Constraint:** Max 3 applications listed per card (the most relevant). More than 3 creates visual noise and dilutes meaning.

### 8.2 Hero stats — add "9개 산업 커버" cell?

**Recommendation: NO.**

**Rationale:**
- Current hero stats at `index.html:510–515` are: `498+ 파트번호 · 15+ 년 경력 · 공식 · 당일`. This tells a credibility story: **breadth + tenure + authority + speed**. All four are conversion-relevant (buyer's unconscious checklist).
- Adding "9개 산업" as a 5th cell breaks the 4-column grid (also breaks the 2-column mobile grid at line 432). The grid would need to become 5-column (awkward) or 3×2 with one empty cell (uglier).
- "9개 산업" is a **discovery** metric, not a **trust** metric. It belongs inside the Applications section header, not in the hero. Moving it there is stronger storytelling: the Applications section title can read "9개 산업의 진공 공정을 지원합니다" and act as its own stat.
- The hero already has a clear job: drive CTA clicks. Adding more numbers dilutes.

**If hero must be updated:** Replace `당일 · 긴급 대응` with `9개 산업 · 커버리지` (swap, not add). But `당일 대응` is a hotter conversion trigger than `9개 산업` — I would not recommend even the swap without A/B data.

---

## 9. Summary — Integration Checklist (for Wave 4/5)

| Change | File | Line(s) | Type |
|--------|------|---------|------|
| Insert `적용 산업` link in desktop nav | index.html | after 463 | HTML add |
| Insert `적용 산업` link in mobile menu | index.html | after 482 | HTML add |
| Add `#applications` section block | index.html | between 8xx `</section>` of products and opening of services | HTML add |
| Add `id="prod-*"` to 9 product cards | index.html | 528, 542, 556, 570, 584, 598, 612, 626, 640 | HTML attribute add |
| Add `.prod-uses` reverse-link line to 9 product cards | index.html | inside each `.prod-body` | HTML add |
| Add scroll-margin rule for `[id^="app-"]` | index.html CSS | near 416 | CSS add |
| Add `.prod-card.is-focus` animation | index.html CSS | near 192 | CSS add |
| Add `'applications'` to scroll-spy observer array | index.html JS | (TBD by Wave 5) | JS edit |
| Add `flashCard()` helper + SKU chip handler | index.html JS | (TBD by Wave 5) | JS add |

**No existing IDs, routes, or functions are renamed or removed.** Fully additive.
