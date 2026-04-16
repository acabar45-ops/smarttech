# SMARTECH — Applications Section Master Integration Spec

**Role:** Master Spec Consolidator (Wave 3)
**Date:** 2026-04-16
**Target file:** `C:\클로드코드수업\이명재해병님\index.html` (current length **1498 lines**; older task prompt said 1447 — manifest corrected to 1498)
**Consumers:** Wave 4 (HTML+CSS engineer) · Wave 5 (JS engineer) · Wave 6 (Preservation Verifier)

This is the single source of truth. Do not cross-reference Wave-1/2 docs except for raw data; anything re-decided in this spec supersedes them.

---

## 0. Decisions locked in this consolidation

| # | Topic | Decision |
|---|---|---|
| D1 | File baseline | **1498 lines** (not 1447). Use actual file. |
| D2 | Insertion point | After `</section>` closing `#products` at **line 662**, before `<section id="services"` at **line 664**. Insert at line 663 (blank line). |
| D3 | Section attributes | `<section id="applications" class="section dark reveal" aria-labelledby="apps-heading" tabindex="-1">` — no `.soft` (preserves alternation), `.dark` is a new local modifier, `.reveal` reuses global observer. |
| D4 | List container | **`<ol>`** (a11y §1.1) with class `app-list stagger`. Not `<ul>`. |
| D5 | Per-tile wrapper | **NO `<article>` wrapper** inside `<li>` — a11y §1.4 (drops landmark noise). Use `<li class="app-tile">` directly. |
| D6 | Tile width (desktop ≥1280) | **200 px** (not 220) — avoids edge-kiss at 40°-adjacent tiles per layout risk #1. Height stays **156 px**. Orbit radius **320 px**. |
| D7 | Tile width (compact 1024–1279) | **200 × 156 px** (unchanged from compact spec). Orbit radius **280 px**. |
| D8 | Chip label rule | Family name only, e.g. `nXDS` (not "nXDS (스크롤)"). Korean descriptor goes in `title` attr. |
| D9 | Bullet prefix | `추천 모델:` (was `초보자용:`). |
| D10 | Copy typo fix | Lede: `펛프` → **`펌프`** (fix before paste). |
| D11 | Medallion reveal delay | **150 ms** after section `.in` (so medallion lands before tiles begin stagger). |
| D12 | Connector layer | `.app-connectors` MUST have `pointer-events: none` (invisible-bug prevention + a11y R5). |
| D13 | DOM-visual sync | Tile 1 in DOM must have `--angle: 0deg`. Add explicit integration comment. |
| D14 | Product-card reverse label | **`적용 분야`** (not "쓰이는 공정"). |
| D15 | Unmapped SKUs | Link to `quote.html?model=<SKU>` (nXRi, nES, EXS, STP, iXH, E2M, ELD500). |
| D16 | SVG sprite location | Just **before `</body>` at line 1497**. Inline `<svg style="display:none">` wrapper. |
| D17 | Eyebrow / h2 / h2_sub / lede | `APPLICATIONS` / `9대 산업을 잇는 진공 솔루션` / `Vacuum Applications Across 9 Industrial Domains` / `반도체부터 이차전지·제약 동결건조까지, 공정별로 검증된 Edwards 펌프 조합을 한눈에 제시합니다.` |
| D18 | Nav label | `적용 산업` inserted between `제품` and `수리·정비`. |
| D19 | Scroll-margin-top | Inherited automatically from existing `section[id]` rule (line 416). No new CSS needed for `#applications`. |
| D20 | Reduced-motion | Global rule at line 275 covers most; explicit overrides for medallion spin, connector dash animation, and `.is-focus` pulse. |
| D21 | `.is-focus` pulse class | Name: **`.is-focus`** (matches sitemap + motion spec). Duration 1200 ms. Applied to `.prod-card`. |
| D22 | Blog deep-link reuse | Seven tiles link to existing `#p2/#p4/#p6/#p7/#p9/#p10` posts; two tiles with no dedicated post omit the "자세히 보기" line. |

---

## Section A — HTML insertion (ready to paste)

### A.1 Insertion line range in `index.html`

- Insert **between line 662 and line 664** (i.e., at the existing blank line 663).
- Anchor BEFORE: `</section>` closing `#products` (line 662).
- Anchor AFTER: `<section id="services" class="section soft reveal" aria-label="서비스">` (line 664).
- Do not delete line 663 itself; replace it with the full block below.

### A.2 Full `#applications` section block — paste verbatim

