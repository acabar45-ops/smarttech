# Applications 섹션 카피 문서 (Korean B2B Copywriter · Wave 2)

> 본 문서는 `index.html` Applications 섹션의 모든 텍스트 표면을 확정한 레퍼런스다.
> Consolidator 에이전트(Wave 3)가 이 파일을 HTML로 머지한다.
> 편집 금지 대상: `index.html`, `data/applications.json`.
> 작성 규칙: B2B 기술 톤, 한국어 우선 · 영문 제품명은 라틴자 유지 (nXDS, GXS, nEXT), 문장 종결은 `-다` / `-합니다` 일관, 숫자는 아라비아, 범위는 en-dash (`6–20 m³/h`).

---

## A. Section Header Block

| 키 | 값 | 글자수 |
|---|---|---|
| `eyebrow` | `APPLICATIONS` | 12 |
| `h2` (Korean primary) | `9대 산업을 잇는 진공 솔루션` | 15 |
| `h2_sub` (English supporting) | `Vacuum Applications Across 9 Industrial Domains` | 48 |
| `lede` | `반도체부터 이차전지·제약 동결건조까지, 공정별로 검증된 Edwards 펌프 조합을 한눈에 제시합니다.` | 55 (공백 제외 기준 47) |

**Eyebrow 선정 근거**
기존 Products 섹션이 라틴 단어(`Products`)를 eyebrow로 쓴 기조와 일치시켜 `APPLICATIONS` 채택. `적용 산업`은 한국어 자연스러움은 높지만 기존 사이트의 eyebrow 체계(영문 대문자)와 어긋남.

**H2 대안 기록**
- 채택: `9대 산업을 잇는 진공 솔루션` — 숫자로 스케일을 즉시 전달.
- 대안: `공정별 진공 솔루션 적용 분야` (12자, 범용적이나 임팩트 낮음).
- 대안: `산업별로 검증된 진공 기술` (13자, 무난).

---

## B. 9개 애플리케이션 카피

> 규칙: `title_ko`는 JSON 원본을 기본 유지하되 2줄 클램프(약 30자) 초과 또는 오탈자·어색함이 있으면 수정. `one_liner`는 `description_long` 대상. `bullets`는 이미지 원문 보존 원칙 — 오탈자/띄어쓰기만 교정하고 모든 변경을 기록한다.

### B-1. Gas Cylinder & Residual Gas Removal

- `title_ko`: **가스 실린더 & 잔류가스 제거** (수정, 26자)
  - 변경 사유: 원본 `가스 실린더 & Residual Gas Removal`은 한국어 primary 원칙과 어긋남. 한글 병기로 변경.
- `title_en`: `Gas Cylinder & Residual Gas Removal` (유지)
- `one_liner`: `실린더 충전 전 잔류가스를 제거해 고순도와 안전성을 동시에 확보합니다.` (유지 — 30자)
- `bullets` (원문 보존):
  1. `충전 전 내부 Purge, 고순도 유지, 안전 확보.` (원문 유지)
  2. `추천 모델: nXDS (스크롤), E2M, nEXT` (수정 — 원문 `초보자용:`은 B2B 어조에 부적합, `추천 모델:`로 교체)
- `cta_label_primary`: `자세히 보기 →`

### B-2. Insulated Piping (진공 이중배관)

- `title_ko`: **진공 이중배관 (Insulated Piping)** (유지, 18자)
- `title_en`: `Insulated Piping` (유지)
- `one_liner`: `극저온 유체 이송 배관의 진공 단열로 열손실과 결로를 차단합니다.` (유지)
- `bullets`:
  1. `극저온 유체 이송 시 단열로 열손실을 최소화합니다.` (수정 — 원문 `극저금저온`은 오탈자, `극저온`으로 교정. 문장 종결 `-ㅂ니다`로 통일)
  2. `추천 모델: T-station, nXDS, ELD500 Leak Detector` (수정 — `리크디텍터` → 기술 용어 표기 일관화를 위해 `Leak Detector` 라틴자 유지)
