/* ============================================================
   email-agent.js — 메일 자동견적 파이프라인 (v3: variants + clarification)

   파이프라인:
     [0] 사전 고객 DB 매칭 (API 0)
     [1] Agent 1   — 거래 등급 + 고객정보 (신규 고객일 때만)
     [2] Agent 1.5 — 요구사항 구조화
     [3] 사전필터  — family + type 그룹핑, 도메인 하드필터
     [4] Agent 2   — 1~3 variants 제품 선정
     [5] Agent 2.5 — 자가검증 (pass / needs_fix / insufficient_info)
         · insufficient_info 또는 confidence 부족 → 명확화 모드로 분기
            → Agent Q (질문 메일 초안) → 세션 DB 저장 → 고객 회신 대기
              └ 수동 붙여넣기 또는 Agent R (mock 회신 시뮬레이션)
              └ [회신 반영 후 재분석] → 병합 텍스트로 파이프라인 재실행
         · 정상 → Agent 3 (회신 초안) → 견적 카드 렌더
============================================================ */

let MK_EMAIL_PROPOSAL = null;
let MK_ACTIVE_VARIANT = 0;
let MK_CURRENT_SESSION_ID = null;

// 명확화 라운드 상한 (최대 1회만 추가 질문)
const MK_MAX_CLARIFY_ROUNDS = 1;

// 에스컬레이션 임계 — 이 수준이면 질문도 하지 말고 이명재 대표에게 넘김
const MK_ESCALATE_LEN_MIN = 30;        // 본문이 이것보다 짧으면 의심
const MK_ESCALATE_CONF_MAX = 0.25;     // reqs.confidence 이 이하면 에스컬레이션 후보

const MK_COMPANY = {
  name: "(주)스마텍",
  rep: "이명재",
  phone: "031-204-7170",
  mobile: "010-3194-7170",
  fax: "031-206-7178",
  email: "rokmclmj@gmail.com",
  address: "경기 수원시 영통구 신원로 55, 테크트리 영통 지식산업센터 907호",
  note: "Edwards 공식대리점 · Vacuum Total Solution",
  web: "smartechvacuum.com"
};

function clearEmailInput(){
  const t = document.getElementById("emailBody"); if(t) t.value = "";
  const r = document.getElementById("emailResult"); if(r) r.innerHTML = "";
  MK_EMAIL_PROPOSAL = null;
  MK_ACTIVE_VARIANT = 0;
  MK_CURRENT_SESSION_ID = null;
  renderPendingSessions();
}

/* ============================================================
   사전필터 (family + type 그룹핑, 도메인 하드필터)
============================================================ */
const MK_FAMILIES = [
  "NXDS","NXR","NEXT","NES","GXS","EXS","EDS","E2M","RV","EH","STP","ELD","XDS","IPX","TIC","TAV","T-STATION","PFPE","IST","TIM","IXL","IH"
];
function familyOf(product){
  const hay = (product.partNo + " " + product.description).toUpperCase();
  const ordered = [...MK_FAMILIES].sort((a,b)=>b.length-a.length);
  for(const f of ordered){ if(hay.includes(f)) return f; }
  return "MISC";
}
function _ptype(p){
  return (typeof productType === "function") ? productType(p) : "misc";
}
function compactProducts(list){
  return list.map(p=>({
    p: p.partNo,
    d: p.description,
    s: (p.sheet||"").replace("2026 Price_",""),
    f: familyOf(p),
    t: _ptype(p),
  }));
}

function prefilterCatalog(email, reqs){
  const txt = (email||"").toLowerCase();
  if(!txt.trim() || typeof ALL_PRODUCTS === "undefined") return [];

  const modelHints = ["rv","e2m","nes","nxds","nxr","next","gxs","exs","eds","eh","stp","eld","xds","t-station","tic","ipx","ev","pfpe","ist","tim","tav","ixl"];
  const processMap = [
    { kw:["코팅","sputter","스퍼터","액정","렌즈","inline"], add:["nes","exs","gxs","rv","e2m","next"] },
    { kw:["이차전지","battery","degassing","탈취","전해액"], add:["gxs","nes","exs"] },
    { kw:["진공로","vacuum furnace","열처리","소성","탄화"], add:["gxs","exs","eh"] },
    { kw:["가스","실린더","purge","퍼지","고순도","특수가스"], add:["nxds","e2m","eh","next"] },
    { kw:["이중배관","극저온","단열","보온","리크","leak"], add:["nxds","eld","next"] },
    { kw:["동결건조","제약","pharma","유산균","lyo"], add:["e2m","gxs","exs","nxds"] },
    { kw:["oled","display","디스플레이","증착"], add:["gxs","exs"] },
    { kw:["진공오븐","오븐","oven","건조","화학","화장품"], add:["nxds","gxs"] },
    { kw:["연구","analysis","r&d","sem","tem","gc-ms","lc-ms","질량분석","전자현미경","cluster","load lock"], add:["nxr","nxds","next","xds","nes","stp"] },
  ];
  const rawTokens = txt.match(/[a-z][a-z0-9\-]{2,}/g) || [];
  const tokens = new Set(rawTokens);
  processMap.forEach(pm=>{ if(pm.kw.some(k=>txt.includes(k))) pm.add.forEach(x=>tokens.add(x)); });
  modelHints.forEach(m=>{ if(txt.includes(m)) tokens.add(m); });

  const strongModels = new Set();
  if(reqs && Array.isArray(reqs.models_mentioned)){
    reqs.models_mentioned.forEach(m => {
      const mm = String(m||"").toLowerCase();
      if(mm.length>=3){ tokens.add(mm); strongModels.add(mm); }
    });
  }
  if(reqs && Array.isArray(reqs.accessories_needed)){
    reqs.accessories_needed.forEach(a => { const aa = String(a||"").toLowerCase(); if(aa.length>=3) tokens.add(aa); });
  }

  const vacLevel = (reqs && reqs.vacuum_level ? String(reqs.vacuum_level) : "").toLowerCase();
  const constraintsStr = (reqs && Array.isArray(reqs.constraints) ? reqs.constraints.join(" ") : "").toLowerCase();
  const processesStr = (reqs && Array.isArray(reqs.processes) ? reqs.processes.join(" ") : "").toLowerCase();
  const wantHV = /고진공|high\s*vac|\bhv\b|e-?[567]|ultra\s*high|uhv/.test(vacLevel) ||
                 /고진공|ultra\s*high|uhv/.test(constraintsStr);
  const wantOilFree = /oil[-\s]?free|오일프리|오일\s*없|무오일|dry\s*only/.test(constraintsStr);
  const wantQuiet = /저소음|quiet|low\s*noise/.test(constraintsStr);
  const wantCluster = /cluster\s*tool|load\s*lock|transfer\s*module/.test(processesStr);

  const scored = ALL_PRODUCTS.map(p=>{
    const hay = (p.partNo + " " + p.description).toLowerCase();
    const t = _ptype(p);
    if(wantHV && t === "rotary_oil") return { p, score: 0, _drop: true };
    if(wantOilFree && (t === "rotary_oil" || t === "fluid")) return { p, score: 0, _drop: true };

    let score = 0;
    tokens.forEach(tok=>{
      if(tok.length>=3 && hay.includes(tok)){
        const bonus = strongModels.has(tok) ? 6 : (hay.indexOf(tok)<20 ? 3 : 1);
        score += bonus;
      }
    });
    rawTokens.forEach(tok=>{ if(tok.length>=4 && p.partNo.toLowerCase()===tok) score += 15; });
    if(reqs && Array.isArray(reqs.models_mentioned)){
      reqs.models_mentioned.forEach(m=>{ if(m && p.partNo.toLowerCase()===String(m).toLowerCase()) score += 20; });
    }
    if(wantHV && (t === "turbo" || t === "dry_pump_scroll" || t === "dry_pump_screw")) score += 4;
    if(wantQuiet && t === "dry_pump_scroll") score += 2;
    if(wantCluster && (t === "turbo" || t === "controller" || t === "valve")) score += 3;

    return { p, score };
  }).filter(x=>!x._drop && x.score>0);

  if(!scored.length) return [];

  const maxPerType = 6;
  const byType = new Map();
  scored.forEach(x=>{
    const t = _ptype(x.p);
    if(!byType.has(t)) byType.set(t, []);
    byType.get(t).push(x);
  });
  const typeFiltered = [];
  byType.forEach((arr)=>{
    arr.sort((a,b)=>b.score-a.score);
    for(let i=0;i<Math.min(arr.length,maxPerType);i++) typeFiltered.push(arr[i]);
  });
  typeFiltered.sort((a,b)=>b.score-a.score);

  const maxPerFamily = 4;
  const maxTotal = 40;
  const byFam = new Map();
  typeFiltered.forEach(x=>{
    const f = familyOf(x.p);
    if(!byFam.has(f)) byFam.set(f, []);
    byFam.get(f).push(x);
  });
  const families = [...byFam.entries()]
    .map(([f, arr])=>({ f, best: Math.max(...arr.map(x=>x.score)), arr: arr.slice(0, maxPerFamily) }))
    .sort((a,b)=>b.best - a.best);

  const out = [];
  for(const fam of families){
    for(const x of fam.arr){ out.push(x.p); if(out.length>=maxTotal) break; }
    if(out.length>=maxTotal) break;
  }
  return out;
}