```html
<!-- ═══════════════════════════════════════════════════════════
     APPLICATIONS — 9 vacuum industry domains
     DOM order = clockwise from 12 o'clock (0°, 40°, 80°, … 320°)
     DO NOT REORDER tiles without updating inline style="--angle: …"
     Tile 1 in DOM MUST have --angle: 0deg (integration invariant)
     ═══════════════════════════════════════════════════════════ -->
<section id="applications"
         class="section dark reveal"
         aria-labelledby="apps-heading"
         tabindex="-1">
  <div class="section-inner">

    <header class="section-head">
      <div class="eyebrow" aria-hidden="true">APPLICATIONS</div>
      <h2 id="apps-heading">9대 산업을 잇는 진공 솔루션</h2>
      <p class="h2-sub" aria-hidden="true">Vacuum Applications Across 9 Industrial Domains</p>
      <p class="lede">반도체부터 이차전지·제약 동결건조까지, 공정별로 검증된 Edwards 펌프 조합을 한눈에 제시합니다.</p>
      <p class="lede-sub mobile-only">반도체·이차전지·제약·연구 등 9개 산업군에서 검증된 적용 사례입니다.</p>
    </header>

    <div class="app-orbit" role="presentation">

      <!-- Decorative medallion hub + rotating gold ring -->
      <div class="app-medallion reveal" aria-hidden="true">
        <div class="app-medallion-ring"></div>
        <div class="app-medallion-label">
          <span class="app-medallion-kicker">SMARTECH</span>
          <span class="app-medallion-title">Vacuum Applications</span>
        </div>
      </div>

      <!-- Decorative connector SVG (fills the orbital container; pointer-events:none) -->
      <svg class="app-connectors reveal" aria-hidden="true" focusable="false"
           viewBox="-400 -400 800 800" preserveAspectRatio="xMidYMid meet">
        <!-- 9 <path> lines are injected by JS (see Section C) — one per tile. -->
      </svg>

      <!-- Semantic list of 9 industry tiles (clockwise from 12 o'clock) -->
      <ol class="app-list stagger"
          aria-labelledby="apps-heading">

        <!-- TILE 1 — gas cylinder (0°) -->
        <li class="app-tile" style="--angle: 0deg; --i: 0;" data-tile-id="gas-cylinder">
          <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-gas-cylinder"/></svg>
          <h3 class="app-title">가스 실린더 &amp; 잔류가스 제거</h3>
          <p class="app-desc">실린더 충전 전 잔류가스를 제거해 고순도와 안전성을 동시에 확보합니다.</p>
          <ul class="app-bullets" aria-label="주요 용도">
            <li>충전 전 내부 Purge, 고순도 유지, 안전 확보.</li>
            <li>추천 모델: nXDS, E2M, nEXT</li>
          </ul>
          <ul class="app-skus" aria-label="추천 제품">
            <li><a class="app-chip" href="#prod-nxds" data-sku="nXDS"   title="드라이 스크롤 펌프" aria-label="nXDS 제품 상세 보기">nXDS</a></li>
            <li><a class="app-chip" href="quote.html?model=E2M" data-sku="E2M"  title="오일 로터리 베인 E2M" aria-label="E2M 견적 페이지로 이동">E2M</a></li>
            <li><a class="app-chip" href="#prod-next" data-sku="nEXT"  title="터보분자 펌프"       aria-label="nEXT 제품 상세 보기">nEXT</a></li>
          </ul>
          <a class="app-more" href="#p2" aria-label="가스 퍼지·잔류가스 제거 가이드 블로그 글 보기">가스 퍼지·잔류가스 제거 가이드 <span aria-hidden="true">→</span></a>
        </li>

        <!-- TILE 2 — insulated piping (40°) -->
        <li class="app-tile" style="--angle: 40deg; --i: 1;" data-tile-id="insulated-piping">
          <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-insulated-pipe"/></svg>
          <h3 class="app-title">진공 이중배관 (Insulated Piping)</h3>
          <p class="app-desc">극저온 유체 이송 배관의 진공 단열로 열손실과 결로를 차단합니다.</p>
          <ul class="app-bullets" aria-label="주요 용도">
            <li>극저온 유체 이송 시 단열로 열손실을 최소화합니다.</li>
            <li>추천 모델: T-station, nXDS, ELD500 Leak Detector</li>
          </ul>
          <ul class="app-skus" aria-label="추천 제품">
            <li><a class="app-chip" href="#prod-tstation" data-sku="T-Station" title="터보 펌핑 스테이션"     aria-label="T-Station 제품 상세 보기">T-Station</a></li>
            <li><a class="app-chip" href="#prod-nxds"     data-sku="nXDS"      title="드라이 스크롤 펌프"    aria-label="nXDS 제품 상세 보기">nXDS</a></li>
            <li><a class="app-chip" href="quote.html?model=ELD500" data-sku="ELD500" title="헬륨 리크 디텍터" aria-label="ELD500 견적 페이지로 이동">ELD500</a></li>
          </ul>
          <a class="app-more" href="#p7" aria-label="극저온 배관 단열 사례 블로그 글 보기">극저온 배관 단열 사례 <span aria-hidden="true">→</span></a>
        </li>

        <!-- TILE 3 — secondary battery (80°) -->
        <li class="app-tile" style="--angle: 80deg; --i: 2;" data-tile-id="secondary-battery">
          <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-battery-cell"/></svg>
          <h3 class="app-title">이차전지 (Secondary Battery) 제조</h3>
          <p class="app-desc">이차전지 Degassing·전해액 함침 공정에서 셀 수명과 수율을 극대화합니다.</p>
          <ul class="app-bullets" aria-label="주요 용도">
            <li>Degassing·전해액 함침 공정에서 기포 제거와 수명 연장을 지원합니다.</li>
            <li>추천 모델: GXS160, GXS250/2600, nES, EXS</li>
          </ul>
          <ul class="app-skus" aria-label="추천 제품">
            <li><a class="app-chip" href="#prod-gxs" data-sku="GXS160"     title="산업용 드라이 스크류" aria-label="GXS160 제품 상세 보기">GXS160</a></li>
            <li><a class="app-chip" href="#prod-gxs" data-sku="GXS250/2600" title="산업용 드라이 스크류" aria-label="GXS250/2600 제품 상세 보기">GXS250/2600</a></li>
            <li><a class="app-chip" href="quote.html?model=nES" data-sku="nES" title="배터리 전용 드라이" aria-label="nES 견적 페이지로 이동">nES</a></li>
            <li><a class="app-chip" href="quote.html?model=EXS" data-sku="EXS" title="산업 드라이"       aria-label="EXS 견적 페이지로 이동">EXS</a></li>
          </ul>
          <a class="app-more" href="#p10" aria-label="이차전지 Degassing 공정 가이드 블로그 글 보기">이차전지 Degassing 공정 가이드 <span aria-hidden="true">→</span></a>
        </li>

        <!-- TILE 4 — vacuum furnace (120°) -->
        <li class="app-tile" style="--angle: 120deg; --i: 3;" data-tile-id="vacuum-furnace">
          <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-furnace"/></svg>
          <h3 class="app-title">진공로 (Vacuum Furnace)</h3>
          <p class="app-desc">금속 열처리·CVD 코팅·탄화 공정에서 고온 챔버의 산화를 원천 차단합니다.</p>
          <ul class="app-bullets" aria-label="주요 용도">
            <li>금속 열처리·탄화·소성 공정에서 산화를 차단합니다.</li>
            <li>추천 모델: GXS 시리즈, EXS, EH</li>
          </ul>
          <ul class="app-skus" aria-label="추천 제품">
            <li><a class="app-chip" href="#prod-gxs" data-sku="GXS 시리즈" title="산업용 드라이 스크류" aria-label="GXS 시리즈 제품 상세 보기">GXS 시리즈</a></li>
            <li><a class="app-chip" href="quote.html?model=EXS" data-sku="EXS" title="산업 드라이"   aria-label="EXS 견적 페이지로 이동">EXS</a></li>
            <li><a class="app-chip" href="#prod-eh"  data-sku="EH"   title="루츠 부스터"               aria-label="EH 제품 상세 보기">EH</a></li>
          </ul>
          <a class="app-more" href="#p4" aria-label="진공로 산화 방지 노하우 블로그 글 보기">진공로 산화 방지 노하우 <span aria-hidden="true">→</span></a>
        </li>

        <!-- TILE 5 — vacuum oven & drying (160°) -->
        <li class="app-tile" style="--angle: 160deg; --i: 4;" data-tile-id="vacuum-oven">
          <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-oven"/></svg>
          <h3 class="app-title">진공 오븐 및 건조 (Vacuum Oven &amp; Drying)</h3>
          <p class="app-desc">저온·저압 건조로 열에 민감한 소재의 형상과 품질을 안정적으로 보존합니다.</p>
          <ul class="app-bullets" aria-label="주요 용도">
            <li>반도체 부품·화장품 원료·화학 제품의 저온 건조로 변형을 방지합니다.</li>
            <li>추천 모델: nXDS, GXS</li>
          </ul>
          <ul class="app-skus" aria-label="추천 제품">
            <li><a class="app-chip" href="#prod-nxds" data-sku="nXDS" title="드라이 스크롤 펌프"   aria-label="nXDS 제품 상세 보기">nXDS</a></li>
            <li><a class="app-chip" href="#prod-gxs"  data-sku="GXS"  title="산업용 드라이 스크류" aria-label="GXS 제품 상세 보기">GXS</a></li>
          </ul>
          <a class="app-more" href="#p9" aria-label="저온 건조 공정 가이드 블로그 글 보기">저온 건조 공정 가이드 <span aria-hidden="true">→</span></a>
        </li>

        <!-- TILE 6 — OLED & display (200°) -->
        <li class="app-tile" style="--angle: 200deg; --i: 5;" data-tile-id="oled-display">
          <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-oled-display"/></svg>
          <h3 class="app-title">OLED 및 디스플레이 공정</h3>
          <p class="app-desc">OLED 유기물 증착·Encapsulation 공정에서 초청정 진공 환경을 유지합니다.</p>
          <ul class="app-bullets" aria-label="주요 용도">
            <li>OLED 유기물 증착·Encapsulation 공정에서 먼지와 산소를 차단합니다.</li>
            <li>추천 모델: GXS/EXS, iXH</li>
          </ul>
          <ul class="app-skus" aria-label="추천 제품">
            <li><a class="app-chip" href="#prod-gxs"  data-sku="GXS" title="산업용 드라이 스크류" aria-label="GXS 제품 상세 보기">GXS</a></li>
            <li><a class="app-chip" href="quote.html?model=EXS" data-sku="EXS" title="산업 드라이" aria-label="EXS 견적 페이지로 이동">EXS</a></li>
            <li><a class="app-chip" href="quote.html?model=iXH" data-sku="iXH" title="반도체 드라이" aria-label="iXH 견적 페이지로 이동">iXH</a></li>
          </ul>
          <a class="app-more" href="#p10" aria-label="OLED 증착 진공 관리 블로그 글 보기">OLED 증착 진공 관리 <span aria-hidden="true">→</span></a>
        </li>

        <!-- TILE 7 — freeze-dry (240°) -->
        <li class="app-tile" style="--angle: 240deg; --i: 6;" data-tile-id="freeze-dry">
          <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-freeze-dry"/></svg>
          <h3 class="app-title">식품 및 제약 동결건조</h3>
          <p class="app-desc">동결건조 공정에서 영양소·활성물질의 손상 없이 장기 보존성을 확보합니다.</p>
          <ul class="app-bullets" aria-label="주요 용도">
            <li>의약품 원료·유산균·식품 동결건조로 영양소 손상 없이 장기 보존합니다.</li>
            <li>추천 모델: EM 시리즈, GXS/EXS</li>
          </ul>
          <ul class="app-skus" aria-label="추천 제품">
            <li><a class="app-chip" href="#prod-rv"  data-sku="EM 시리즈" title="오일 로터리 베인 EM/E2M" aria-label="EM 시리즈 제품 상세 보기">EM 시리즈</a></li>
            <li><a class="app-chip" href="#prod-gxs" data-sku="GXS"       title="산업용 드라이 스크류"    aria-label="GXS 제품 상세 보기">GXS</a></li>
            <li><a class="app-chip" href="quote.html?model=EXS" data-sku="EXS" title="산업 드라이" aria-label="EXS 견적 페이지로 이동">EXS</a></li>
          </ul>
          <a class="app-more" href="#p9" aria-label="동결건조 펌프 선정 가이드 블로그 글 보기">동결건조 펌프 선정 가이드 <span aria-hidden="true">→</span></a>
        </li>

        <!-- TILE 8 — coating & smartphone (280°) -->
        <li class="app-tile" style="--angle: 280deg; --i: 7;" data-tile-id="coating-smartphone">
          <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-smartphone"/></svg>
          <h3 class="app-title">코팅 및 스마트폰 공정</h3>
          <p class="app-desc">AR/AF 스퍼터링 코팅으로 디스플레이 내구성과 광학 품질을 높입니다.</p>
          <ul class="app-bullets" aria-label="주요 용도">
            <li>스마트폰 액정·렌즈의 AR/AF 스퍼터링 코팅으로 내구성을 향상시킵니다.</li>
            <li>추천 모델: nES, EXS/GXS, STP Turbo</li>
          </ul>
          <ul class="app-skus" aria-label="추천 제품">
            <li><a class="app-chip" href="quote.html?model=nES" data-sku="nES" title="배터리/코팅 드라이" aria-label="nES 견적 페이지로 이동">nES</a></li>
            <li><a class="app-chip" href="quote.html?model=EXS" data-sku="EXS" title="산업 드라이"       aria-label="EXS 견적 페이지로 이동">EXS</a></li>
            <li><a class="app-chip" href="#prod-gxs"  data-sku="GXS" title="산업용 드라이 스크류" aria-label="GXS 제품 상세 보기">GXS</a></li>
            <li><a class="app-chip" href="quote.html?model=STP" data-sku="STP Turbo" title="STP 터보 분자 펌프" aria-label="STP Turbo 견적 페이지로 이동">STP Turbo</a></li>
          </ul>
          <a class="app-more" href="#p10" aria-label="AR/AF 코팅 진공 사례 블로그 글 보기">AR/AF 코팅 진공 사례 <span aria-hidden="true">→</span></a>
        </li>

        <!-- TILE 9 — research & analysis (320°) -->
        <li class="app-tile" style="--angle: 320deg; --i: 8;" data-tile-id="research-analysis">
          <svg class="app-icon" aria-hidden="true" focusable="false"><use href="#icon-microscope"/></svg>
          <h3 class="app-title">연구 및 분석 (Research &amp; Analysis)</h3>
          <p class="app-desc">SEM·TEM·질량분석기에 초고진공을 공급해 재현성 있는 측정 결과를 보장합니다.</p>
          <ul class="app-bullets" aria-label="주요 용도">
            <li>SEM·TEM 관찰과 GC/LC-MS 분석을 위한 정밀 측정 환경을 확보합니다.</li>
            <li>추천 모델: nXRi, nXDS, nEXT</li>
          </ul>
          <ul class="app-skus" aria-label="추천 제품">
            <li><a class="app-chip" href="quote.html?model=nXRi" data-sku="nXRi" title="분석용 드라이" aria-label="nXRi 견적 페이지로 이동">nXRi</a></li>
            <li><a class="app-chip" href="#prod-nxds" data-sku="nXDS" title="드라이 스크롤 펌프" aria-label="nXDS 제품 상세 보기">nXDS</a></li>
            <li><a class="app-chip" href="#prod-next" data-sku="nEXT" title="터보분자 펌프"      aria-label="nEXT 제품 상세 보기">nEXT</a></li>
          </ul>
          <a class="app-more" href="#p6" aria-label="분석 장비 초고진공 구축 블로그 글 보기">분석 장비 초고진공 구축 <span aria-hidden="true">→</span></a>
        </li>

      </ol>
    </div><!-- /.app-orbit -->

    <div class="app-bridge">
      <a class="btn btn-secondary" href="#products"
         onclick="goSection('products');return false;"
         aria-label="각 산업별 추천 Edwards 펌프 전체 카탈로그로 이동">
        각 산업별 추천 펌프 자세히 보기
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </a>
    </div>

  </div>
</section>
```