- `cta_label_primary`: `자세히 보기 →`

### B-3. Secondary Battery (이차전지 제조)

- `title_ko`: **이차전지 (Secondary Battery) 제조** (유지, 17자)
- `title_en`: `Secondary Battery Manufacturing` (유지)
- `one_liner`: `이차전지 Degassing·전해액 함침 공정에서 셀 수명과 수율을 극대화합니다.` (유지 — 핵심 공정 2개를 정확히 호명)
- `bullets`:
  1. `Degassing·전해액 함침 공정에서 기포 제거와 수명 연장을 지원합니다.` (수정 — 원문 `Degassing(탈취)`에서 `탈취`는 오역(실제로는 `탈기`). 업계 표준 영문 `Degassing`만 남김)
  2. `추천 모델: GXS160, GXS250/2600, nES, EXS` (수정 — `추천 모델:` 프리픽스 추가)
- `cta_label_primary`: `배터리 공정 사례 →` (도메인 특화 CTA — 2026년 한국 B2B 핵심 버티컬)

### B-4. Vacuum Furnace (진공로)

- `title_ko`: **진공로 (Vacuum Furnace)** (유지, 13자)
- `title_en`: `Vacuum Furnace` (유지)
- `one_liner`: `금속 열처리·CVD 코팅·탄화 공정에서 고온 챔버의 산화를 원천 차단합니다.` (유지)
- `bullets`:
  1. `금속 열처리·탄화·소성 공정에서 산화를 차단합니다.` (수정 — 원문 `열처리/탄화/탈취/소성`의 `탈취`는 furnace 문맥에 부적합. 삭제)
  2. `추천 모델: GXS 시리즈, EXS, EH` (수정 — 프리픽스 추가)
- `cta_label_primary`: `자세히 보기 →`

### B-5. Vacuum Oven & Drying (진공 오븐)

- `title_ko`: **진공 오븐 및 건조 (Vacuum Oven & Drying)** (유지, 22자)
- `title_en`: `Vacuum Oven & Drying` (유지)
- `one_liner`: `저온·저압 건조로 열에 민감한 소재의 형상과 품질을 안정적으로 보존합니다.` (미세 수정 — `열 민감 소재` → `열에 민감한 소재`로 자연스러움 개선)
- `bullets`:
  1. `반도체 부품·화장품 원료·화학 제품의 저온 건조로 변형을 방지합니다.` (수정 — 구분자 `/` → `·`, 종결 `-ㅂ니다`로 통일)
  2. `추천 모델: nXDS, GXS` (수정 — 프리픽스 추가)
- `cta_label_primary`: `자세히 보기 →`

### B-6. OLED & Display Process

- `title_ko`: **OLED 및 디스플레이 공정** (유지, 14자)
- `title_en`: `OLED & Display Process` (유지)
- `one_liner`: `OLED 유기물 증착·Encapsulation 공정에서 초청정 진공 환경을 유지합니다.` (유지)
- `bullets`:
  1. `OLED 유기물 증착·Encapsulation 공정에서 먼지와 산소를 차단합니다.` (수정 — `봉지` → `Encapsulation` 업계 표준 표기, 쉼표 제거로 문장 명확화)
  2. `추천 모델: GXS/EXS, iXH` (수정 — 프리픽스 추가)
- `cta_label_primary`: `자세히 보기 →`

### B-7. Food & Pharma Freeze-Drying (동결건조)

- `title_ko`: **식품 및 제약 동결건조** (유지, 12자)
- `title_en`: `Food & Pharma Freeze-Drying` (유지)
- `one_liner`: `동결건조 공정에서 영양소·활성물질의 손상 없이 장기 보존성을 확보합니다.` (미세 수정 — 조사 `의` 추가)
- `bullets`:
  1. `의약품 원료·유산균·식품 동결건조로 영양소 손상 없이 장기 보존합니다.` (수정 — `/` → `·`, 종결 통일)
  2. `추천 모델: EM 시리즈, GXS/EXS` (수정 — 프리픽스 추가)