/* ============================================================
   Agent 1 — 거래 등급 분류 + 고객정보
============================================================ */
const CLASSIFY_SCHEMA = {
  type:"object",
  properties:{
    grade: { type:"string", enum:["dealer","oem","enduser"] },
    confidence: { type:"number", minimum:0, maximum:1 },
    rationale: { type:"string" },
    signals:  { type:"array", items:{ type:"string" } },
    customer: {
      type:"object",
      properties:{
        company: { type:["string","null"] },
        contact: { type:["string","null"] },
        title:   { type:["string","null"] },
        phone:   { type:["string","null"] },
        email:   { type:["string","null"] },
        address: { type:["string","null"] },
      }
    },
    subject_summary: { type:["string","null"] }
  },
  required:["grade","confidence","rationale","customer"]
};
const CLASSIFY_PROMPT = `당신은 B2B 진공장비 대리점의 거래등급 분류 + 고객정보 추출 전문가입니다.
메일 본문에서 아래 규칙으로 등급을 판정하고 고객정보를 추출해 classify_grade 도구로 반환하십시오.

등급 규칙:
- dealer: 재판매/공급/총판/대리점/판매처/리셀러 언급, 다수 최종사용자에게 납품 목적.
- oem: 자사 장비 내장/integration/BOM/양산라인 투입, 반복 수요.
- enduser: 대학·연구소·공장 직접 운영, 1~2대 자체 사용.

- 한국 전화번호 010-0000-0000 / 02-000-0000 / 031-000-0000 포맷.
- 국가코드 +82 는 0 으로 변환.
- 시그널 약하면 enduser 기본, confidence 하향.
- 출력 classify_grade 1회.`;

/* ============================================================
   Agent 1.5 — 요구사항 구조화 추출
============================================================ */
const REQS_SCHEMA = {
  type:"object",
  properties:{
    models_mentioned: { type:"array", items:{ type:"string" } },
    processes: { type:"array", items:{ type:"string" } },
    vacuum_level: { type:["string","null"] },
    applications: { type:"array", items:{ type:"string" } },
    quantities: {
      type:"array",
      items:{
        type:"object",
        properties:{ model_or_category:{ type:"string" }, qty:{ type:"integer", minimum:1 } },
        required:["model_or_category","qty"]
      }
    },
    accessories_needed: { type:"array", items:{ type:"string" } },
    constraints: { type:"array", items:{ type:"string" } },
    confidence: { type:"number", minimum:0, maximum:1 }
  },
  required:["models_mentioned","processes","applications","quantities","accessories_needed","confidence"]
};
const REQS_PROMPT = `메일에서 진공장비 요구사항을 구조화 추출. extract_requirements 1회 반환.

1. models_mentioned: 메일에 명시된 구체 모델명만. 추측 금지.
2. processes: 공정·용도.
3. vacuum_level: 명시된 진공도. 없으면 null.
4. applications: 장비·환경.
5. quantities: 수량 명시 항목만.
6. accessories_needed: 부속 (컨트롤러, 케이블, 밸브, 리크디텍터 등).
7. constraints: 특수 조건 (오일프리, 저소음 등).
8. confidence: 추출 자신도.
9. 없는 필드 빈 배열/null. 환각 금지.`;

/* ============================================================
   Agent 2 — 1~3 variants 제품 선정
============================================================ */
const SELECT_SCHEMA = {
  type:"object",
  properties:{
    variants: {
      type:"array",
      minItems: 1,
      maxItems: 2,
      items:{
        type:"object",
        properties:{
          label: { type:"string" },
          positioning: { type:"string" },
          description: { type:"string" },
          pros: { type:"array", items:{ type:"string" } },
          cons: { type:"array", items:{ type:"string" } },
          best_for: { type:"string" },
          items: {
            type:"array",
            items:{
              type:"object",
              properties:{
                partNo: { type:"string" },
                qty: { type:"integer", minimum:1 },
                rationale: { type:"string" }
              },
              required:["partNo","qty","rationale"]
            }
          },
          confidence: { type:"number", minimum:0, maximum:1 }
        },
        required:["label","positioning","description","pros","cons","best_for","items","confidence"]
      }
    },
    overall_confidence: { type:"number", minimum:0, maximum:1 },
    common_notes: { type:["string","null"] }
  },
  required:["variants","overall_confidence"]
};
const SELECT_PROMPT_HEADER = `스마텍 제품 선정 전문가. 1~2 variants 제안을 select_products 도구로 반환.

규칙:
1. partNo 는 제공된 후보 JSON 내 값만 사용. 존재하지 않는 Part No 생성 금지.
2. 단일 해석 명확 → variants 1개. 해석 여지/트레이드오프 있으면 2개까지만 (표준 vs 대안 구조).
3. 각 variant 는 서로 다른 positioning (표준/고사양/경제형 등). 단순 수량 차이는 variant 아님.
4. pros/cons/best_for 반드시 작성. 관점 중복 금지.
5. 후보 JSON 의 't' 타입 필드 참고 → 완결 시스템 (펌프+부스터+터보+컨트롤러+밸브 등 필요한 것).
6. 명시 모델 최우선. 수량 명시 반영, 없으면 1.
7. 정보 부족 시 confidence 낮추고 common_notes 에 기재.
8. 출력 select_products 1회.`;

/* ============================================================
   Agent 2.5 — 자가검증
============================================================ */
const VERIFY_SCHEMA = {
  type:"object",
  properties:{
    per_variant: {
      type:"array",
      items:{
        type:"object",
        properties:{
          variant_label: { type:"string" },
          verdict: { type:"string", enum:["pass","needs_fix","insufficient_info"] },
          issues: { type:"array", items:{ type:"string" } },
          missing_accessories: { type:"array", items:{ type:"string" } },
          adjusted_confidence: { type:"number", minimum:0, maximum:1 },
          explanation: { type:"string" }
        },
        required:["variant_label","verdict","adjusted_confidence","explanation"]
      }
    },
    global_verdict: { type:"string", enum:["ok","needs_clarification"] },
    clarification_reasons: { type:"array", items:{ type:"string" } }
  },
  required:["per_variant","global_verdict"]
};
const VERIFY_PROMPT = `스마텍 선임 엔지니어로 제안된 견적안을 감수. verify_proposal 1회 반환.

각 variant 검증:
- 요구사항(진공도·공정·수량·특수조건) 충족?
- 필수 부속 누락? (컨트롤러·케이블·배관 밸브)
- 물리·공학적 타당? (고진공에 로터리만, 오일프리에 오일펌프 등 모순)
- 과잉·중복?

Verdict: pass / needs_fix (수정 가능, issues 명시) / insufficient_info (정보 부족)
insufficient_info 1개 이상이면 global_verdict=needs_clarification, clarification_reasons 기재.
adjusted_confidence 0~1 재조정.`;

/* ============================================================
   Agent Q — 명확화 질문 메일
============================================================ */
const ASK_SCHEMA = {
  type:"object",
  properties:{
    subject: { type:"string" },
    body_text: { type:"string" },
    asked_fields: { type:"array", items:{ type:"string" } },
    confidence: { type:"number", minimum:0, maximum:1 }
  },
  required:["subject","body_text","asked_fields"]
};
const ASK_PROMPT = `스마텍 영업 담당자. 고객에게 정중한 추가 문의 메일을 작성. ask_clarification 1회 반환.

구성:
1) 인사 "안녕하세요, ○○○님." (고객명 확인되면)
2) 감사 + 정확한 견적 위해 확인 필요한다는 뉘앙스
3) 3~5개 구체 질문 (reasons 기반):
   - 공정/용도 상세
   - 진공도 목표 (mbar/Torr)
   - 가동 조건 (주당 시간, 연속 여부)
   - 수량·납기
   - 특수 요건 (오일프리/저소음 등)
4) "회신 주시면 최적 구성 2안 내 제안드리겠습니다" 1문장
5) 서명 블록 (그대로):

(주)스마텍 | Edwards 공식대리점
대표 이명재
T. 031-204-7170  M. 010-3194-7170  F. 031-206-7178
E. rokmclmj@gmail.com  W. smartechvacuum.com
경기 수원시 영통구 신원로 55, 907호

규칙:
- 존댓말, B2B 톤, 300~500자.
- 영문 원문이면 영문.
- subject: "RE: <요약> - 추가 문의" 또는 "견적 진행을 위한 추가 문의드립니다".
- asked_fields 에 질문 키워드 3~5개.`;