### A.3 SVG icon sprite — insert just before `</body>` (line 1497)

Paste the full content of `data/icons.svg` (the `<svg style="display:none">…</svg>` block) immediately before line 1497. Rationale: keeps the sprite out of `<head>` (which would block rendering), and guarantees every `<use href="#icon-…">` elsewhere resolves before Service Worker registration at line 1492 runs. Do not wrap it in another element.

### A.4 Nav changes — desktop

**Old HTML (lines 462–468, unchanged top and bottom shown for context):**
```html
<a class="nav-link active" id="nav-home" href="#" onclick="goHome();return false;">홈</a>
<a class="nav-link" href="#products" onclick="goHome();goSection('products');return false;">제품</a>
<a class="nav-link" href="#services" onclick="goHome();goSection('services');return false;">수리·정비</a>
<a class="nav-link" id="nav-blog" href="#" onclick="goBlog();return false;">블로그</a>
```

**New HTML (insert one line between existing line 463 and line 464):**
```html
<a class="nav-link active" id="nav-home" href="#" onclick="goHome();return false;">홈</a>
<a class="nav-link" href="#products" onclick="goHome();goSection('products');return false;">제품</a>
<a class="nav-link" href="#applications" onclick="goHome();goSection('applications');return false;">적용 산업</a>
<a class="nav-link" href="#services" onclick="goHome();goSection('services');return false;">수리·정비</a>
<a class="nav-link" id="nav-blog" href="#" onclick="goBlog();return false;">블로그</a>
```

### A.5 Nav changes — mobile menu (lines 481–487)

**Insert one line between existing line 482 and line 483:**
```html
<a class="m-link" href="#" onclick="toggleMenu();goHome();return false;">홈</a>
<a class="m-link" href="#products" onclick="toggleMenu();goHome();goSection('products');return false;">제품 라인업</a>
<a class="m-link" href="#applications" onclick="toggleMenu();goHome();goSection('applications');return false;">적용 산업</a>
<a class="m-link" href="#services" onclick="toggleMenu();goHome();goSection('services');return false;">수리·정비 서비스</a>
<a class="m-link" href="#" onclick="toggleMenu();goBlog();return false;">기술 블로그</a>
```

### A.6 Product cards — add `id="prod-…"` attributes and `적용 분야` meta line

See full diffs in **Section D**.

---

## Section B — CSS insertion (ready to paste)

Insert the entire block below **immediately before `</style>` at line 452**. The block is additive only — it defines new tokens in `:root` (non-colliding names) and new `.app-*`, `.prod-card.is-focus`, `.h2-sub`, `.lede-sub`, and `.skip-link` classes.