- `cta_label_primary`: `자세히 보기 →`

### B-8. Coating & Smartphone Process

- `title_ko`: **코팅 및 스마트폰 공정** (유지, 12자)
- `title_en`: `Coating & Smartphone Process` (유지)
- `one_liner`: `AR/AF 스퍼터링 코팅으로 디스플레이 내구성과 광학 품질을 높입니다.` (유지)
- `bullets`:
  1. `스마트폰 액정·렌즈의 AR/AF 스퍼터링 코팅으로 내구성을 향상시킵니다.` (재작성 — 원문은 문법 붕괴(`AR/AF 핸드폰 액정 코팅 렌즈 코팅`). 의미를 살려 재구성)
  2. `추천 모델: nES, EXS/GXS, STP Turbo` (수정 — 프리픽스 추가)
- `cta_label_primary`: `자세히 보기 →`

### B-9. Research & Analysis (연구·분석)

- `title_ko`: **연구 및 분석 (Research & Analysis)** (유지, 19자)
- `title_en`: `Research & Analysis` (유지)
- `one_liner`: `SEM·TEM·질량분석기에 초고진공을 공급해 재현성 있는 측정 결과를 보장합니다.` (유지)
- `bullets`:
  1. `SEM·TEM 관찰과 GC/LC-MS 분석을 위한 정밀 측정 환경을 확보합니다.` (재작성 — 원문 `전자현미경(SEM/TEM) 관찰 질량 분석 장비(GC/LC-MS) 분석 정밀 측정 환경 확보`는 띄어쓰기·조사 결손. 의미 구조화)
  2. `추천 모델: nXRi, nXDS, nEXT` (수정 — 프리픽스 추가)
- `cta_label_primary`: `자세히 보기 →`

---

## C. Bridge CTA (Applications ↔ Products)

**채택**: `각 산업별 추천 펌프 자세히 보기 →`

**대안 검토**
- `제품 카탈로그에서 확인하기 →` (너무 범용)
- `공정별 추천 모델 전체 보기 →` (명확하나 "자세히 보기"와 뉘앙스 겹침)
- `추천 펌프 상세 사양 확인 →` (사양 강조 — 이미 한 번 탐색한 사용자에 적합하나 첫 진입자에겐 무거움)

**근거**: 기존 사이트는 CTA에 `자세히 보기`, `견적 문의하기` 같이 한국어 동사형을 쓴다. `각 산업별 추천 펌프`가 전이(transition) 맥락을 명시해 Applications → Products 흐름을 이어준다.

**버튼 부가 copy (hover/aria 보조 텍스트)**: `9개 산업군에서 검증된 Edwards 전 라인업 보기`

---

## D. Product SKU Chip Labels

**룰 (Consistent Rule)**

```
1) 칩은 제품 패밀리 약어만 표시한다: nXDS, GXS, nEXT, E2M …
2) 한국어 설명자는 붙이지 않는다(예: "nXDS (스크롤)" 사용 안 함).
   — 근거: 칩은 폭이 좁아 2토큰 이상은 잘리며, 기술 독자에게 약어가 1차 식별자.
3) 브랜드 접두(Edwards)는 칩 외부(상위 섹션)에서 이미 단언되므로 칩에는 넣지 않는다.
4) 스페이스·슬래시를 포함한 복합 SKU는 그대로 표기: "GXS250/2600", "STP Turbo".
5) 예외(비표준 표기): "EM 시리즈" / "GXS 시리즈" 등 원본이 시리즈 단위로만 특정된 경우는 그대로 유지.
```

**표준 칩 텍스트 목록**

| id | 칩 표시 (확정) |
|---|---|
| gas-cylinder | `nXDS` · `E2M` · `nEXT` |
| insulated-piping | `T-station` · `nXDS` · `ELD500` |
| secondary-battery | `GXS160` · `GXS250/2600` · `nES` · `EXS` |
| vacuum-furnace | `GXS 시리즈` · `EXS` · `EH` |
| vacuum-oven | `nXDS` · `GXS` |
| oled-display | `GXS` · `EXS` · `iXH` |
| freeze-dry | `EM 시리즈` · `GXS` · `EXS` |
| coating-smartphone | `nES` · `EXS` · `GXS` · `STP Turbo` |
| research-analysis | `nXRi` · `nXDS` · `nEXT` |