/* ============================================================
   Agent R — mock 가상 고객 회신 (시뮬레이션)
============================================================ */
const MOCK_REPLY_SCHEMA = {
  type:"object",
  properties:{
    body_text: { type:"string" },
    persona_note: { type:"string" },
    confidence: { type:"number", minimum:0, maximum:1 }
  },
  required:["body_text","persona_note"]
};
const MOCK_REPLY_PROMPT = `테스트용 '가상 고객' 역할. 원본 문의 + 스마텍 추가 질문을 읽고 고객 입장에서 자연스러운 회신 작성. simulate_customer_reply 1회 반환.

- 각 질문에 합리적으로 답변. 현실적 수준.
- 3~6문장, 가벼운 인사 포함.
- 원문 언어와 동일 언어.
- persona_note: "이 회신은 LLM 시뮬레이션 가상 데이터입니다."`;

/* ============================================================
   Agent 3 — 회신 초안
============================================================ */
const REPLY_SCHEMA = {
  type:"object",
  properties:{
    subject: { type:"string" },
    body_text: { type:"string" },
    answered_questions: { type:"array", items:{ type:"string" } },
    open_questions: { type:"array", items:{ type:"string" } },
    confidence: { type:"number", minimum:0, maximum:1 }
  },
  required:["subject","body_text","answered_questions","open_questions","confidence"]
};
const REPLY_PROMPT = `스마텍 영업 담당자. 고객 이메일에 정중한 회신 초안 작성. draft_reply 1회 반환.

1) 인사 "안녕하세요, ○○○님."
2) 수령 감사 1문장
3) 고객 질문 답변 (불확실=확인 후 별도 안내, open_questions 기록)
4) 견적 요약 품명(한글) + 수량 1~3줄. 금액은 "별도 견적서 참조".
5) "추가 문의 환영" 1문장
6) 서명 블록:

(주)스마텍 | Edwards 공식대리점
대표 이명재
T. 031-204-7170  M. 010-3194-7170  F. 031-206-7178
E. rokmclmj@gmail.com  W. smartechvacuum.com
경기 수원시 영통구 신원로 55, 907호

존댓말 250~500자. 영문이면 영문 + 영문 서명. 할인율/등급 직접 언급 금지. subject: "RE: <요약>" 또는 "견적 회신 - ○○○님".`;

/* ============================================================
   Claude 프록시 호출 (temperature 0 기본)
============================================================ */
async function callTool(toolName, schema, systemPrompt, userText, opts={}){
  if(!window.MK_USER) throw new Error("로그인이 필요합니다.");
  const j = await mkCallClaude({
    model: getModel(),
    max_tokens: opts.max_tokens || 2048,
    temperature: opts.temperature != null ? opts.temperature : 0,
    tools: [{ name: toolName, description: toolName, input_schema: schema }],
    tool_choice: { type:"tool", name: toolName },
    messages: [{
      role:"user",
      content: [
        { type:"text", text: systemPrompt },
        { type:"text", text: userText }
      ]
    }]
  });
  const blk = (j.content||[]).find(c=>c.type==="tool_use" && c.name===toolName);
  if(!blk) throw new Error(toolName+" 응답에서 도구 호출을 찾지 못했습니다.");
  return { data: blk.input, usage: j.usage, model: j.model };
}

/* ============================================================
   사전 스캔 · 기존 고객 매칭
============================================================ */
function preScanEmailText(text){
  const emails = (String(text||"").match(/[\w.+\-]+@[\w\-]+\.[\w.\-]+/g) || []).map(e=>e.toLowerCase());
  const lines = String(text||"").split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const companies = [];
  const companyRx = /(\(주\)|㈜|주식회사|Co\.?\s?,?\s?Ltd\.?|\bInc\.?|Corporation|Corp\.?|GmbH|Limited)/i;
  lines.forEach(l => { if(companyRx.test(l) && l.length < 80) companies.push(l); });
  return { emails: [...new Set(emails)], companies };
}

function matchExistingClient(input){
  const list = (typeof MK_CLIENTS !== "undefined") ? MK_CLIENTS : (window.MK_CLIENTS || []);
  if(!list || !list.length) return null;
  const norm = s => (s||"").toLowerCase().replace(/[\s()㈜·,./\-]/g,"").replace(/\(주\)|주식회사|coltd|co\.,ltd|inc|corporation|corp|gmbh|limited/gi,"");

  const emailList = [];
  const companyList = [];
  if(input && (Array.isArray(input.emails) || Array.isArray(input.companies))){
    (input.emails||[]).forEach(e => emailList.push((e||"").trim().toLowerCase()));
    (input.companies||[]).forEach(c => companyList.push(c));
  } else if(input){
    if(input.email) emailList.push((input.email||"").trim().toLowerCase());
    if(input.company) companyList.push(input.company);
  }

  for(const e of emailList){
    if(!e) continue;
    const hit = list.find(c => (c.email||"").trim().toLowerCase() === e);
    if(hit) return hit;
  }
  for(const e of emailList){
    if(!e || !e.includes("@")) continue;
    const domain = e.split("@")[1];
    for(const co of companyList){
      const coNorm = norm(co);
      if(coNorm.length < 3) continue;
      const hit = list.find(c => (c.email||"").toLowerCase().endsWith("@"+domain) && norm(c.company).includes(coNorm.slice(0,4)));
      if(hit) return hit;
    }
    const hit = list.find(c => (c.email||"").toLowerCase().endsWith("@"+domain));
    if(hit) return hit;
  }
  for(const co of companyList){
    const coNorm = norm(co);
    if(coNorm.length < 3) continue;
    const exact = list.find(c => norm(c.company) === coNorm);
    if(exact) return exact;
    if(coNorm.length >= 5){
      const partial = list.find(c => {
        const cn = norm(c.company);
        return cn && (cn.includes(coNorm) || coNorm.includes(cn));
      });
      if(partial) return partial;
    }
  }
  return null;
}

/* ============================================================
   에스컬레이션 판정 — 아주 짧거나 핵심 정보 전무 시
============================================================ */
function shouldEscalate(email, reqs){
  const body = String(email||"").trim();
  // 본문이 너무 짧고 이메일/전화 외에 쓸만한 정보 없음
  const strippedLen = body.replace(/[\s\r\n]+/g," ").length;
  const hasEmailOnly = /^.{0,80}$/s.test(body) && /@/.test(body);
  if(strippedLen < MK_ESCALATE_LEN_MIN) return true;
  if(hasEmailOnly) return true;
  // Agent 1.5 추출 결과가 모두 비어있고 confidence 매우 낮음
  if(reqs){
    const allEmpty = (!reqs.models_mentioned?.length) && (!reqs.processes?.length)
                  && (!reqs.applications?.length) && (!reqs.accessories_needed?.length)
                  && !reqs.vacuum_level;
    if(allEmpty && (reqs.confidence ?? 1) < MK_ESCALATE_CONF_MAX) return true;
  }
  return false;
}

/* ============================================================
   명확화 라운드 관리 — 상한 도달 시 force-proceed
============================================================ */
async function decideClarifyOrForce(sessionId, reasons){
  let round = 0;
  if(sessionId){
    const sess = await loadSession(sessionId);
    round = sess?.clarify_rounds || 0;
  }
  if(round >= MK_MAX_CLARIFY_ROUNDS){
    return {
      force: true,
      forceReason: `명확화 ${round}회 수행 후에도 정보가 부족합니다. 현재 정보로 최선 추정 견적을 생성합니다. 영업 검토 후 발송 권장.`,
      reasons,
    };
  }
  return { force: false, nextRound: round + 1 };
}

/* ============================================================
   명확화 트리거 판별
============================================================ */
function needsClarification(reqs, products, verify){
  const reasons = [];
  if(reqs){
    if((reqs.confidence ?? 1) < 0.5) reasons.push("요구사항 추출 신뢰도 낮음 (Agent 1.5).");
    const empty = (!reqs.models_mentioned?.length) && (!reqs.processes?.length) && (!reqs.applications?.length);
    if(empty) reasons.push("구체 모델·공정·용도가 전혀 파악되지 않음.");
  }
  if(products){
    if((products.overall_confidence ?? 1) < 0.5) reasons.push("제품 선정 신뢰도 낮음 (Agent 2).");
  }
  if(verify){
    if(verify.global_verdict === "needs_clarification") reasons.push("자가검증: 정보 부족.");
    (verify.clarification_reasons||[]).forEach(r => reasons.push(r));
    (verify.per_variant||[]).forEach(v => { if(v.verdict === "insufficient_info") reasons.push(`"${v.variant_label}" — ${v.explanation}`); });
  }
  const unique = [...new Set(reasons)];
  return { needed: unique.length > 0, reasons: unique };
}