```css
/* ═══════════════════════════════════════════════════════════
   APPLICATIONS SECTION — Applications-specific tokens & rules
   Additive. Does not override any existing --brand-*, --ink-*, etc.
   ═══════════════════════════════════════════════════════════ */

:root {
  /* ── 1. Gold accent (for dark navy applications band) ────── */
  --app-gold:         #C9A961;
  --app-gold-dim:     rgba(201, 169, 97, 0.25);
  --app-gold-strong:  rgba(201, 169, 97, 0.75);
  --app-gold-ring:    rgba(201, 169, 97, 0.55);
  --app-gold-active:  rgba(201, 169, 97, 0.90);

  /* ── 2. Tile surface (glass-light on dark navy) ──────────── */
  --app-tile-bg:           rgba(255, 255, 255, 0.04);
  --app-tile-bg-hover:     rgba(255, 255, 255, 0.07);
  --app-tile-border:       rgba(255, 255, 255, 0.08);
  --app-tile-border-hover: rgba(201, 169, 97, 0.30);
  --app-tile-shadow:       0 8px 24px rgba(0, 0, 0, 0.28);

  /* ── 3. Typography on tile ───────────────────────────────── */
  --app-text:        rgba(255, 255, 255, 0.94);
  --app-text-soft:   rgba(255, 255, 255, 0.65);
  --app-text-muted:  rgba(255, 255, 255, 0.45);

  /* ── 4. SKU chips ────────────────────────────────────────── */
  --app-chip-bg:           rgba(255, 255, 255, 0.08);
  --app-chip-text:         rgba(255, 255, 255, 0.88);
  --app-chip-border:       rgba(255, 255, 255, 0.12);
  --app-chip-bg-hover:     rgba(201, 169, 97, 0.15);
  --app-chip-text-hover:   var(--app-gold);
  --app-chip-border-hover: rgba(201, 169, 97, 0.50);
  --app-chip-radius:       6px;

  /* ── 5. Connector lines ──────────────────────────────────── */
  --app-connector-default: var(--app-gold-dim);
  --app-connector-hover:   var(--app-gold-strong);
  --app-connector-width:   1.25px;
  --app-connector-width-hover: 1.75px;

  /* ── 6. Blueprint grid bg ────────────────────────────────── */
  --app-grid-line:    rgba(255, 255, 255, 0.06);
  --app-grid-size:    80px;

  /* ── 7. Medallion ────────────────────────────────────────── */
  --app-medallion-bg:     rgba(255, 255, 255, 0.05);
  --app-medallion-border: rgba(201, 169, 97, 0.40);
  --app-medallion-glow:   0 0 48px rgba(201, 169, 97, 0.18);

  /* ── 8. Focus ring ───────────────────────────────────────── */
  --app-focus-ring: 0 0 0 2px var(--app-gold),
                    0 0 0 4px rgba(201, 169, 97, 0.25);
}

/* ─────────────────────────────────────────────────────────── */
/* Base: .section.dark modifier (used ONLY by #applications)   */
/* ─────────────────────────────────────────────────────────── */
.section.dark {
  background: var(--brand-deep);
  color: var(--app-text);
  position: relative;
  overflow: hidden;
}
.section.dark::before {
  content: "";
  position: absolute; inset: 0;
  background-image:
    linear-gradient(var(--app-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--app-grid-line) 1px, transparent 1px);
  background-size: var(--app-grid-size) var(--app-grid-size);
  -webkit-mask-image: radial-gradient(ellipse at center,
                        rgba(0,0,0,1) 0%, rgba(0,0,0,.5) 60%, rgba(0,0,0,0) 95%);
          mask-image: radial-gradient(ellipse at center,
                        rgba(0,0,0,1) 0%, rgba(0,0,0,.5) 60%, rgba(0,0,0,0) 95%);
  pointer-events: none;
  z-index: 0;
}
.section.dark > .section-inner { position: relative; z-index: 1; }
.section.dark .section-head { text-align: center; max-width: 760px; margin: 0 auto 48px; }
.section.dark .eyebrow { color: var(--app-gold); letter-spacing: .18em; }
.section.dark h2 { color: var(--app-text); }
.section.dark .h2-sub {
  margin: 6px 0 10px;
  font-size: 15px;
  font-family: var(--font-mono);
  color: var(--app-text-soft);
  letter-spacing: .02em;
}
.section.dark .lede { color: var(--app-text-soft); }
.section.dark .lede-sub { color: var(--app-text-muted); font-size: 14px; margin-top: 6px; }

/* ─────────────────────────────────────────────────────────── */
/* Orbital container                                           */
/* ─────────────────────────────────────────────────────────── */
.app-orbit {
  --orbit-radius: 320px;
  --tile-w: 200px;
  --tile-h: 156px;
  --medallion-size: 220px;
  position: relative;
  width: 100%;
  min-height: 760px;            /* CLS guard */
  margin: 0 auto;
  display: grid;
  place-items: center;
}

/* Medallion (center hub) */
.app-medallion {
  position: relative;
  width: var(--medallion-size);
  height: var(--medallion-size);
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%,
                rgba(255,255,255,.08),
                var(--brand-deep) 70%);
  display: grid;
  place-items: center;
  z-index: 2;
  box-shadow: var(--app-medallion-glow);
  isolation: isolate;
}
.app-medallion-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px dashed var(--app-gold-ring);
  animation: appMedallionSpin 60s linear infinite;
  transform-origin: 50% 50%;
  will-change: transform;
  pointer-events: none;
}
.app-medallion-ring::before {
  content: "";
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  border: 1px solid var(--app-medallion-border);
}
.app-medallion-label {
  text-align: center;
  padding: 0 16px;
  color: var(--app-text);
  line-height: 1.2;
  z-index: 1;
}
.app-medallion-kicker {
  display: block;
  font-size: 11px;
  letter-spacing: .2em;
  color: var(--app-gold);
  font-family: var(--font-mono);
  margin-bottom: 6px;
}
.app-medallion-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
}
@keyframes appMedallionSpin { to { transform: rotate(360deg); } }

/* Connector SVG — ALWAYS non-interactive */
.app-connectors {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;   /* D12 — invisible bug prevention */
  z-index: 0;
}
.app-connectors path {
  stroke: var(--app-connector-default);
  stroke-width: var(--app-connector-width);
  fill: none;
  stroke-dasharray: 4 6;
  transition: stroke .3s var(--ease), stroke-width .3s var(--ease);
}
.app-connectors path[data-active="true"] {
  stroke: var(--app-connector-hover);
  stroke-width: var(--app-connector-width-hover);
}

/* Ordered list = tile ring */
.app-list {
  list-style: none;
  margin: 0; padding: 0;
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
}

/* Each tile (absolute, orbited via transform) */
.app-tile {
  --i: 0;
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
  background: var(--app-tile-bg);
  border: 1px solid var(--app-tile-border);
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: var(--app-tile-shadow);
  color: var(--app-text);
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition:
    transform .24s var(--ease),
    background .24s var(--ease),
    border-color .24s var(--ease),
    box-shadow .24s var(--ease),
    opacity .42s var(--ease),
    filter .42s var(--ease);
}
.app-orbit:hover .app-tile { opacity: .55; filter: saturate(.85); }
.app-orbit .app-tile:hover {
  opacity: 1; filter: none;
  background: var(--app-tile-bg-hover);
  border-color: var(--app-tile-border-hover);
  transform:
    rotate(var(--angle))
    translateY(calc(-1 * var(--orbit-radius)))
    rotate(calc(-1 * var(--angle)))
    translate3d(0, -3px, 0) scale(1.015);
  box-shadow: 0 12px 28px rgba(0,0,0,.35);
  z-index: 3;
  will-change: transform;
  transition-duration: .24s;
}

.app-icon { width: 28px; height: 28px; color: var(--app-gold); flex: 0 0 auto; }
.app-title {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--app-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.app-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--app-text-soft);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.app-bullets {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--app-text-soft);
}
.app-bullets li { padding-left: 10px; position: relative; }
.app-bullets li::before {
  content: "·";
  position: absolute; left: 0; top: 0;
  color: var(--app-gold);
}
.app-skus {
  list-style: none;
  margin: 4px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.app-chip {
  display: inline-flex; align-items: center;
  padding: 4px 8px;
  font-size: 11.5px;
  font-family: var(--font-mono);
  line-height: 1.4;
  color: var(--app-chip-text);
  background: var(--app-chip-bg);
  border: 1px solid var(--app-chip-border);
  border-radius: var(--app-chip-radius);
  text-decoration: none;
  transition: color .15s var(--ease), background .15s var(--ease), border-color .15s var(--ease);
  min-height: 28px; /* desktop — see mobile override for 44px */
}
.app-chip:hover, .app-chip:focus-visible {
  color: var(--app-chip-text-hover);
  background: var(--app-chip-bg-hover);
  border-color: var(--app-chip-border-hover);
}
.app-more {
  margin-top: auto;
  font-size: 12px;
  color: var(--app-gold);
  text-decoration: none;
  display: inline-flex; align-items: center; gap: 4px;
}
.app-more:hover, .app-more:focus-visible { text-decoration: underline; }

.app-bridge { text-align: center; margin-top: 64px; position: relative; z-index: 1; }
.app-bridge .btn-secondary {
  background: transparent;
  border: 1.5px solid var(--app-gold);
  color: var(--app-gold);
}
.app-bridge .btn-secondary:hover,
.app-bridge .btn-secondary:focus-visible {
  background: var(--app-gold);
  color: var(--brand-deep);
}

/* Focus-visible for all app-* interactive elements */
.app-chip:focus-visible,
.app-more:focus-visible,
.app-bridge .btn:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
  border-radius: var(--app-chip-radius);
}

/* Mobile-only helper lede */
.lede-sub.mobile-only { display: none; }

/* .is-focus pulse on product card — D21 */
.prod-card.is-focus {
  animation: prodFocusPulse 1.2s var(--ease) 1 both;
  position: relative;
  z-index: 2;
  outline: 1px solid var(--app-gold-strong);
}
@keyframes prodFocusPulse {
  0%   { transform: scale(1);    box-shadow: 0 0 0  0  rgba(201,169,97,0); }
  20%  { transform: scale(1.02); box-shadow: 0 0 0  8px rgba(201,169,97,.35); }
  60%  { transform: scale(1.005);box-shadow: 0 0 0 14px rgba(201,169,97,.10); }
  100% { transform: scale(1);    box-shadow: 0 0 0 20px rgba(201,169,97,0); }
}

/* Product card reverse meta line (.prod-apps) */
.prod-apps {
  margin-top: 10px;
  font-size: 12.5px;
  color: var(--muted);
}
.prod-apps-label { color: var(--ink-soft); font-weight: 600; }
.prod-apps a {
  color: var(--brand);
  text-decoration: none;
  border-bottom: 1px dotted var(--brand-light);
}
.prod-apps a:hover { border-bottom-style: solid; }

/* ─────────────────────────────────────────────────────────── */
/* Tablet 768–1023 px — 3×3 grid                                */
/* ─────────────────────────────────────────────────────────── */
@media (min-width: 768px) and (max-width: 1023px) {
  .app-orbit {
    min-height: 0;
    display: block;
  }
  .app-medallion, .app-connectors { display: none; }
  .app-list {
    position: static;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    width: 100%;
    height: auto;
  }
  .app-tile {
    position: static;
    transform: none;
    margin: 0;
    width: auto;
    height: auto;
    min-height: 200px;
    padding: 18px 20px;
  }
  .app-orbit .app-tile:hover {
    transform: translate3d(0, -3px, 0);
    opacity: 1; filter: none;
  }
}

/* ─────────────────────────────────────────────────────────── */
/* Compact desktop 1024–1279 px — tighter orbit                 */
/* ─────────────────────────────────────────────────────────── */
@media (min-width: 1024px) and (max-width: 1279px) {
  .app-orbit {
    --orbit-radius: 280px;
    --medallion-size: 180px;
    min-height: 680px;
  }
}

/* ─────────────────────────────────────────────────────────── */
/* Mobile ≤767 px — 1-column stack                              */
/* ─────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .app-orbit {
    min-height: 0;
    display: block;
  }
  .app-medallion, .app-connectors { display: none; }
  .app-list {
    position: static;
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    width: 100%;
    height: auto;
  }
  .app-tile {
    position: static;
    transform: none;
    margin: 0;
    width: auto; height: auto; min-height: auto;
    padding: 14px 16px;
  }
  .app-orbit:hover .app-tile { opacity: 1; filter: none; }
  .app-orbit .app-tile:hover { transform: none; }
  .app-tile:active { transform: scale(.98); transition-duration: .08s; }
  .app-chip { min-height: 44px; padding: 10px 14px; }
  .app-more { min-height: 44px; padding: 10px 0; }
  .lede-sub.mobile-only { display: block; }
  .section.dark .section-head { margin-bottom: 28px; }
}
@media (max-width: 429px) {
  .app-list { gap: 10px; }
  .app-tile { padding: 12px 14px; }
}

/* ─────────────────────────────────────────────────────────── */
/* Reduced motion                                               */
/* ─────────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .app-medallion-ring { animation: none; }
  .app-tile { transition: none; }
  .app-connectors path { transition: none; }
  .prod-card.is-focus {
    animation: none;
    outline: 2px solid var(--app-gold);
    outline-offset: 4px;
  }
}

/* Reveal stagger for app-list — reuse existing .stagger pattern */
/* (the global rule at index.html line 275 already handles .reveal/.stagger.in) */
```