> JSON의 `label` 필드 중 `nXDS (스크롤)`는 위 룰에 따라 Wave 3에서 `nXDS`로 축약. 별도의 한글 보조어가 필요한 경우 칩 hover tooltip (`title` attr)으로 내보낸다: 예) `<a title="드라이 스크롤 펌프">nXDS</a>`.

---

## E. Blog "자세히" Link Text — Specific 패턴 채택

**방침**: **Specific 패턴**을 택한다. `관련 블로그 →`는 클릭 유도력이 약하고 SEO 시그널도 희박하다. 각 application 컨텍스트를 요약한 링크 텍스트가 B2B 독자의 탐색 기대치와 일치한다.

**7개 링크 텍스트** (related_blog_post가 null이 아닌 applications만)

| application id | related_blog_post | 링크 텍스트 (확정) |
|---|---|---|
| gas-cylinder | #p2 | `가스 퍼지·잔류가스 제거 가이드 →` |
| insulated-piping | #p7 | `극저온 배관 단열 사례 →` |
| secondary-battery | #p10 | `이차전지 Degassing 공정 가이드 →` |
| vacuum-furnace | #p4 | `진공로 산화 방지 노하우 →` |
| vacuum-oven | #p9 | `저온 건조 공정 가이드 →` |
| oled-display | #p10 | `OLED 증착 진공 관리 →` |
| freeze-dry | #p9 | `동결건조 펌프 선정 가이드 →` |
| coating-smartphone | #p10 | `AR/AF 코팅 진공 사례 →` |
| research-analysis | #p6 | `분석 장비 초고진공 구축 →` |

> 주: `freeze-dry`와 `vacuum-oven`이 동일 블로그(`#p9`)를 가리키고 `secondary-battery`/`oled-display`/`coating-smartphone`이 동일 블로그(`#p10`)를 공유한다. 링크 텍스트를 context-specific으로 분리해 중복 앵커로 인한 SEO 희석을 완화한다.

---

## F. Bridge Reverse-Link Copy (Product Card → Applications)

**라벨**: `적용 분야` 채택
- 대안 `쓰이는 공정`은 구어체. B2B 카탈로그에서 `적용 분야`가 업계 표준.

**포맷**
```
적용 분야: {공정1} · {공정2} · {공정3}
```
- 구분자: **미들닷 `·`** (en-space 포함하지 않음 — 콤팩트 카드 레이아웃 최적화)
- 최대 3개까지 노출, 초과 시 `… +{N}개 공정` 접미사.

**제품 카드별 예시**

| 제품 | 적용 분야 라인 |
|---|---|
| nXDS | `적용 분야: 가스 실린더 · 연구·분석 · 진공 오븐` |
| RV (E2M) | `적용 분야: 가스 실린더 · 동결건조` |
| GXS | `적용 분야: 이차전지 · 진공로 · OLED 디스플레이 +3개 공정` |
| nEXT | `적용 분야: 가스 실린더 · 연구·분석` |
| EH | `적용 분야: 진공로` |
| T-station | `적용 분야: 진공 이중배관` |

> `연구·분석`처럼 공정 이름 내부에 이미 `·`이 존재하는 경우 구분자와 충돌하지만, 컨텍스트상 독자에게 혼동을 주지 않는다. 접근성 우려 시 Wave 3에서 `aria-label`에 세미콜론 구분 버전을 병기한다.

---

## G. Accessibility Labels (aria-label)

### G-1. 오비탈 컨테이너
```
aria-label="9개 산업 도메인과 추천 Edwards 진공펌프 관계도"
role="group"
```