/* ============================================================
   세션 DB 헬퍼
============================================================ */
async function createSession({ originalEmail, clarification, matchedClientId }){
  if(!window.MK_USER) return null;
  const { data, error } = await window.MK_SB.from("smartech_email_sessions").insert({
    user_id: window.MK_USER.id,
    status: "pending_reply",
    original_email: originalEmail,
    clarification: clarification || null,
    matched_client_id: matchedClientId || null,
  }).select().single();
  if(error){ console.warn("session create", error); return null; }
  return data;
}
async function updateSession(id, patch){
  if(!window.MK_USER || !id) return null;
  const { data, error } = await window.MK_SB.from("smartech_email_sessions").update(patch).eq("id", id).select().single();
  if(error){ console.warn("session update", error); return null; }
  return data;
}
async function loadPendingSessions(){
  if(!window.MK_USER) return [];
  const { data, error } = await window.MK_SB.from("smartech_email_sessions")
    .select("*").eq("status","pending_reply").order("updated_at", { ascending:false }).limit(20);
  if(error){ console.warn("sessions load", error); return []; }
  return data || [];
}
async function loadSession(id){
  if(!window.MK_USER || !id) return null;
  const { data, error } = await window.MK_SB.from("smartech_email_sessions").select("*").eq("id", id).maybeSingle();
  if(error){ console.warn("session load", error); return null; }
  return data;
}

/* ============================================================
   메인 파이프라인
============================================================ */
async function runEmailAgents(opts={}){
  const emailOverride = opts.emailOverride;
  const existingSessionId = opts.sessionId || null;
  const skipAgent1Hint = opts.skipAgent1 === true;

  const email = (emailOverride || document.getElementById("emailBody").value || "").trim();
  const out = document.getElementById("emailResult");
  if(!email){ out.innerHTML = `<div class="email-err">메일 본문을 붙여넣으세요.</div>`; return; }
  if(!window.MK_USER){ out.innerHTML = `<div class="email-err">로그인이 필요합니다.</div>`; return; }

  MK_CURRENT_SESSION_ID = existingSessionId;

  out.innerHTML = `<div class="email-step"><strong>사전 조회</strong> · 기존 고객 DB 확인 중…</div>`;
  const preHints = preScanEmailText(email);
  const preMatched = matchExistingClient(preHints);

  let g1 = null, gradeData;
  if(preMatched || skipAgent1Hint){
    const mc = preMatched;
    if(mc){
      out.innerHTML += `<div class="email-step"><strong>기존 고객 발견</strong> · ${escapeHtml(mc.company||"")} — 저장된 등급 <b>${mc.grade||"dealer"}</b> 적용 · Agent 1 생략</div>`;
    }
    gradeData = {
      grade: (mc?.grade) || "dealer",
      confidence: mc ? 1.0 : 0.6,
      rationale: mc
        ? `기존 고객 DB 매칭 (회사: ${mc.company||""} / 이메일: ${mc.email||""}). 저장된 등급 사용, 분류 Agent 생략.`
        : "재분석 단계 — 기존 분류 유지.",
      signals: mc ? [
        mc.email ? ("email: "+mc.email) : null,
        mc.company ? ("company: "+mc.company) : null
      ].filter(Boolean) : [],
      customer: mc ? {
        company: mc.company || null, contact: mc.contact || null, title:   mc.title || null,
        phone:   mc.mobile || mc.office || mc.phone || null,
        email:   mc.email || (preHints.emails[0] || null), address: mc.address || null,
      } : {
        company: null, contact: null, title: null,
        phone: null, email: preHints.emails[0] || null, address: null,
      },
      subject_summary: null,
      _existing_client: mc || null,
    };
  } else {
    out.innerHTML += `<div class="email-step"><strong>신규 고객</strong> · Agent 1 실행 중…</div>`;
    try{
      g1 = await callTool("classify_grade", CLASSIFY_SCHEMA, CLASSIFY_PROMPT,
        "---- 메일 본문 ----\n" + email);
    }catch(e){
      out.innerHTML = `<div class="email-err">Agent 1 실패: ${escapeHtml(e.message||String(e))}</div>`;
      return;
    }
    gradeData = g1.data;
    const postMatch = matchExistingClient(gradeData.customer);
    if(postMatch){
      gradeData._agent_grade = gradeData.grade;
      gradeData._agent_confidence = gradeData.confidence;
      gradeData.grade = postMatch.grade || gradeData.grade;
      gradeData.confidence = 1.0;
      gradeData._existing_client = postMatch;
      gradeData.rationale = `[Agent 1 후 기존 고객 발견] ${postMatch.company||""} — 저장된 등급(${postMatch.grade}) 적용. 원 Agent: ${gradeData._agent_grade} (${Math.round((gradeData._agent_confidence||0)*100)}%) · ` + (gradeData.rationale||"");
      out.innerHTML += `<div class="email-step"><strong>사후 매칭</strong> · ${escapeHtml(postMatch.company||"")} 발견, 등급 ${postMatch.grade} 적용</div>`;
    }
  }

  out.innerHTML += `<div class="email-step"><strong>Agent 1.5</strong> · 요구사항 구조화 중…</div>`;
  let reqsData = null;
  try{
    const gr = await callTool("extract_requirements", REQS_SCHEMA, REQS_PROMPT,
      "---- 메일 본문 ----\n" + email);
    reqsData = gr.data;
  }catch(e){ console.warn("Agent 1.5 실패(진행):", e); }

  // ── 에스컬레이션 판정 (너무 빈약 → 이명재 대표에게) ──
  if(shouldEscalate(email, reqsData) && !opts.forceProceed){
    out.innerHTML += `<div class="email-step"><strong>에스컬레이션</strong> · 판단 가능한 정보가 거의 없어 담당자 확인 필요</div>`;
    return enterEscalationMode(email, gradeData, reqsData, existingSessionId);
  }

  // ── 명확화 판정 (라운드 상한 적용) ──
  const earlyCheck = needsClarification(reqsData, null, null);
  if(earlyCheck.needed && !opts.forceProceed){
    const decided = await decideClarifyOrForce(existingSessionId, earlyCheck.reasons);
    if(decided.force){
      out.innerHTML += `<div class="email-step"><strong>⚠ 명확화 상한 도달</strong> · ${escapeHtml(decided.forceReason)}</div>`;
      opts._autoForced = { reasons: decided.reasons, forceReason: decided.forceReason };
    } else {
      out.innerHTML += `<div class="email-step"><strong>명확화 판단</strong> · 정보 부족, Agent 2 생략</div>`;
      return enterClarificationMode(email, gradeData, reqsData, earlyCheck.reasons, existingSessionId, decided.nextRound);
    }
  }

  const candidates = prefilterCatalog(email, reqsData);
  const compact = compactProducts(candidates);
  out.innerHTML += `<div class="email-step"><strong>사전필터</strong> · ${compact.length}개 (family+type 그룹핑, 도메인 하드필터)</div>`;

  if(!compact.length){
    const decided = await decideClarifyOrForce(existingSessionId, ["메일에서 제품 단서가 발견되지 않음."]);
    if(decided.force){
      // 후보 없으면 Agent 2 실행 불가 → 에스컬레이션으로
      return enterEscalationMode(email, gradeData, reqsData, existingSessionId);
    }
    return enterClarificationMode(email, gradeData, reqsData, ["메일에서 제품 단서가 발견되지 않음."], existingSessionId, decided.nextRound);
  }

  out.innerHTML += `<div class="email-step"><strong>Agent 2</strong> · 1~2 variants 제품 선정 중…</div>`;
  let g2;
  try{
    const userText =
      "[고객 등급] " + gradeData.grade + "\n\n" +
      "[Agent 1.5 요구사항]\n" + JSON.stringify(reqsData||{}) + "\n\n" +
      "[메일 본문]\n" + email + "\n\n" +
      "[후보 카탈로그 JSON: p,d,s,f,t]\n" + JSON.stringify(compact) + "\n\n" +
      "해석 여지 없으면 1안, 있으면 2안까지만.";
    g2 = await callTool("select_products", SELECT_SCHEMA, SELECT_PROMPT_HEADER, userText, { max_tokens: 3072 });
  }catch(e){
    out.innerHTML += `<div class="email-err">Agent 2 실패: ${escapeHtml(e.message||String(e))}</div>`;
    return;
  }
  const productsData = g2.data;

  out.innerHTML += `<div class="email-step"><strong>Agent 2.5</strong> · 자가검증 중…</div>`;
  let verifyData = null;
  try{
    const verifyInput =
      "[요구사항]\n" + JSON.stringify(reqsData||{}) + "\n\n" +
      "[제안 variants]\n" + JSON.stringify(productsData.variants||[]) + "\n\n" +
      "[후보 타입 분포]\n" + JSON.stringify(summarizeByType(candidates));
    const gv = await callTool("verify_proposal", VERIFY_SCHEMA, VERIFY_PROMPT, verifyInput);
    verifyData = gv.data;
  }catch(e){ console.warn("Agent 2.5 실패(진행):", e); }

  const verifyCheck = needsClarification(reqsData, productsData, verifyData);
  if(verifyCheck.needed && !opts.forceProceed && !opts._autoForced){
    const decided = await decideClarifyOrForce(existingSessionId, verifyCheck.reasons);
    if(decided.force){
      out.innerHTML += `<div class="email-step"><strong>⚠ 명확화 상한 도달</strong> · ${escapeHtml(decided.forceReason)}</div>`;
      opts._autoForced = { reasons: decided.reasons, forceReason: decided.forceReason };
    } else {
      out.innerHTML += `<div class="email-step"><strong>자가검증</strong> · 정보 부족, 명확화 모드 전환</div>`;
      return enterClarificationMode(email, gradeData, reqsData, verifyCheck.reasons, existingSessionId, decided.nextRound);
    }
  }

  // auto-forced 경고를 productsData.common_notes 에 prepend
  if(opts._autoForced){
    const prev = productsData.common_notes ? String(productsData.common_notes) : "";
    productsData.common_notes =
      `⚠ [명확화 상한 도달] ${opts._autoForced.forceReason}\n확인 필요: ${(opts._autoForced.reasons||[]).join(" · ")}` +
      (prev ? `\n\n${prev}` : "");
  }

  out.innerHTML += `<div class="email-step"><strong>Agent 3</strong> · 회신 초안 작성 중…</div>`;
  let g3 = null;
  try{
    const firstV = (productsData.variants && productsData.variants[0]) || { items: [] };
    g3 = await runReplyAgent(email, gradeData, firstV);
  }catch(e){ console.warn("Agent 3 실패(진행):", e); }

  try{
    renderEmailProposal(gradeData, productsData, verifyData, g1, g2, g3, reqsData);
  }catch(e){
    console.error("renderEmailProposal error", e);
    out.innerHTML += `<div class="email-err">렌더링 오류: ${escapeHtml(e.message||String(e))}</div>
      <pre class="ocr-raw" style="margin-top:8px">${escapeHtml(JSON.stringify({ agent1: gradeData, agent2: productsData, verify: verifyData }, null, 2))}</pre>`;
  }

  if(existingSessionId){
    updateSession(existingSessionId, {
      status: "completed",
      last_proposal: {
        grade: gradeData.grade,
        variants_count: (productsData.variants||[]).length,
        overall_confidence: productsData.overall_confidence,
      }
    });
    renderPendingSessions();
  }
}