---

## Section C — JavaScript changes (ready to paste)

Insert **inside the existing `<script>` block, above `window.goHome = function(){ … }` at line 1385** (i.e., as the first block inside the IIFE/script after any existing `'use strict'` or before `window.goHome` is defined). All five blocks below must appear together.

```js
/* ═══════════════════════════════════════════════════════════
   APPLICATIONS SECTION — data + render + interactions
   =========================================================== */

const APPLICATIONS = [
  { id:'gas-cylinder',       angle:0,   icon:'gas-cylinder',
    title:'가스 실린더 & 잔류가스 제거',
    desc:'실린더 충전 전 잔류가스를 제거해 고순도와 안전성을 동시에 확보합니다.',
    bullets:['충전 전 내부 Purge, 고순도 유지, 안전 확보.','추천 모델: nXDS, E2M, nEXT'],
    skus:[
      {label:'nXDS', sku:'nXDS', href:'#prod-nxds',           title:'드라이 스크롤 펌프'},
      {label:'E2M',  sku:'E2M',  href:'quote.html?model=E2M', title:'오일 로터리 베인 E2M'},
      {label:'nEXT', sku:'nEXT', href:'#prod-next',           title:'터보분자 펌프'}
    ],
    blog:{href:'#p2', label:'가스 퍼지·잔류가스 제거 가이드'} },
  { id:'insulated-piping',   angle:40,  icon:'insulated-pipe',
    title:'진공 이중배관 (Insulated Piping)',
    desc:'극저온 유체 이송 배관의 진공 단열로 열손실과 결로를 차단합니다.',
    bullets:['극저온 유체 이송 시 단열로 열손실을 최소화합니다.','추천 모델: T-station, nXDS, ELD500 Leak Detector'],
    skus:[
      {label:'T-Station', sku:'T-Station', href:'#prod-tstation',              title:'터보 펌핑 스테이션'},
      {label:'nXDS',      sku:'nXDS',      href:'#prod-nxds',                  title:'드라이 스크롤 펌프'},
      {label:'ELD500',    sku:'ELD500',    href:'quote.html?model=ELD500',     title:'헬륨 리크 디텍터'}
    ],
    blog:{href:'#p7', label:'극저온 배관 단열 사례'} },
  { id:'secondary-battery',  angle:80,  icon:'battery-cell',
    title:'이차전지 (Secondary Battery) 제조',
    desc:'이차전지 Degassing·전해액 함침 공정에서 셀 수명과 수율을 극대화합니다.',
    bullets:['Degassing·전해액 함침 공정에서 기포 제거와 수명 연장을 지원합니다.','추천 모델: GXS160, GXS250/2600, nES, EXS'],
    skus:[
      {label:'GXS160',      sku:'GXS160',      href:'#prod-gxs',               title:'산업용 드라이 스크류'},
      {label:'GXS250/2600', sku:'GXS250/2600', href:'#prod-gxs',               title:'산업용 드라이 스크류'},
      {label:'nES',         sku:'nES',         href:'quote.html?model=nES',    title:'배터리 전용 드라이'},
      {label:'EXS',         sku:'EXS',         href:'quote.html?model=EXS',    title:'산업 드라이'}
    ],
    blog:{href:'#p10', label:'이차전지 Degassing 공정 가이드'} },
  { id:'vacuum-furnace',     angle:120, icon:'furnace',
    title:'진공로 (Vacuum Furnace)',
    desc:'금속 열처리·CVD 코팅·탄화 공정에서 고온 챔버의 산화를 원천 차단합니다.',
    bullets:['금속 열처리·탄화·소성 공정에서 산화를 차단합니다.','추천 모델: GXS 시리즈, EXS, EH'],
    skus:[
      {label:'GXS 시리즈', sku:'GXS 시리즈', href:'#prod-gxs',            title:'산업용 드라이 스크류'},
      {label:'EXS',        sku:'EXS',        href:'quote.html?model=EXS', title:'산업 드라이'},
      {label:'EH',         sku:'EH',         href:'#prod-eh',             title:'루츠 부스터'}
    ],
    blog:{href:'#p4', label:'진공로 산화 방지 노하우'} },
  { id:'vacuum-oven',        angle:160, icon:'oven',
    title:'진공 오븐 및 건조 (Vacuum Oven & Drying)',
    desc:'저온·저압 건조로 열에 민감한 소재의 형상과 품질을 안정적으로 보존합니다.',
    bullets:['반도체 부품·화장품 원료·화학 제품의 저온 건조로 변형을 방지합니다.','추천 모델: nXDS, GXS'],
    skus:[
      {label:'nXDS', sku:'nXDS', href:'#prod-nxds', title:'드라이 스크롤 펌프'},
      {label:'GXS',  sku:'GXS',  href:'#prod-gxs',  title:'산업용 드라이 스크류'}
    ],
    blog:{href:'#p9', label:'저온 건조 공정 가이드'} },
  { id:'oled-display',       angle:200, icon:'oled-display',
    title:'OLED 및 디스플레이 공정',
    desc:'OLED 유기물 증착·Encapsulation 공정에서 초청정 진공 환경을 유지합니다.',
    bullets:['OLED 유기물 증착·Encapsulation 공정에서 먼지와 산소를 차단합니다.','추천 모델: GXS/EXS, iXH'],
    skus:[
      {label:'GXS', sku:'GXS', href:'#prod-gxs',           title:'산업용 드라이 스크류'},
      {label:'EXS', sku:'EXS', href:'quote.html?model=EXS',title:'산업 드라이'},
      {label:'iXH', sku:'iXH', href:'quote.html?model=iXH',title:'반도체 드라이'}
    ],
    blog:{href:'#p10', label:'OLED 증착 진공 관리'} },
  { id:'freeze-dry',         angle:240, icon:'freeze-dry',
    title:'식품 및 제약 동결건조',
    desc:'동결건조 공정에서 영양소·활성물질의 손상 없이 장기 보존성을 확보합니다.',
    bullets:['의약품 원료·유산균·식품 동결건조로 영양소 손상 없이 장기 보존합니다.','추천 모델: EM 시리즈, GXS/EXS'],
    skus:[
      {label:'EM 시리즈', sku:'EM 시리즈', href:'#prod-rv',  title:'오일 로터리 베인 EM/E2M'},
      {label:'GXS',       sku:'GXS',       href:'#prod-gxs', title:'산업용 드라이 스크류'},
      {label:'EXS',       sku:'EXS',       href:'quote.html?model=EXS', title:'산업 드라이'}
    ],
    blog:{href:'#p9', label:'동결건조 펌프 선정 가이드'} },
  { id:'coating-smartphone', angle:280, icon:'smartphone',
    title:'코팅 및 스마트폰 공정',
    desc:'AR/AF 스퍼터링 코팅으로 디스플레이 내구성과 광학 품질을 높입니다.',
    bullets:['스마트폰 액정·렌즈의 AR/AF 스퍼터링 코팅으로 내구성을 향상시킵니다.','추천 모델: nES, EXS/GXS, STP Turbo'],
    skus:[
      {label:'nES',       sku:'nES',       href:'quote.html?model=nES', title:'배터리/코팅 드라이'},
      {label:'EXS',       sku:'EXS',       href:'quote.html?model=EXS', title:'산업 드라이'},
      {label:'GXS',       sku:'GXS',       href:'#prod-gxs',            title:'산업용 드라이 스크류'},
      {label:'STP Turbo', sku:'STP Turbo', href:'quote.html?model=STP', title:'STP 터보 분자 펌프'}
    ],
    blog:{href:'#p10', label:'AR/AF 코팅 진공 사례'} },
  { id:'research-analysis',  angle:320, icon:'microscope',
    title:'연구 및 분석 (Research & Analysis)',
    desc:'SEM·TEM·질량분석기에 초고진공을 공급해 재현성 있는 측정 결과를 보장합니다.',
    bullets:['SEM·TEM 관찰과 GC/LC-MS 분석을 위한 정밀 측정 환경을 확보합니다.','추천 모델: nXRi, nXDS, nEXT'],
    skus:[
      {label:'nXRi', sku:'nXRi', href:'quote.html?model=nXRi', title:'분석용 드라이'},
      {label:'nXDS', sku:'nXDS', href:'#prod-nxds',            title:'드라이 스크롤 펌프'},
      {label:'nEXT', sku:'nEXT', href:'#prod-next',            title:'터보분자 펌프'}
    ],
    blog:{href:'#p6', label:'분석 장비 초고진공 구축'} }
];

/* Connector SVG generator — 9 paths from medallion edge to tile inner edge.
   Coordinates are in the SVG's own viewBox (-400 -400 800 800), so values
   are viewport-independent. The orbit radius used matches desktop base 320.   */
function renderAppConnectors() {
  const svg = document.querySelector('#applications .app-connectors');
  if (!svg) return;
  const R_OUTER = 320;    // orbit radius (base)
  const R_MED   = 110;    // medallion half (220/2)
  const T_INNER = 78;     // approx tile_h/2 pull-back
  const frag = document.createDocumentFragment();
  APPLICATIONS.forEach(app => {
    const rad = app.angle * Math.PI / 180;
    const x1 =  Math.sin(rad) * R_MED;
    const y1 = -Math.cos(rad) * R_MED;
    const x2 =  Math.sin(rad) * (R_OUTER - T_INNER);
    const y2 = -Math.cos(rad) * (R_OUTER - T_INNER);
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    p.setAttribute('data-tile-id', app.id);
    frag.appendChild(p);
  });
  svg.appendChild(frag);
}

/* Tile→connector hover coupling */
function bindAppConnectorHover() {
  document.querySelectorAll('#applications .app-tile').forEach(tile => {
    const id = tile.dataset.tileId;
    const path = document.querySelector(`#applications .app-connectors path[data-tile-id="${id}"]`);
    if (!path) return;
    tile.addEventListener('pointerenter', () => path.setAttribute('data-active','true'));
    tile.addEventListener('pointerleave', () => path.removeAttribute('data-active'));
  });
}

