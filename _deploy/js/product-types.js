/* ============================================================
   product-types.js — Rule-based product type tagger
   ALL_PRODUCTS 각 품목의 기능적 타입을 추론한다.
   LLM 호출 없이 즉시 동작. Agent 2 / prefilter 도메인 필터에 사용.
============================================================ */

// 우선순위 순서로 매칭. 위에서부터 첫 매치가 채택됨.
const MK_TYPE_RULES = [
  { type: "leak_detector",     rx: /\b(ELD\d*|LEAK\s*DETECT)/i },
  { type: "controller",        rx: /\b(TIC|NEO\s?CONTROLLER|PUMP\s?CONTROLLER|CONTROLLER|INTERFACE)\b/i },
  { type: "valve",             rx: /\b(TAV|ISOLATION\s?VALVE|IPV|ANGLE\s?VALVE|GATE\s?VALVE|PNEUMATIC\s?VALVE|MANUAL\s?VALVE|ACTUATOR)\b/i },
  { type: "booster",           rx: /\b(EH\d*\w*|BOOSTER|ROOTS)\b/i },
  { type: "turbo",             rx: /\b(nEXT\d*\w*|STP-?\w*|nXR\d*\w*|TURBO|TMP)\b/i },
  { type: "dry_pump_scroll",   rx: /\b(nXDS\d*\w*|XDS\d*\w*|SCROLL)\b/i },
  { type: "dry_pump_screw",    rx: /\b(GXS\d*\w*|EXS\d*\w*|EDS\d*\w*|IXL\d*\w*|IH\d*\w*|SCREW\s?DRY|DRY\s?SCREW|IPX\d*\w*)\b/i },
  { type: "rotary_oil",        rx: /\b(nES\d*\w*|E2M\d*\w*|RV\d+|ROTARY\s?VANE|OIL\s?SEAL|OIL\s?SEALED)\b/i },
  { type: "cable",             rx: /\b(CABLE|HARNESS|CORD|POWER\s?CORD)\b/i },
  { type: "filter",            rx: /\b(EMF\d*|FILTER|MIST\s?ELIMINATOR|OIL\s?MIST|EXHAUST\s?SILENCER|SILENCER|TRAP)\b/i },
  { type: "fluid",             rx: /\b(PFPE|OIL\b|FOMBLIN|KRYTOX|ULTRAGRADE|FLUID|GREASE|LUBRICANT)\b/i },
  { type: "fitting",           rx: /\b(FLANGE|KF\d*|ISO\d*|CF\d*|NW\d*|ELBOW|TEE|REDUCER|NIPPLE|CLAMP|BELLOWS|HOSE)\b/i },
  { type: "gauge",             rx: /\b(GAUGE|PIRANI|CAPACITANCE|BAROMETER|PRESSURE\s?SENSOR|APG|CDG|PENNING|IONIZATION)\b/i },
  { type: "seal",              rx: /\b(SEAL|O-?RING|CENTRING|CENTERING|CENTER\s?RING)\b/i },
  { type: "service_kit",       rx: /\b(SERVICE\s?KIT|MAJOR\s?SERVICE|MINOR\s?SERVICE|TIP\s?SEAL\s?KIT|REBUILD\s?KIT|MAINT\w*\s?KIT)\b/i },
  { type: "accessory",         rx: /\b(ADAPTOR|ADAPTER|BRACKET|MOUNT|CASTER|WHEEL|DUST\s?COVER)\b/i },
];

function productType(p){
  const hay = ((p && p.partNo)||"") + " " + ((p && p.description)||"");
  for(const r of MK_TYPE_RULES){
    if(r.rx.test(hay)) return r.type;
  }
  return "misc";
}

// 후보 목록에서 타입별 카운트/샘플 반환
function summarizeByType(products){
  const buckets = {};
  (products||[]).forEach(p=>{
    const t = productType(p);
    if(!buckets[t]) buckets[t] = { count: 0, samples: [] };
    buckets[t].count++;
    if(buckets[t].samples.length < 3) buckets[t].samples.push(p.partNo);
  });
  return buckets;
}

// 타입별 인간 친화 라벨 (UI 용)
const MK_TYPE_LABELS = {
  dry_pump_scroll: "드라이 스크롤펌프",
  dry_pump_screw:  "드라이 스크류펌프",
  turbo:           "터보펌프",
  rotary_oil:      "로터리 오일펌프",
  booster:         "부스터(Roots)",
  controller:      "컨트롤러",
  valve:           "밸브",
  leak_detector:   "리크 디텍터",
  cable:           "케이블",
  filter:          "필터/트랩",
  fluid:           "펌프 오일/유체",
  fitting:         "배관 피팅",
  gauge:           "게이지",
  seal:            "실/오링",
  service_kit:     "서비스 키트",
  accessory:       "액세서리",
  misc:            "기타",
};

function typeLabel(t){ return MK_TYPE_LABELS[t] || t; }

// 명함 OCR 등 다른 모듈은 영향 없음. window 전역으로 노출.
window.productType = productType;
window.summarizeByType = summarizeByType;
window.typeLabel = typeLabel;
window.MK_TYPE_LABELS = MK_TYPE_LABELS;