/* ============================================================
   명확화 모드 진입
============================================================ */
async function enterClarificationMode(email, gradeData, reqsData, reasons, existingSessionId, newRound){
  const out = document.getElementById("emailResult");
  out.innerHTML += `<div class="email-step"><strong>Agent Q</strong> · 고객에게 보낼 추가 문의 메일 작성 중…</div>`;

  let askData = null;
  try{
    const input =
      "[추출된 요구사항]\n" + JSON.stringify(reqsData||{}) + "\n\n" +
      "[명확화 이유]\n" + (reasons||[]).map(r=>"- "+r).join("\n") + "\n\n" +
      "[원문 메일]\n" + email + "\n\n" +
      "[고객 이름]\n" + (gradeData.customer?.contact || "");
    const ga = await callTool("ask_clarification", ASK_SCHEMA, ASK_PROMPT, input);
    askData = ga.data;
  }catch(e){
    out.innerHTML += `<div class="email-err">Agent Q 실패: ${escapeHtml(e.message||String(e))}</div>`;
    return;
  }

  let sessionId = existingSessionId;
  const mcId = gradeData._existing_client?.id || null;
  const roundToSave = (typeof newRound === "number") ? newRound : 1;
  if(!sessionId){
    const sess = await createSession({ originalEmail: email, clarification: askData, matchedClientId: mcId });
    sessionId = sess?.id || null;
    if(sessionId) await updateSession(sessionId, { clarify_rounds: roundToSave });
  } else {
    await updateSession(sessionId, { clarification: askData, status: "pending_reply", clarify_rounds: roundToSave });
  }
  MK_CURRENT_SESSION_ID = sessionId;

  renderClarificationCard(gradeData, reqsData, askData, reasons, sessionId, roundToSave);
  renderPendingSessions();
}

/* ============================================================
   에스컬레이션 모드 — 이명재 대표에게 넘김
============================================================ */
async function enterEscalationMode(email, gradeData, reqsData, existingSessionId){
  const out = document.getElementById("emailResult");
  out.innerHTML += `<div class="email-step"><strong>Agent E</strong> · 담당자(이명재 대표) 전달용 정중 안내 작성 중…</div>`;

  const input =
    "[원문 메일]\n" + email + "\n\n" +
    "[추출 요구사항(있다면)]\n" + JSON.stringify(reqsData||{}) + "\n\n" +
    "지침:\n" +
    "- 이 문의는 정보가 너무 부족하여 자동 답변이 어렵습니다.\n" +
    "- 고객에게 보낼 간결한 안내 메일을 작성하십시오 — \"문의 감사 + 정확한 답변을 위해 담당 대표이사(이명재)가 직접 확인 후 회신드리겠습니다\" 톤.\n" +
    "- 3~5문장. 과한 사과 금지. 신속 응대 약속 1문장.\n" +
    "- 서명 블록은 ASK_PROMPT 와 동일 형식으로.\n" +
    "- subject 는 'RE: <요약> - 담당자 확인 후 회신드립니다' 또는 유사.";
  let askData = null;
  try{
    const ga = await callTool("ask_clarification", ASK_SCHEMA, ASK_PROMPT + "\n\n" + input, input);
    askData = ga.data;
  }catch(e){
    askData = {
      subject: "문의해주셔서 감사합니다 - 담당자 확인 후 회신드립니다",
      body_text: "안녕하세요.\n\n문의해주셔서 감사합니다. 정확한 답변을 위해 담당 대표이사(이명재)께서 직접 확인 후 빠르게 회신드리도록 하겠습니다. 번거로우시겠지만 잠시만 기다려 주십시오.\n\n(주)스마텍 | Edwards 공식대리점\n대표 이명재\nT. 031-204-7170  M. 010-3194-7170",
      asked_fields: [],
      confidence: 0.8,
    };
  }

  // 세션 저장 — escalated 상태로 completed 처리
  let sessionId = existingSessionId;
  const mcId = gradeData._existing_client?.id || null;
  if(!sessionId){
    const sess = await createSession({ originalEmail: email, clarification: askData, matchedClientId: mcId });
    sessionId = sess?.id || null;
  }
  if(sessionId){
    await updateSession(sessionId, {
      clarification: askData,
      status: "abandoned",
      last_proposal: { escalated: true, to: "rokmclmj@gmail.com" }
    });
  }
  MK_CURRENT_SESSION_ID = sessionId;

  renderEscalationCard(gradeData, email, askData);
  renderPendingSessions();
}

function renderEscalationCard(gradeData, email, ask){
  const out = document.getElementById("emailResult");
  const to = gradeData?.customer?.email || "";
  const subj = ask?.subject || "문의해주셔서 감사합니다 - 담당자 확인 후 회신드립니다";
  const body = ask?.body_text || "";
  out.innerHTML = `
    <div class="escalate-card">
      <div class="clarify-head">
        <span class="pill pill-err">에스컬레이션</span>
        <span class="muted" style="font-size:11px">→ 이명재 대표 (rokmclmj@gmail.com · 010-3194-7170)</span>
      </div>
      <div class="email-rationale" style="border-left-color:#B3261E">
        <strong>자동 판단 불가.</strong> 메일 정보만으로는 적합한 견적을 생성하기 어려운 문의입니다.
        고객에게는 "담당자 직접 회신" 안내를 보내고, 영업 담당(이명재 대표)이 직접 검토하도록 넘깁니다.
      </div>

      <div class="section-title" style="margin-top:22px">고객 안내 메일 (복사/발송)</div>
      <div class="clarify-meta">
        <label>수신</label><input type="text" id="escTo" value="${escapeHtml(to)}" placeholder="고객 이메일">
        <label>제목</label><input type="text" id="escSubject" value="${escapeHtml(subj)}">
      </div>
      <textarea id="escBody" class="email-body" rows="10">${escapeHtml(body)}</textarea>
      <div class="btn-row">
        <button class="btn" onclick="copyEscalationReply()">고객 안내 복사</button>
        <button class="btn" onclick="openEscalationMailto()">고객에게 메일 앱 열기</button>
      </div>

      <div class="section-title" style="margin-top:28px">이명재 대표 인계 메모</div>
      <textarea class="email-body" rows="8" readonly>안녕하세요, 대표님.

아래 고객 문의는 자동 판정이 어려워 에스컬레이션 드립니다. 직접 확인 후 회신 부탁드립니다.

고객: ${escapeHtml(gradeData?.customer?.company||"")} / ${escapeHtml(gradeData?.customer?.contact||"")}
연락처: ${escapeHtml(gradeData?.customer?.email||"")} · ${escapeHtml(gradeData?.customer?.phone||"")}

— 원문 메일 —
${escapeHtml(email)}
</textarea>
      <div class="btn-row">
        <button class="btn" onclick="copyEscalationBrief()">대표 인계 메모 복사</button>
        <button class="btn primary" onclick="openEscalationToRep()">대표(rokmclmj@gmail.com) 메일 앱 열기</button>
        <button class="btn" onclick="clearEmailInput()">닫기</button>
      </div>
    </div>`;
}