/* Medallion reveal delay (D11) — stagger the orbit list .in by 150ms
   so medallion appears before tiles.                                          */
function bindAppStaggerDelay() {
  const section = document.getElementById('applications');
  if (!section) return;
  const list = section.querySelector('.app-list');
  if (!list) return;
  // When the section becomes .in, delay adding .in to the list by 150ms.
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.attributeName === 'class' && section.classList.contains('in')) {
        setTimeout(() => list.classList.add('in'), 150);
        mo.disconnect();
        return;
      }
    }
  });
  mo.observe(section, { attributes: true });
}

/* SKU chip click → if target is #prod-*, smooth-scroll to products + flash pulse.
   If href is quote.html?…, the browser handles it natively (no JS).            */
function bindAppChipFlash() {
  document.querySelectorAll('#applications .app-chip').forEach(chip => {
    const href = chip.getAttribute('href') || '';
    if (!href.startsWith('#prod-')) return;
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = href.slice(1);
      // Reuse existing router helper
      if (typeof window.goSection === 'function') {
        window.goSection('products');
      }
      setTimeout(() => {
        const card = document.getElementById(targetId);
        if (!card) return;
        card.classList.remove('is-focus');
        void card.offsetWidth;           // force reflow to restart animation
        card.classList.add('is-focus');
        setTimeout(() => card.classList.remove('is-focus'), 1200);
      }, 500);
    });
  });
}