### G-2. 각 타일 (application tile)
**포맷**:
```
aria-label="{title_ko} 적용 분야 — {one_liner 축약}"
```
**9개 실값**:
| id | aria-label |
|---|---|
| gas-cylinder | `가스 실린더 및 잔류가스 제거 적용 분야 — 고순도·안전성 확보` |
| insulated-piping | `진공 이중배관 적용 분야 — 극저온 단열 및 열손실 차단` |
| secondary-battery | `이차전지 제조 적용 분야 — Degassing 및 전해액 함침` |
| vacuum-furnace | `진공로 적용 분야 — 금속 열처리 및 산화 차단` |
| vacuum-oven | `진공 오븐 및 건조 적용 분야 — 저온·저압 건조` |
| oled-display | `OLED 및 디스플레이 공정 적용 분야 — 초청정 진공 환경` |
| freeze-dry | `식품 및 제약 동결건조 적용 분야 — 장기 보존성 확보` |
| coating-smartphone | `코팅 및 스마트폰 공정 적용 분야 — AR/AF 스퍼터링` |
| research-analysis | `연구 및 분석 적용 분야 — SEM·TEM·질량분석기용 초고진공` |

### G-3. SKU 칩 (앵커 링크인 경우)
**포맷**:
```
aria-label="{sku} 제품 상세 보기"
```
예: `aria-label="nXDS 제품 상세 보기"`, `aria-label="GXS250/2600 제품 상세 보기"`

> `prod_card_id`가 `null`인 SKU(ELD500, nES, EXS, iXH, nXRi 등)는 앵커가 아닌 static chip이므로 `aria-label` 불필요. `role="listitem"`만 부여.

### G-4. 연결선 (connector lines)
`aria-hidden="true"` — 텍스트 없음 (사양 확인).

### G-5. Bridge CTA 버튼
```
aria-label="각 산업별 추천 Edwards 펌프 전체 카탈로그로 이동"
```

### G-6. Blog 링크 (7개)
각 링크의 `aria-label`은 본문 텍스트 그대로 사용하되, 목적 명시를 위해 `새 섹션에서 열림` 접미 없이 내부 앵커이므로 별도 접미사 불필요.

---

## H. Mobile Variant (≤767px)

**결정: 보조 라인 추가 — YES**

**이유**: 모바일에서 medallion(오비탈 시각화)이 숨겨지면 h2 + lede만 남아 "9개 산업"이라는 스케일이 시각적으로 사라진다. 이때 9개 타일이 리스트처럼 수직 배치되는데, 독자가 "왜 9개인가"의 맥락을 잃을 위험이 있다. 한 줄의 보조 라인으로 정보 밀도를 회복한다.

**모바일 전용 보조 라인 (`<p class="lede-sub mobile-only">`)**:
```
반도체·이차전지·제약·연구 등 9개 산업군에서 검증된 적용 사례입니다.
```
- 글자수: 34자 (2줄 이내 안전)
- 노출 규칙: `@media (max-width:767px)`에서만 `display:block`; 데스크톱에서는 `display:none`.
- `aria-hidden`: 설정 안 함 — 스크린리더에도 의미 있는 컨텍스트.

**대안(채택 안 함)**: 타일 위에 `산업 1 / 9` 카운터 노출. — 정보는 좋지만 스크롤할 때마다 재확인이 필요해 부담이 됨. 보조 라인이 더 경제적.

---

## 부록: Typography & Punctuation Checklist (Wave 3 참고)

- 모든 `-다` / `-ㅂ니다` 종결 일관.
- SKU 표기는 Latin — 예외 없음.
- 범위 표기는 en-dash (`6–20 m³/h`), 하이픈-마이너스 (`6-20`) 금지.
- 구분자 `·` (U+00B7) 사용, `/`는 원본 SKU 표기(GXS250/2600, STP/nEXT)에 한정.
- 숫자 단위는 붙여쓰기 (`20m³/h` → `20 m³/h` 반각 스페이스).
- 괄호는 전부 반각(`()`), 전각 괄호 금지.

---

*작성자: Korean B2B Copywriter · Wave 2*
*최종 업데이트: 2026-04-16*