function copyEscalationReply(){
  const to = document.getElementById("escTo")?.value || "";
  const subj = document.getElementById("escSubject")?.value || "";
  const body = document.getElementById("escBody")?.value || "";
  navigator.clipboard.writeText(`To: ${to}\nSubject: ${subj}\n\n${body}`).then(()=>alert("고객 안내 메일이 클립보드에 복사되었습니다."));
}
function openEscalationMailto(){
  openMailCompose({
    to: document.getElementById("escTo")?.value || "",
    subject: document.getElementById("escSubject")?.value || "",
    body: document.getElementById("escBody")?.value || "",
  });
}
function copyEscalationBrief(){
  const ta = document.querySelectorAll(".escalate-card textarea")[1];
  if(!ta) return;
  navigator.clipboard.writeText(ta.value).then(()=>alert("대표 인계 메모가 복사되었습니다."));
}
function openEscalationToRep(){
  const ta = document.querySelectorAll(".escalate-card textarea")[1];
  openMailCompose({
    to: "rokmclmj@gmail.com",
    subject: "[에스컬레이션] 고객 문의 — 대표 확인 요청",
    body: ta ? ta.value : "",
  });
}

/* ============================================================
   Agent 3 회신 초안
============================================================ */
async function runReplyAgent(emailBody, gradeData, variant){
  const items = (variant?.items || []).map(it=>{
    const prod = ALL_PRODUCTS.find(p=>p.partNo===it.partNo);
    return prod ? { partNo: it.partNo, description: prod.description, qty: it.qty } : null;
  }).filter(Boolean);
  const payload =
    "[원문 메일]\n" + emailBody + "\n\n" +
    "[고객]\n" + JSON.stringify(gradeData.customer||{}) + "\n\n" +
    "[선정 품목 - " + (variant?.label||"") + "]\n" + items.map(i=>`- ${i.partNo} | ${i.description} × ${i.qty}`).join("\n");
  return await callTool("draft_reply", REPLY_SCHEMA, REPLY_PROMPT, payload);
}

/* ============================================================
   시뮬레이션 · mailto · 재분석
============================================================ */
async function simulateCustomerReply(){
  if(!MK_CURRENT_SESSION_ID){ alert("세션이 없습니다."); return; }
  const sess = await loadSession(MK_CURRENT_SESSION_ID);
  if(!sess){ alert("세션 로드 실패"); return; }
  const ta = document.getElementById("customerReplyBody");
  const note = document.getElementById("mockPersonaNote");
  if(ta) ta.value = "생성 중…";
  if(note) note.textContent = "";
  try{
    const input =
      "[원본 문의 메일]\n" + sess.original_email + "\n\n" +
      "[스마텍 추가 질문]\n제목: " + (sess.clarification?.subject||"") + "\n본문:\n" + (sess.clarification?.body_text||"");
    const gr = await callTool("simulate_customer_reply", MOCK_REPLY_SCHEMA, MOCK_REPLY_PROMPT, input, { temperature: 0.3 });
    if(ta) ta.value = gr.data.body_text || "";
    if(note) note.textContent = "※ " + (gr.data.persona_note || "");
  }catch(e){
    if(ta) ta.value = "";
    alert("시뮬레이션 실패: " + (e.message||String(e)));
  }
}

function openMailCompose({ to, subject, body }){
  const href = "mailto:" + encodeURIComponent(to||"") +
    "?subject=" + encodeURIComponent(subject||"") +
    "&body=" + encodeURIComponent(body||"");
  window.location.href = href;
}

async function reanalyzeWithReply(){
  const sessionId = MK_CURRENT_SESSION_ID;
  if(!sessionId){ alert("세션이 없습니다."); return; }
  const reply = (document.getElementById("customerReplyBody")?.value || "").trim();
  if(!reply){ alert("고객 회신을 붙여넣어주세요."); return; }

  const sess = await loadSession(sessionId);
  if(!sess){ alert("세션 로드 실패"); return; }

  const merged =
    "[원본 문의 메일]\n" + sess.original_email + "\n\n" +
    "[스마텍 추가 질문]\n" + (sess.clarification?.body_text||"") + "\n\n" +
    "[고객 회신]\n" + reply;

  await updateSession(sessionId, { customer_reply: reply, merged_email: merged });
  await runEmailAgents({ emailOverride: merged, sessionId, skipAgent1: !!sess.matched_client_id });
}

function forceProceedBypass(){
  const email = (document.getElementById("emailBody").value || "").trim();
  if(!email){ alert("메일 본문이 비어있습니다."); return; }
  runEmailAgents({ forceProceed: true });
}

async function cancelClarification(){
  if(MK_CURRENT_SESSION_ID){
    await updateSession(MK_CURRENT_SESSION_ID, { status: "abandoned" });
  }
  clearEmailInput();
  renderPendingSessions();
}

async function continueSession(sessionId){
  const sess = await loadSession(sessionId);
  if(!sess){ alert("세션을 찾을 수 없습니다."); return; }
  MK_CURRENT_SESSION_ID = sessionId;
  const ta = document.getElementById("emailBody");
  if(ta) ta.value = sess.original_email || "";
  const gradeData = {
    grade: "dealer", confidence: 0.6, rationale: "(세션 복원)", signals: [],
    customer: { company:null, contact:null, title:null, phone:null, email:null, address:null },
    _existing_client: sess.matched_client_id ? { id: sess.matched_client_id } : null
  };
  renderClarificationCard(gradeData, null, sess.clarification || {}, ["세션 이어가기 — 고객 회신을 붙여넣으세요."], sessionId);
  if(sess.customer_reply){
    const rta = document.getElementById("customerReplyBody");
    if(rta) rta.value = sess.customer_reply;
  }
}

/* ============================================================
   대기 세션 리스트 렌더
============================================================ */
async function renderPendingSessions(){
  const wrap = document.getElementById("pendingSessions");
  if(!wrap) return;
  const list = await loadPendingSessions();
  if(!list.length){ wrap.innerHTML = ""; return; }
  wrap.innerHTML = `
    <div class="card" style="border-left:3px solid #C7921F;background:#FFFAEF;padding:18px 22px">
      <div class="section-title" style="margin-top:0">회신 대기 중인 명확화 세션 <span class="pill" style="margin-left:8px">${list.length}</span></div>
      <table class="agent-review" style="width:100%">
        <thead><tr><th>업데이트</th><th>질문 제목</th><th>요청 항목</th><th style="width:70px">라운드</th><th style="width:160px"></th></tr></thead>
        <tbody>
        ${list.map(s=>{
          const dt = (s.updated_at||s.created_at||"").slice(0,16).replace("T"," ");
          const subj = s.clarification?.subject || "(제목 없음)";
          const fields = (s.clarification?.asked_fields||[]).join(", ");
          const r = s.clarify_rounds || 0;
          return `<tr>
            <td>${escapeHtml(dt)}</td>
            <td>${escapeHtml(subj)}</td>
            <td>${escapeHtml(fields)}</td>
            <td><span class="pill-soft">${r}/${MK_MAX_CLARIFY_ROUNDS}</span></td>
            <td style="text-align:right">
              <button class="add-btn" onclick="continueSession('${s.id}')">이어가기</button>
              <button class="del-btn" onclick="abandonSession('${s.id}')">폐기</button>
            </td>
          </tr>`;
        }).join("")}
        </tbody>
      </table>
    </div>`;
}

async function abandonSession(id){
  if(!confirm("이 세션을 폐기하시겠습니까?")) return;
  await updateSession(id, { status: "abandoned" });
  renderPendingSessions();
}