/* Boot */
document.addEventListener('DOMContentLoaded', () => {
  renderAppConnectors();
  bindAppConnectorHover();
  bindAppStaggerDelay();
  bindAppChipFlash();
});
```

**Integration notes for Wave 5**:

1. Do NOT rename/modify `goSection`, `goHome`, `goBlog`, `toggleMenu`, `handleFormSubmit` — preservation rule.
2. The `APPLICATIONS` constant is duplicated data (also statically rendered in HTML). If engineer prefers fully-dynamic rendering (build tiles from the array), replace the static `<li>` markup in Section A.2 with empty `<ol class="app-list stagger" aria-labelledby="apps-heading"></ol>` and add a `renderApplicationsTiles()` function that injects innerHTML from the array. Both approaches are valid; static-HTML + JS connectors is simpler and SEO-friendly, so that is the recommended path.
3. The medallion rotation is pure CSS (`@keyframes appMedallionSpin`), no JS needed.
4. If implementing optional per-tile deep links (`#app-battery` etc. from sitemap §3.3), add them as additional IDs on each `<li>` (e.g., `id="app-battery"` on tile 3). The regex `/^#p\d+$/` used at line 1481 is NOT triggered by `#app-*` — no collision.

---

## Section D — Product card IDs and `적용 분야` reverse-links

Each card needs two edits: (1) add `id="prod-*"` to the `<article>` element; (2) add a `<div class="prod-apps">` line immediately after the `<p class="prod-desc">…</p>` line and before `<a class="prod-cta">…</a>`.

| # | Card line (current) | First-line find-text (verbatim) | ID to add | `적용 분야` reverse line to insert |
|---|---|---|---|---|
| 1 | **528** | `<article class="prod-card">` (the one with `prod-badge DRY SCROLL`, line 530) | `prod-nxds` | `<div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">가스 실린더</a> · <a href="#applications" onclick="goSection('applications');return false;">연구·분석</a> · <a href="#applications" onclick="goSection('applications');return false;">진공 오븐</a></div>` |
| 2 | **542** | card with `ROTARY VANE` badge (line 544) | `prod-rv` | `<div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">가스 실린더</a> · <a href="#applications" onclick="goSection('applications');return false;">동결건조</a></div>` |
| 3 | **556** | card with `INDUSTRIAL DRY` badge (line 558) | `prod-gxs` | `<div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">이차전지</a> · <a href="#applications" onclick="goSection('applications');return false;">진공로</a> · <a href="#applications" onclick="goSection('applications');return false;">OLED 디스플레이</a> <span class="prod-apps-more">+3개 공정</span></div>` |
| 4 | **570** | card with `TURBOMOLECULAR` badge (line 572) | `prod-next` | `<div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">가스 실린더</a> · <a href="#applications" onclick="goSection('applications');return false;">연구·분석</a></div>` |
| 5 | **584** | card with `DRY SCREW SYSTEM` badge (line 586) | `prod-eds` | `<div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">이차전지</a> · <a href="#applications" onclick="goSection('applications');return false;">OLED 디스플레이</a></div>` |
| 6 | **598** | card with `ROOTS BOOSTER` badge (line 600) | `prod-eh` | `<div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">진공로</a></div>` |
| 7 | **612** | card with `GAUGE &amp; CONTROL` badge (line 614) | `prod-gauges` | `<div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">진공 이중배관</a> · <a href="#applications" onclick="goSection('applications');return false;">연구·분석</a></div>` |
| 8 | **626** | card with `T-STATION` badge (line 628) | `prod-tstation` | `<div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">진공 이중배관</a></div>` |
| 9 | **640** | card with `CONSUMABLES` badge (line 642) | `prod-consumables` | `<div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">전 제품군 공통</a></div>` |

### D.1 Example per-card diff (card 1 only — apply pattern to all 9)

**Before (line 528 and inside 536–539):**
```html
      <article class="prod-card">
        <div class="prod-img">
          …
        </div>
        <div class="prod-body">
          <div class="prod-series">Edwards · Dry Scroll</div>
          <div class="prod-name">nXDS6i ~ nXDS20i</div>
          <div class="prod-part">A73501983 ~ A73801983</div>
          <p class="prod-desc">6~20 m³/h · 무오일 · 52dB(A) · 5년 인터벌 · i/iC/iR</p>
          <a class="prod-cta" href="#contact" onclick="goSection('contact');return false;">견적 문의 …</a>
        </div>
      </article>
```

**After:**
```html
      <article class="prod-card" id="prod-nxds">
        <div class="prod-img">
          …
        </div>
        <div class="prod-body">
          <div class="prod-series">Edwards · Dry Scroll</div>
          <div class="prod-name">nXDS6i ~ nXDS20i</div>
          <div class="prod-part">A73501983 ~ A73801983</div>
          <p class="prod-desc">6~20 m³/h · 무오일 · 52dB(A) · 5년 인터벌 · i/iC/iR</p>
          <div class="prod-apps"><span class="prod-apps-label">적용 분야:</span> <a href="#applications" onclick="goSection('applications');return false;">가스 실린더</a> · <a href="#applications" onclick="goSection('applications');return false;">연구·분석</a> · <a href="#applications" onclick="goSection('applications');return false;">진공 오븐</a></div>
          <a class="prod-cta" href="#contact" onclick="goSection('contact');return false;">견적 문의 …</a>
        </div>
      </article>
```

Repeat this pattern for all 9 cards using the ID and `적용 분야` copy from the table above.

---

## Section E — Nav changes (summary)

### E.1 Desktop nav — insert one `<a>` between lines 463 and 464

```html
<a class="nav-link" href="#applications" onclick="goHome();goSection('applications');return false;">적용 산업</a>
```

### E.2 Mobile menu — insert one `<a>` between lines 482 and 483

```html
<a class="m-link" href="#applications" onclick="toggleMenu();goHome();goSection('applications');return false;">적용 산업</a>
```

### E.3 `scroll-margin-top`

No change needed. The existing rule at line 416 (`section[id] { scroll-margin-top: calc(var(--nav-h) + 8px) }`) applies to `#applications` automatically. Do NOT add a per-section override.

### E.4 `goSection('applications')`

Works immediately with zero router changes — `goSection(id)` at line 1400 accepts any element ID and calls `el.scrollIntoView({behavior:'smooth', block:'start'})`.