/* ============================================================
   명확화 카드 렌더
============================================================ */
function renderClarificationCard(grade, reqs, ask, reasons, sessionId, round){
  const out = document.getElementById("emailResult");
  const to = grade?.customer?.email || "";
  const subj = ask?.subject || "";
  const body = ask?.body_text || "";
  const asked = ask?.asked_fields || [];
  const r = round || 1;
  const isLastRound = r >= MK_MAX_CLARIFY_ROUNDS;
  out.innerHTML = `
    <div class="clarify-card">
      <div class="clarify-head">
        <span class="pill" style="background:#C7921F">추가 확인 필요</span>
        <span class="pill pill-soft">라운드 ${r}/${MK_MAX_CLARIFY_ROUNDS}</span>
        <span class="muted" style="font-size:11px">session: ${sessionId ? sessionId.slice(0,8) : "(미생성)"}</span>
      </div>
      ${isLastRound ? `<div class="email-notes"><strong>안내.</strong> 이번이 마지막 명확화 회차입니다. 다음 회신이 여전히 불명확하면 추가 질문 없이 현재 정보로 견적을 자동 생성합니다.</div>` : ""}
      <div class="email-rationale">
        <strong>명확화가 필요한 이유</strong>
        <ul style="margin-top:6px;margin-left:18px;font-size:12px;line-height:1.8">${(reasons||[]).map(r=>`<li>${escapeHtml(r)}</li>`).join("")}</ul>
      </div>

      <div class="section-title" style="margin-top:22px">Agent Q 가 작성한 추가 문의 메일</div>
      <div class="clarify-meta">
        <label>수신</label><input type="text" id="clarTo" value="${escapeHtml(to)}" placeholder="고객 이메일">
        <label>제목</label><input type="text" id="clarSubject" value="${escapeHtml(subj)}">
      </div>
      <textarea id="clarBody" class="email-body" rows="12">${escapeHtml(body)}</textarea>
      ${asked.length ? `<div class="muted" style="font-size:11px;margin-top:6px">질문 항목: ${asked.map(a=>`<span class="pill-soft">${escapeHtml(a)}</span>`).join(" ")}</div>` : ""}
      <div class="btn-row">
        <button class="btn" onclick="copyClarification()">복사</button>
        <button class="btn" onclick="openClarMailto()">메일 앱에서 열기</button>
        <button class="btn" onclick="forceProceedBypass()">그래도 견적 진행</button>
        <button class="btn" onclick="cancelClarification()">취소</button>
      </div>

      <div class="section-title" style="margin-top:28px">고객 회신</div>
      <div class="email-notes" style="margin-bottom:10px">
        <strong>⚠ 시뮬레이션 모드.</strong> 실제 메일 연결 전까지는 아래 수동 붙여넣기 또는 가상 회신 생성으로 테스트할 수 있습니다. 메일 연결 후에는 IMAP/Gmail 자동 수집으로 치환됩니다.
        <div id="mockPersonaNote" class="muted" style="margin-top:6px;font-size:11px"></div>
      </div>
      <textarea id="customerReplyBody" class="email-body" rows="8" placeholder="고객 회신 본문을 붙여넣으세요. 또는 아래 '가상 회신 생성' 버튼을 눌러 시뮬레이션하세요."></textarea>
      <div class="btn-row">
        <button class="btn" onclick="simulateCustomerReply()">🧪 시뮬레이션: 가상 고객 회신 생성</button>
        <button class="btn primary" onclick="reanalyzeWithReply()">회신 반영 후 재분석</button>
      </div>
    </div>`;
}

function copyClarification(){
  const subj = document.getElementById("clarSubject")?.value || "";
  const body = document.getElementById("clarBody")?.value || "";
  const to = document.getElementById("clarTo")?.value || "";
  const text = `To: ${to}\nSubject: ${subj}\n\n${body}`;
  navigator.clipboard.writeText(text).then(()=>alert("클립보드에 복사되었습니다."));
}
function openClarMailto(){
  openMailCompose({
    to: document.getElementById("clarTo")?.value || "",
    subject: document.getElementById("clarSubject")?.value || "",
    body: document.getElementById("clarBody")?.value || "",
  });
}

/* ============================================================
   견적 제안 카드 렌더 (variants 탭)
============================================================ */
function renderEmailProposal(grade, products, verify, meta1, meta2, meta3, reqsData){
  const variants = (products?.variants || []).slice(0,3);
  MK_ACTIVE_VARIANT = 0;
  const gradeLbl = ({dealer:"딜러 (Dealer)", oem:"OEM", enduser:"최종사용자 (End User)"})[grade.grade] || grade.grade;
  const conf1 = Math.round((grade.confidence||0)*100);
  const overall = Math.round((products?.overall_confidence||0)*100);

  const replyData = meta3?.data || null;
  const c = grade.customer || {};
  const customerRows = [
    ["회사", c.company], ["담당자", c.contact], ["직급", c.title],
    ["전화", c.phone], ["이메일", c.email], ["주소", c.address],
  ].filter(r=>r[1]);

  MK_EMAIL_PROPOSAL = {
    grade: grade.grade,
    customer: c,
    variants: variants.map(v => ({
      ...v,
      items: (v.items||[]).map(it=>{
        const prod = ALL_PRODUCTS.find(p=>p.partNo===it.partNo);
        return prod ? { ...it, prod } : null;
      }).filter(Boolean)
    })),
    verify: verify || null,
    reply_draft: replyData,
    existingClient: grade._existing_client || null,
    _emailBody: (document.getElementById("emailBody")?.value||"").trim(),
    _gradeRaw: grade,
    _productsRaw: products,
    _reqs: reqsData || null,
  };

  const out = document.getElementById("emailResult");
  const varTabs = variants.map((v,i)=>{
    const conf = Math.round((v.confidence||0)*100);
    const vVerify = (verify?.per_variant||[]).find(x=>x.variant_label===v.label);
    const badge = vVerify ? verdictBadge(vVerify.verdict) : "";
    return `<button class="variant-tab ${i===0?"active":""}" data-idx="${i}" onclick="setActiveVariant(${i})">
      <div class="vt-label">${escapeHtml(v.label)}</div>
      <div class="vt-meta"><span class="pill">${conf}%</span> ${badge}</div>
    </button>`;
  }).join("");

  out.innerHTML = `
    <div class="email-card">
      <div class="email-head">
        <div>
          <div class="section-title" style="border:none;padding:0;margin:0 0 6px">Agent 1 · 거래 등급</div>
          <div class="email-grade-val">${escapeHtml(gradeLbl)} <span class="pill">${grade._existing_client ? "기존 고객 적용" : "신뢰도 "+conf1+"%"}</span>${grade._existing_client ? ` <span class="muted" style="font-size:11px">· ${escapeHtml(grade._existing_client.company||"")}</span>` : ""}</div>
        </div>
        <div class="muted" style="font-size:11px;text-align:right">overall ${overall}% · variants ${variants.length}개</div>
      </div>
      <div class="email-rationale"><strong>근거.</strong> ${escapeHtml(grade.rationale||"")}</div>

      ${customerRows.length ? `
      <div class="section-title" style="margin-top:22px">추출된 고객 정보</div>
      <table class="agent-review"><tbody>
        ${customerRows.map(([k,v])=>`<tr><th>${k}</th><td>${escapeHtml(v)}</td></tr>`).join("")}
      </tbody></table>
      ` : ""}

      ${reqsData ? `
      <details class="email-details" style="margin-top:16px">
        <summary>Agent 1.5 추출 요구사항</summary>
        <pre class="ocr-raw">${escapeHtml(JSON.stringify(reqsData, null, 2))}</pre>
      </details>
      ` : ""}

      <div class="section-title" style="margin-top:28px">Agent 2 · 견적안 비교</div>
      <div class="variant-tabs">${varTabs}</div>
      <div id="variantPanel">${renderVariantPanel(variants[0], grade.grade, verify)}</div>

      ${products.common_notes && products.common_notes.startsWith("⚠ [명확화 상한 도달]")
        ? `<div class="email-err" style="margin-top:14px;white-space:pre-wrap">${escapeHtml(products.common_notes)}</div>`
        : (products.common_notes ? `<div class="email-notes" style="margin-top:14px"><strong>공통 참고.</strong> ${escapeHtml(products.common_notes)}</div>` : "")}

      <div id="replyDraftBlock">${replyData ? renderReplyDraft(replyData, variants[0]) : ""}</div>

      <div class="btn-row" style="margin-top:20px">
        <button class="btn primary" onclick="applyEmailProposal()">이 안으로 적용 · 견적서 작성</button>
        <button class="btn" onclick="regenerateReplyForVariant()">현재 안 기준 회신 재생성</button>
        <button class="btn" onclick="clearEmailInput()">취소</button>
      </div>
    </div>`;
}

function setActiveVariant(i){
  MK_ACTIVE_VARIANT = i;
  const variants = MK_EMAIL_PROPOSAL?.variants || [];
  const v = variants[i]; if(!v) return;
  document.querySelectorAll(".variant-tab").forEach(el=>el.classList.toggle("active", Number(el.dataset.idx)===i));
  const panel = document.getElementById("variantPanel");
  if(panel) panel.innerHTML = renderVariantPanel(v, MK_EMAIL_PROPOSAL.grade, MK_EMAIL_PROPOSAL.verify);
}

function renderVariantPanel(v, grade, verify){
  if(!v) return `<div class="no-match">variant 없음</div>`;
  const vVerify = (verify?.per_variant||[]).find(x=>x.variant_label===v.label);
  const gradeLbl = ({dealer:"Dealer", oem:"OEM", enduser:"End User"})[grade] || grade;
  const itemRows = (v.items||[]).map(it=>{
    const prod = it.prod || ALL_PRODUCTS.find(p=>p.partNo===it.partNo);
    if(!prod) return `<tr><td colspan="5" class="no-match">Part No ${escapeHtml(it.partNo)} — 카탈로그 없음</td></tr>`;
    const t = _ptype(prod);
    return `<tr>
      <td><span class="partno">${escapeHtml(prod.partNo)}</span><br>
          <span class="sheet-tag">${(prod.sheet||"").replace("2026 Price_","")}</span>
          <span class="sheet-tag">${escapeHtml(typeLabel(t))}</span></td>
      <td>${escapeHtml(prod.description)}</td>
      <td style="text-align:center">${it.qty}</td>
      <td class="price-cell">${fmt(priceForGrade(prod, grade))}원</td>
      <td>${escapeHtml(it.rationale||"")}</td>
    </tr>`;
  }).join("");

  const issues = (vVerify?.issues||[]).concat((vVerify?.missing_accessories||[]).map(x=>"누락 의심: "+x));

  return `
    <div class="variant-panel">
      <div class="vp-positioning">${escapeHtml(v.positioning||"")}</div>
      <p class="vp-desc">${escapeHtml(v.description||"")}</p>

      <div class="vp-procons">
        <div class="vp-pros">
          <div class="vp-h">장점</div>
          <ul>${(v.pros||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
        </div>
        <div class="vp-cons">
          <div class="vp-h">단점·유의점</div>
          <ul>${(v.cons||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
        </div>
      </div>
      ${v.best_for ? `<div class="vp-bestfor"><strong>적합 상황.</strong> ${escapeHtml(v.best_for)}</div>` : ""}

      ${vVerify ? `
      <div class="vp-verify ${vVerify.verdict}">
        <strong>자가검증:</strong> ${verdictLabel(vVerify.verdict)}
        · 조정 신뢰도 ${Math.round((vVerify.adjusted_confidence||0)*100)}%
        ${vVerify.explanation ? `<div class="muted" style="font-size:11px;margin-top:4px">${escapeHtml(vVerify.explanation)}</div>` : ""}
        ${issues.length ? `<ul style="margin-top:6px;margin-left:16px;font-size:12px">${issues.map(i=>`<li>${escapeHtml(i)}</li>`).join("")}</ul>` : ""}
      </div>` : ""}

      <table class="preview-table" style="margin-top:14px">
        <thead><tr>
          <th>Part No</th><th>품명</th><th style="width:60px;text-align:center">수량</th>
          <th style="width:120px;text-align:right">단가(${gradeLbl})</th><th>근거</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>`;
}

function verdictBadge(v){
  const m = { pass: "<span class='pill pill-ok'>PASS</span>",
              needs_fix: "<span class='pill pill-warn'>FIX</span>",
              insufficient_info: "<span class='pill pill-err'>INFO 부족</span>" };
  return m[v] || "";
}
function verdictLabel(v){
  const m = { pass: "통과", needs_fix: "수정 권장", insufficient_info: "정보 부족" };
  return m[v] || v;
}

/* ============================================================
   회신 초안 렌더 (Agent 3)
============================================================ */
function renderReplyDraft(reply, variant){
  if(!reply) return "";
  return `
    <details class="email-details" open style="margin-top:22px">
      <summary><strong>Agent 3 · 회신 초안</strong> ${variant ? `<span class="muted" style="font-size:11px;margin-left:6px">(기준: ${escapeHtml(variant.label)})</span>` : ""}</summary>
      <div class="clarify-meta">
        <label>제목</label><input type="text" id="replySubject" value="${escapeHtml(reply.subject||"")}">
      </div>
      <textarea id="replyBody" class="email-body" rows="10">${escapeHtml(reply.body_text||"")}</textarea>
      ${(reply.open_questions||[]).length ? `<div class="email-notes" style="margin-top:8px"><strong>영업 확인 필요.</strong> ${reply.open_questions.map(q=>escapeHtml(q)).join(" · ")}</div>` : ""}
      <div class="btn-row">
        <button class="btn" onclick="copyReplyDraft()">본문 복사</button>
      </div>
    </details>`;
}

function copyReplyDraft(){
  const s = document.getElementById("replySubject")?.value || "";
  const b = document.getElementById("replyBody")?.value || "";
  navigator.clipboard.writeText(`Subject: ${s}\n\n${b}`).then(()=>alert("회신 초안이 복사되었습니다."));
}

async function regenerateReplyForVariant(){
  if(!MK_EMAIL_PROPOSAL) return;
  const v = MK_EMAIL_PROPOSAL.variants[MK_ACTIVE_VARIANT];
  if(!v) return;
  try{
    const g3 = await runReplyAgent(MK_EMAIL_PROPOSAL._emailBody, MK_EMAIL_PROPOSAL._gradeRaw, v);
    MK_EMAIL_PROPOSAL.reply_draft = g3.data;
    const block = document.getElementById("replyDraftBlock");
    if(block) block.innerHTML = renderReplyDraft(g3.data, v);
  }catch(e){ alert("회신 재생성 실패: "+(e.message||e)); }
}

/* ============================================================
   적용
============================================================ */
async function applyEmailProposal(){
  if(!MK_EMAIL_PROPOSAL){ alert("적용할 제안이 없습니다."); return; }
  const v = MK_EMAIL_PROPOSAL.variants[MK_ACTIVE_VARIANT];
  if(!v){ alert("선택된 견적안이 없습니다."); return; }
  const { grade, customer, existingClient } = MK_EMAIL_PROPOSAL;

  try{ await autoSaveClient(customer, grade, existingClient); }
  catch(e){ console.warn("고객 자동 저장 실패(진행):", e); }

  if(customer){
    setIfExists("customerName", customer.company);
    const contact = [customer.contact, customer.title].filter(Boolean).join(" ").trim();
    setIfExists("contactPerson", contact);
    setIfExists("contactPhone", customer.phone);
    setIfExists("contactEmail", customer.email);
  }
  if(grade && typeof setGrade==="function") setGrade(grade);

  cart.length = 0;
  (v.items||[]).forEach(it=>{
    cart.push({ ...it.prod, qty: it.qty, customPrice: null });
  });
  renderCart();
  document.getElementById("cartCount").textContent = cart.reduce((s,i)=>s+i.qty, 0);

  window.MK_EMAIL_CONTEXT = {
    original: MK_EMAIL_PROPOSAL._emailBody || "",
    subject_summary: MK_EMAIL_PROPOSAL._gradeRaw?.subject_summary || "",
    reply_draft: MK_EMAIL_PROPOSAL.reply_draft || null,
    customer: MK_EMAIL_PROPOSAL.customer || {},
    variant: { label: v.label, positioning: v.positioning },
  };
  switchTab("quote");
}

async function autoSaveClient(customer, grade, existingClient){
  if(!window.MK_USER) return;
  if(!customer) return;
  const co = (customer.company||"").trim();
  const em = (customer.email||"").trim();
  if(!co && !em && !customer.contact) return;

  const payload = {
    company: co || null,
    contact: customer.contact || null,
    title: customer.title || null,
    phone: customer.phone || null,
    mobile: customer.phone && /^01[016789]/.test((customer.phone||"").replace(/[^\d]/g,"")) ? customer.phone : null,
    office: customer.phone && !/^01[016789]/.test((customer.phone||"").replace(/[^\d]/g,"")) ? customer.phone : null,
    email: em || null,
    address: customer.address || null,
    grade: grade || existingClient?.grade || "dealer",
  };
  const targetId = existingClient?.id;
  if(targetId){
    const patch = {};
    Object.keys(payload).forEach(k=>{ if(payload[k]!=null && payload[k]!=="") patch[k]=payload[k]; });
    if(existingClient?.grade) delete patch.grade;
    if(Object.keys(patch).length === 0) return;
    await window.MK_SB.from("smartech_clients").update(patch).eq("id", targetId);
  } else {
    await window.MK_SB.from("smartech_clients").insert({ ...payload, user_id: window.MK_USER.id });
  }
  if(typeof loadClients === "function") await loadClients();
}

function priceForGrade(p, grade){
  const g = grade==="dealer"?"dealer":grade==="oem"?"oem":"endUser";
  const m = (window.MK_SETTINGS?.multipliers?.[grade]) ?? 100;
  return Math.round(p[g]*m/100);
}

/* ============================================================
   초기화
============================================================ */
document.addEventListener("DOMContentLoaded", ()=>{
  const orig = window.MK_ON_AUTH;
  window.MK_ON_AUTH = async function(user){
    if(typeof orig === "function") await orig(user);
    renderPendingSessions();
  };
});