---

## Section F — Unmapped SKUs handling

Per sitemap §5, SKUs with no dedicated product card link to `quote.html?model=<SKU>`. Each such chip is an `<a href="…">` (not button, not span). Target URLs (for Preservation Verifier sanity-check):

| SKU | Chip appears in tile(s) | Chip target URL |
|---|---|---|
| E2M     | gas-cylinder                              | `quote.html?model=E2M` |
| ELD500  | insulated-piping                          | `quote.html?model=ELD500` |
| nES     | secondary-battery, coating-smartphone     | `quote.html?model=nES` |
| EXS     | secondary-battery, vacuum-furnace, oled-display, freeze-dry, coating-smartphone | `quote.html?model=EXS` |
| iXH     | oled-display                              | `quote.html?model=iXH` |
| nXRi    | research-analysis                         | `quote.html?model=nXRi` |
| STP Turbo | coating-smartphone                      | `quote.html?model=STP` |

`quote.html` is already an external destination in the site (referenced 4 times at lines 468, 487, 657, 814); adding query params does not break preservation.

---

## Section G — Integration risks & mitigations (top 8)

| # | Risk | Source | Mitigation (in this spec) |
|---|---|---|---|
| G1 | **Edge-kiss between 40°-adjacent tiles** at desktop radius 320 / tile width 220. | layout-spec §9 risk #1 | **D6:** reduce desktop tile width to 200 px (matches compact). Math: center-to-center distance at r=320 with 40° separation ≈ 219 px, with 200 px tiles → 19 px inner gap. Safe. |
| G2 | **CLS** when tiles are absolutely positioned. Parent collapses before JS runs → `#services` jumps up. | layout-spec §9 risk #6 | Inline `min-height: 760px` on `.app-orbit` (and 680 px at compact). Reserved before any JS. |
| G3 | **DOM ↔ visual order drift.** If a developer reorders tiles without updating `--angle`, clockwise a11y ordering silently breaks. | a11y §10 R8 | **D13:** integration comment inserted at top of section (`DOM order = clockwise from 12 o'clock. … Tile 1 in DOM MUST have --angle: 0deg`). Verification checklist item H.11 asserts this. |
| G4 | **Connector SVG intercepting pointer events.** Without `pointer-events:none`, radial lines sit on top of chip hitboxes at intersections and silently break SKU clicks. | a11y §10 R5, preservation engineer flag | **D12:** explicit `pointer-events: none` on `.app-connectors` in CSS. |
| G5 | **Blog deep-link regex collision.** Existing `/^#p\d+$/` handler at line 1481 fires on ANY `#p<digits>` hash on load. New `#applications` starts with `#a` so no collision; but the per-tile anchor naming proposed in sitemap (`#app-*`) also begins with `#a` — safe. | preservation rule, sitemap §3.2 | Document no collision risk and keep regex unchanged. |
| G6 | **Mobile sticky-CTA threshold of 520 px** (line 1456) is tied to hero height. Inserting Applications after Products does not change hero height, so threshold stays correct. | preservation manifest | No change needed; call out explicitly in verifier checklist. |
| G7 | **Medallion 60s rotation + connector stroke animation on reduced-motion**. Global `*` override at line 275 sets transition-duration to .001 ms but does NOT stop CSS `animation`. | motion §7 | **CSS override** — explicit `@media (prefers-reduced-motion: reduce) { .app-medallion-ring { animation: none; } .prod-card.is-focus { animation: none; outline: 2px solid var(--app-gold); } }` included in Section B. |
| G8 | **`.prod-card` existing CSS (lines 186–200, per manifest)** provides overflow clipping. Adding `.is-focus` outline could be clipped. Also check that `.prod-apps` line fits within card padding without breaking grid heights. | preservation rule + a11y R4 | `.prod-card.is-focus` uses `outline` and `box-shadow` (both render outside the element). If the card has `overflow:hidden`, the shadow halo is clipped — verifier must sample one `.prod-card.is-focus` in DevTools to confirm halo renders. If clipped, Wave 4 sets `overflow:visible` on `.prod-card` and moves image clipping to `.prod-img` only. |

---

## Section H — Verification checklist (Wave 6)

| # | Check | How | Expected |
|---|---|---|---|
| H.1 | File length grew by expected amount | `wc -l index.html` before & after | +250–290 lines (HTML: ~170; CSS: ~350 lines in a single insertion; JS: ~150 lines; but JS data is a long inline constant so totals ~670 raw). Sanity range. |
| H.2 | `#applications` section lives between `#products` and `#services` | Grep for `id="applications"` — must appear ONCE, on a line whose number is > 662 and < (old 664 + Δ) | One match, correctly ordered. |
| H.3 | All 9 product cards have `id="prod-*"` | Grep `<article class="prod-card" id="` — must yield 9 matches | 9 matches (prod-nxds/rv/gxs/next/eds/eh/gauges/tstation/consumables). |
| H.4 | Nav contains "적용 산업" link in BOTH desktop and mobile | Grep `적용 산업` | At least 2 matches. |
| H.5 | `goSection('applications')` occurs exactly 2 times | Grep | 2 matches (desktop + mobile). |
| H.6 | DOM-clockwise invariant: tile 1 has `--angle: 0deg` | Grep first `app-tile` `style="--angle:` inside `#applications` | Match is `style="--angle: 0deg; --i: 0;"`. |
| H.7 | All 9 icon symbol IDs resolve | For each tile's `<use href="#icon-…">`, confirm the matching `<symbol id="…">` exists in the sprite block before `</body>`. | All 9 resolve (gas-cylinder, insulated-pipe, battery-cell, furnace, oven, oled-display, freeze-dry, smartphone, microscope). |
| H.8 | `pointer-events: none` on `.app-connectors` | Grep CSS for `.app-connectors` block | Rule present. |
| H.9 | `@media (prefers-reduced-motion: reduce)` disables medallion rotation and `.is-focus` pulse | Grep; reduce-motion walk-through in DevTools emulation | Animations halt; static outline replaces pulse. |
| H.10 | Blog deep-links (`#p1`–`#p10`) still load on SPA blog page | Reload with `#p5` in URL bar | `goBlog()` fires, scrolls to `#p5`. Regex at line 1481 unchanged. |
| H.11 | `data-count="498"` and `data-count="15"` still animate | Scroll hero into view | Counter animates as before. |
| H.12 | Service worker still registers | DevTools → Application → Service Workers | `sw.js` registered, state "activated". |
| H.13 | Mobile sticky-CTA still toggles at scrollY > 520 | Scroll viewport at ≤768 px | `.mobile-cta.on` toggles correctly. |
| H.14 | axe DevTools scan on `#applications` | Run axe on section only | 0 violations. |
| H.15 | Keyboard Tab reaches: all chips → "자세히" → bridge CTA | Tab from top of page | Expected sequence, focus ring visible on each interactive. |

---

## Appendix — quick index of modified / added lines

| Change | File | Approx location | Type |
|---|---|---|---|
| Insert `#applications` HTML block | index.html | line 663 (between 662 and 664) | Add |
| Insert SVG sprite | index.html | immediately before line 1497 `</body>` | Add |
| Desktop nav `적용 산업` link | index.html | between line 463 and 464 | Add 1 line |
| Mobile nav `적용 산업` link | index.html | between line 482 and 483 | Add 1 line |
| Add `id="prod-*"` to 9 product cards | index.html | lines 528, 542, 556, 570, 584, 598, 612, 626, 640 | Attribute add |
| Add `.prod-apps` line to 9 product cards | index.html | inside each `.prod-body` after `.prod-desc` | Add 1 line per card |
| Insert CSS block | index.html | immediately before line 452 `</style>` | Add (~350 lines) |
| Insert JS block | index.html | inside `<script>` block, before line 1385 (`window.goHome = …`) | Add (~180 lines) |

End of master spec.
