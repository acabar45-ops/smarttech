/* ============================================================
   email-agent.js — 메일 자동견적 (3-Agent 파이프라인)
   Agent 1: 거래 등급 분류 + 고객정보 추출
   Agent 2: 카탈로그 기반 제품 선정
   Agent 3: 한국어 비즈니스 회신 초안 작성
============================================================ */

let MK_EMAIL_PROPOSAL = null;

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
}

// ---------- 카탈로그 사전필터 (family 그룹핑) ----------
const MK_FAMILIES = [
  "NXDS","NXR","NEXT","NES","GXS","EXS","EDS","E2M","RV","EH","STP","ELD","XDS","IPX","TIC","TAV","T-STATION","PFPE","IST","TIM"
];
function familyOf(product){
  const hay = (product.partNo + " " + product.description).toUpperCase();
  // 긴 이름 우선 매칭
  const ordered = [...MK_FAMILIES].sort((a,b)=>b.length-a.length);
  for(const f of ordered){ if(hay.includes(f)) return f; }
  return "MISC";
}
function compactProducts(list){
  return list.map(p=>({ p:p.partNo, d:p.description, s:(p.sheet||"").replace("2026 Price_",""), f:familyOf(p) }));
}

function prefilterCatalog(email, reqs){
  const txt = (email||"").toLowerCase();
  if(!txt.trim() || typeof ALL_PRODUCTS==="undefined") return [];
  const modelHints = ["rv","e2m","nes","nxds","nxr","next","gxs","exs","eds","eh","stp","eld","xds","t-station","tic","ipx","ev","pfpe","ist","tim","tav"];
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

  // Agent 1.5 요구사항에서 모델 힌트 추가 (최우선)
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

  const scored = ALL_PRODUCTS.map(p=>{
    const hay = (p.partNo + " " + p.description).toLowerCase();
    let score = 0;
    tokens.forEach(t=>{
      if(t.length>=3 && hay.includes(t)){
        const bonus = strongModels.has(t) ? 6 : (hay.indexOf(t)<20 ? 3 : 1);
        score += bonus;
      }
    });
    rawTokens.forEach(t=>{ if(t.length>=4 && p.partNo.toLowerCase()===t) score += 15; });
    // 요구사항 내 정확 Part No 매칭
    if(reqs && Array.isArray(reqs.models_mentioned)){
      reqs.models_mentioned.forEach(m=>{ if(m && p.partNo.toLowerCase()===String(m).toLowerCase()) score += 20; });
    }
    return { p, score };
  }).filter(x=>x.score>0);

  if(!scored.length) return [];

  // family 별 그룹 + 상위 4개씩 → 최대 40개
  const maxPerFamily = 4;
  const maxTotal = 40;
  const byFam = new Map();
  scored.forEach(x=>{
    const f = familyOf(x.p);
    if(!byFam.has(f)) byFam.set(f, []);
    byFam.get(f).push(x);
  });
  const families = [...byFam.entries()]
    .map(([f, arr])=>({
      f,
      best: Math.max(...arr.map(x=>x.score)),
      arr: arr.sort((a,b)=>b.score-a.score).slice(0, maxPerFamily)
    }))
    .sort((a,b)=>b.best - a.best);

  const out = [];
  for(const fam of families){
    for(const x of fam.arr){ out.push(x.p); if(out.length>=maxTotal) break; }
    if(out.length>=maxTotal) break;
  }
  return out;
}

// ---------- Agent 1: 등급 분류 + 고객정보 ----------
const CLASSIFY_SCHEMA = {
  type:"object",
  properties:{
    grade: { type:"string", enum:["dealer","oem","enduser"] },
    confidence: { type:"number", minimum:0, maximum:1 },
    rationale: { type:"string", description:"2-3문장 근거" },
    signals:  { type:"array", items:{ type:"string" }, description:"판별에 사용된 메일 속 문구·키워드" },
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
    subject_summary: { type:["string","null"], description:"문의 요지 요약 1문장" }
  },
  required:["grade","confidence","rationale","customer"]
};

const CLASSIFY_PROMPT = `당신은 B2B 진공장비 대리점의 거래등급 분류 + 고객정보 추출 전문가입니다.
메일 본문에서 아래 규칙으로 등급을 판정하고 고객정보를 추출해 classify_grade 도구로 반환하십시오.

등급 규칙:
- dealer(딜러): 재판매/공급/총판/대리점/판매처/리셀러(reseller/distributor) 언급, 자신이 딜러로 명시, 다수 최종사용자에게 납품 목적
- oem(OEM): 자사 장비에 내장/통합(integration)·제조·BOM·생산라인 투입 목적, 반복·연속 수요 시그널
- enduser(최종사용자): 대학·연구소·공장 공정 직접 운영, 1~2대 자체 사용 목적, 구체 공정 묘사

추가 지침:
- 한국 전화번호는 010-0000-0000 / 02-000-0000 / 031-000-0000 형식으로 정규화.
- 국가코드(+82)는 0으로 변환.
- 명확한 시그널이 약하면 enduser 로 기본 분류하고 confidence 를 낮추십시오.
- signals 에는 등급 판단 근거가 된 메일 원문 발췌 3-6개를 넣으십시오.
- 출력은 classify_grade 도구 호출 1회로만.`;

// ---------- Agent 1.5: 요구사항 추출 ----------
const REQS_SCHEMA = {
  type:"object",
  properties:{
    models_mentioned: { type:"array", items:{ type:"string" }, description:"메일에 명시된 구체 모델명 (예: nXDS15i, GXS450, EH500) — 오탈자 정상화" },
    processes: { type:"array", items:{ type:"string" }, description:"공정·용도 키워드 (예: 스퍼터링, 동결건조, OLED 증착)" },
    vacuum_level: { type:["string","null"], description:"명시된 진공도 (예: 5e-6 mbar, 고진공, 중진공)" },
    applications: { type:"array", items:{ type:"string" }, description:"장비·환경 (예: cluster tool, load lock chamber, 연구실)" },
    quantities: {
      type:"array",
      items:{
        type:"object",
        properties:{
          model_or_category: { type:"string" },
          qty: { type:"integer", minimum:1 }
        },
        required:["model_or_category","qty"]
      },
      description:"수량이 명시된 항목들"
    },
    accessories_needed: { type:"array", items:{ type:"string" }, description:"언급된 부속품·액세서리 (예: 컨트롤러 TIC, 케이블, 아이솔레이션 밸브)" },
    constraints: { type:"array", items:{ type:"string" }, description:"제약 조건 (예: 오일프리, 저진동, 저소음, ATEX, 특정 크기)" },
    confidence: { type:"number", minimum:0, maximum:1 }
  },
  required:["models_mentioned","processes","applications","quantities","accessories_needed","confidence"]
};

const REQS_PROMPT = `당신은 고객 이메일에서 진공장비 요구사항을 구조화 추출하는 전문가입니다. extract_requirements 도구로 단 1회 반환하십시오.

규칙:
1. models_mentioned: 메일에 **명시된 구체 모델명만** (예: nXDS15i, GXS450, EH500, STP-iXA2206). 추측 금지. 흔한 오탈자는 정상화 (예: nXDS 15 → nXDS15).
2. processes: 언급된 공정·용도 (스퍼터링, OLED 증착, 동결건조, 이차전지 degassing, SEM/TEM, cluster tool 등).
3. vacuum_level: 명시된 진공도 수치 또는 표현. 없으면 null.
4. applications: 장비·환경 설명 (cluster tool, load lock, 연구실, 양산라인 등).
5. quantities: 수량 명시된 것만. "유닛당 2EA" 같은 BOM 표현은 기본 유닛 1대 기준으로 환산.
6. accessories_needed: 부속 (컨트롤러, 케이블, 밸브, 리크디텍터 등).
7. constraints: 특수 조건 (오일프리, 저소음, ATEX, 특정 크기 등).
8. confidence: 추출 자신도.
9. 없는 필드는 빈 배열(또는 null)로. 절대 추측·환각 금지.`;

// ---------- Agent 2: 제품 선정 ----------
const SELECT_SCHEMA = {
  type:"object",
  properties:{
    items: {
      type:"array",
      items:{
        type:"object",
        properties:{
          partNo:  { type:"string" },
          qty:     { type:"integer", minimum:1 },
          rationale: { type:"string", description:"선정 근거 1-2문장" }
        },
        required:["partNo","qty","rationale"]
      }
    },
    confidence: { type:"number", minimum:0, maximum:1 },
    notes:      { type:["string","null"], description:"추가 확인 필요 사항, 누락 정보 등" }
  },
  required:["items","confidence"]
};

const SELECT_PROMPT_HEADER = `당신은 스마텍(에드워즈 공식대리점)의 제품 선정 전문가입니다.
아래에 제공된 메일 본문과 고객 등급을 바탕으로, 후보 카탈로그에서 요청에 가장 부합하는 제품을 선정하여 select_products 도구로 반환하십시오.

규칙:
1. partNo 는 반드시 제공된 후보 카탈로그 목록에 있는 값만 사용하십시오. 존재하지 않는 Part No 를 만들어내지 마십시오.
2. 메일에 명시된 모델명(예: nXDS15i, GXS450, EH250 등)은 최우선 매칭.
3. 수량이 명시된 경우 그대로 반영, 없으면 1.
4. 공정·용도만 언급된 경우 적합한 펌프·부스터·액세서리 조합을 최대 5~8개로 추천하되, 각 rationale 에 근거를 명시.
5. 확신이 낮거나 정보 부족 시 notes 에 "확인 필요" 사항을 기재하고 confidence 를 낮추십시오.
6. 출력은 select_products 도구 호출 1회로만.`;

// ---------- Agent 3: 회신 초안 ----------
const REPLY_SCHEMA = {
  type:"object",
  properties:{
    subject: { type:"string", description:"RE: 접두어를 포함한 회신 제목" },
    body_text: { type:"string", description:"완성된 회신 본문. 인사→감사→질문답변→견적 요약→다음 단계→서명 순서. 줄바꿈 포함. 원문 메일과 동일 언어(한/영) 사용." },
    answered_questions: { type:"array", items:{ type:"string" }, description:"본문에서 답변한 고객 질문 (없으면 빈 배열)" },
    open_questions: { type:"array", items:{ type:"string" }, description:"답하기 위해 추가 확인이 필요한 항목 — 영업담당이 체크해야 함" },
    confidence: { type:"number", minimum:0, maximum:1 }
  },
  required:["subject","body_text","answered_questions","open_questions","confidence"]
};

const REPLY_PROMPT = `당신은 스마텍((주)스마텍, 에드워즈 공식대리점)의 영업 담당자로서 고객 이메일에 대한 정중한 회신 초안을 작성합니다. draft_reply 도구로만 반환하십시오.

작성 구조 (body_text 순서):
1) 인사 — "안녕하세요, ○○○님." (고객 이름/직급 확인되면 사용, 없으면 "안녕하세요.")
2) 요청 수령 감사 — 1문장
3) 고객 질문 답변 — 메일에 질문(?, ~까요, ~인가요, ~문의드립니다, ~궁금합니다 등)이 있으면 각각 답변.
   · 확실하지 않은 사항(납기·재고·특수사양·할인율)은 "확인 후 별도 안내드리겠습니다"로 처리하고 open_questions 에 기록.
   · 제품 사양/일반 지식은 답변 가능.
4) 견적 요약 — 선정 품목 품명(한글 위주) + 수량을 1~3줄로. 금액은 직접 노출하지 말고 "첨부/별도 견적서 참조" 식으로.
5) 다음 단계 — "확인 후 회신 부탁드립니다" / "추가 문의 환영" 류 1문장.
6) 서명 — 아래 고정 서명 블록을 그대로 붙여넣으시오.

고정 서명 블록 (그대로 포함, 수정 금지):
(주)스마텍 | Edwards 공식대리점
대표 이명재
T. 031-204-7170  M. 010-3194-7170  F. 031-206-7178
E. rokmclmj@gmail.com  W. smartechvacuum.com
경기 수원시 영통구 신원로 55, 907호

규칙:
- 존댓말, 간결한 한국 B2B 톤. 총 250~500자.
- 원문 메일이 영문이면 회신도 영문으로 작성, 서명 블록도 영문 등가로 변환.
- 과장된 영업문구 금지. 거래 등급/할인율 직접 언급 금지.
- subject 는 원문 제목이 유추되면 "RE: <요약>" 형태, 아니면 "RE: 견적 문의 회신 - ○○○님" 형태.`;

async function callTool(toolName, schema, systemPrompt, userText, extraUserBlocks=[]){
  if(!window.MK_USER) throw new Error("로그인이 필요합니다.");
  const j = await mkCallClaude({
    model: getModel(),
    max_tokens: 2048,
    temperature: 0,
    tools: [{ name: toolName, description: toolName, input_schema: schema }],
    tool_choice: { type:"tool", name: toolName },
    messages: [{
      role:"user",
      content: [
        { type:"text", text: systemPrompt },
        ...extraUserBlocks,
        { type:"text", text: userText }
      ]
    }]
  });
  const blk = (j.content||[]).find(c=>c.type==="tool_use" && c.name===toolName);
  if(!blk) throw new Error(toolName+" 응답에서 도구 호출을 찾지 못했습니다.");
  return { data: blk.input, usage: j.usage, model: j.model };
}

// 메일 원문에서 이메일/회사명 후보 추출 (Agent 호출 전 사전 스캔용)
function preScanEmailText(text){
  const emails = (String(text||"").match(/[\w.+\-]+@[\w\-]+\.[\w.\-]+/g) || []).map(e=>e.toLowerCase());
  const lines = String(text||"").split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const companies = [];
  const companyRx = /(\(주\)|㈜|주식회사|Co\.?\s?,?\s?Ltd\.?|\bInc\.?|Corporation|Corp\.?|GmbH|S\.?A\.?|Limited)/i;
  lines.forEach(l => {
    if(companyRx.test(l) && l.length < 80) companies.push(l);
  });
  return { emails: [...new Set(emails)], companies };
}

// 매칭: (customer 객체) 또는 ({emails[], companies[]}) 모두 수용
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

  // 1차: 이메일 정확 매칭
  for(const e of emailList){
    if(!e) continue;
    const hit = list.find(c => (c.email||"").trim().toLowerCase() === e);
    if(hit) return hit;
  }
  // 2차: 도메인 + 회사 유사
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
  // 3차: 회사명 정규화 일치
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

async function runEmailAgents(){
  const email = (document.getElementById("emailBody").value||"").trim();
  const out = document.getElementById("emailResult");
  if(!email){ out.innerHTML = `<div class="email-err">메일 본문을 붙여넣으세요.</div>`; return; }
  if(!window.MK_USER){ out.innerHTML = `<div class="email-err">로그인이 필요합니다. 상단 로그인 바에서 매직링크로 로그인하세요.</div>`; return; }

  // [1단계] 사전 스캔 — 원문에서 이메일/회사명 추출 → 고객 DB 조회 (Agent 호출 0)
  out.innerHTML = `<div class="email-step"><strong>사전 조회</strong> · 기존 고객 DB 확인 중…</div>`;
  const preHints = preScanEmailText(email);
  const preMatched = matchExistingClient(preHints);

  let g1 = null;
  let gradeData;

  if(preMatched){
    // 기존 고객 — Agent 1 생략, DB 저장값 사용
    out.innerHTML += `<div class="email-step"><strong>기존 고객 발견</strong> · ${escapeHtml(preMatched.company||"")} — 저장된 등급 <b>${preMatched.grade||"dealer"}</b> 적용 · Agent 1 생략</div>`;
    gradeData = {
      grade: preMatched.grade || "dealer",
      confidence: 1.0,
      rationale: `기존 고객 DB 매칭 (회사: ${preMatched.company||""} / 이메일: ${preMatched.email||""}). 저장된 등급을 그대로 사용하며 분류 Agent 는 실행하지 않았습니다.`,
      signals: [
        preMatched.email ? ("email: "+preMatched.email) : null,
        preMatched.company ? ("company: "+preMatched.company) : null
      ].filter(Boolean),
      customer: {
        company: preMatched.company || null,
        contact: preMatched.contact || null,
        title:   preMatched.title || null,
        phone:   preMatched.mobile || preMatched.office || preMatched.phone || null,
        email:   preMatched.email || (preHints.emails[0] || null),
        address: preMatched.address || null,
      },
      subject_summary: null,
      _existing_client: preMatched,
    };
  } else {
    // 신규 고객 — Agent 1 실행
    out.innerHTML += `<div class="email-step"><strong>신규 고객</strong> · Agent 1 로 거래 등급 분류 및 고객정보 추출 중…</div>`;
    try{
      g1 = await callTool("classify_grade", CLASSIFY_SCHEMA, CLASSIFY_PROMPT,
        "---- 메일 본문 시작 ----\n" + email + "\n---- 메일 본문 끝 ----");
    }catch(e){
      out.innerHTML = `<div class="email-err">Agent 1 실패: ${escapeHtml(e.message||String(e))}</div>`;
      return;
    }
    gradeData = g1.data;
    // Agent 1 결과로 재확인 (사전 스캔에서 놓친 매칭이 있는지)
    const postMatch = matchExistingClient(gradeData.customer);
    if(postMatch){
      gradeData._agent_grade = gradeData.grade;
      gradeData._agent_confidence = gradeData.confidence;
      gradeData.grade = postMatch.grade || gradeData.grade;
      gradeData.confidence = 1.0;
      gradeData._existing_client = postMatch;
      gradeData.rationale = `[Agent 1 실행 후 기존 고객 발견] ${postMatch.company||""} — 저장된 등급(${postMatch.grade}) 적용. Agent 1 판정: ${gradeData._agent_grade} (${Math.round((gradeData._agent_confidence||0)*100)}%) · ` + (gradeData.rationale||"");
      out.innerHTML += `<div class="email-step"><strong>사후 매칭</strong> · Agent 1 이 추출한 정보로 DB 재조회 → ${escapeHtml(postMatch.company||"")} 매칭. 등급 ${postMatch.grade} 적용</div>`;
    }
  }

  // Agent 1.5 요구사항 추출
  out.innerHTML += `<div class="email-step"><strong>Agent 1.5</strong> · 요구사항 구조화 추출 중…</div>`;
  let reqsData = null;
  try{
    const gr = await callTool("extract_requirements", REQS_SCHEMA, REQS_PROMPT,
      "---- 메일 본문 시작 ----\n" + email + "\n---- 메일 본문 끝 ----");
    reqsData = gr.data;
  }catch(e){
    console.warn("Agent 1.5 실패 (무시하고 진행):", e);
  }

  // 요구사항 기반 사전 필터 (family 그룹핑 + 최대 40)
  const candidates = prefilterCatalog(email, reqsData);
  const compact = compactProducts(candidates);

  out.innerHTML += `<div class="email-step"><strong>Agent 2</strong> · family 그룹핑 후보 ${compact.length}개 중 제품 선정 중…</div>`;

  if(!compact.length){
    renderEmailProposal(gradeData, { items:[], confidence:0, notes:"메일에서 제품 관련 단서가 발견되지 않았습니다. 수동 검색을 권장합니다." }, g1, null, null, reqsData);
    return;
  }

  let g2;
  try{
    const catalogJson = JSON.stringify(compact);
    const reqsJson = reqsData ? JSON.stringify(reqsData) : "(요구사항 추출 실패 — 메일 원문만 참고)";
    const userText =
      "[고객 등급] " + gradeData.grade + "\n\n" +
      "[Agent 1.5 요구사항 JSON]\n" + reqsJson + "\n\n" +
      "[메일 본문]\n" + email + "\n\n" +
      "[후보 카탈로그 JSON: p=Part No, d=품명, s=시트, f=모델 family]\n" + catalogJson + "\n\n" +
      "지침:\n" +
      "- 요구사항의 models_mentioned 와 정확 일치하는 Part No 가 후보에 있으면 최우선 채택.\n" +
      "- 같은 family 내 비슷한 변종이 여러 개면 가장 요구사항에 근접한 1~2개만 선택.\n" +
      "- accessories_needed 가 있으면 해당 부속도 후보에서 찾아 추가.";
    g2 = await callTool("select_products", SELECT_SCHEMA, SELECT_PROMPT_HEADER, userText);
  }catch(e){
    out.innerHTML += `<div class="email-err">Agent 2 실패: ${escapeHtml(e.message||String(e))}</div>`;
    return;
  }

  // Agent 3: 회신 초안
  out.innerHTML += `<div class="email-step"><strong>Agent 3</strong> · 회신 초안 작성 중…</div>`;
  let g3 = null;
  try{
    g3 = await runReplyAgent(email, gradeData, g2.data);
  }catch(e){
    // Agent 3 실패는 치명적이지 않음 — 견적 결과는 그대로 렌더
    console.warn("Agent 3 실패 (무시하고 진행):", e);
  }

  try{
    renderEmailProposal(gradeData, g2.data, g1, g2, g3);
  }catch(e){
    console.error("renderEmailProposal error", e, { gradeData, g2data: g2?.data });
    out.innerHTML += `<div class="email-err">렌더링 오류: ${escapeHtml(e.message||String(e))}<br><small>콘솔(F12)에서 상세 로그를 확인하세요.</small></div>
      <pre class="ocr-raw" style="margin-top:8px">${escapeHtml(JSON.stringify({ agent1: gradeData, agent2: g2?.data, agent3: g3?.data }, null, 2))}</pre>
      <div class="btn-row"><button class="btn" onclick="clearEmailInput()">다시 시도</button></div>`;
  }
}

async function runReplyAgent(emailBody, gradeData, productsData){
  const validItems = (productsData.items||[])
    .map(it=>{ const prod = ALL_PRODUCTS.find(p=>p.partNo===it.partNo); return prod ? { partNo: it.partNo, description: prod.description, qty: it.qty } : null; })
    .filter(Boolean);
  const payload = {
    original_email: emailBody,
    grade: gradeData.grade,
    customer: gradeData.customer || {},
    subject_summary: gradeData.subject_summary || null,
    items: validItems,
    company: MK_COMPANY
  };
  const userText =
    "---- 원본 메일 시작 ----\n" + emailBody + "\n---- 원본 메일 끝 ----\n\n" +
    "---- 회신 컨텍스트 (JSON) ----\n" + JSON.stringify(payload, null, 2);
  return await callTool("draft_reply", REPLY_SCHEMA, REPLY_PROMPT, userText);
}

function renderEmailProposal(grade, products, meta1, meta2, meta3){
  const out = document.getElementById("emailResult");
  const gradeLbl = ({dealer:"딜러 (Dealer)", oem:"OEM", enduser:"최종사용자 (End User)"})[grade.grade] || grade.grade;
  const conf1 = Math.round((grade.confidence||0)*100);
  const conf2 = Math.round((products.confidence||0)*100);
  const signals = (grade.signals||[]).map(s=>`<li>${escapeHtml(s)}</li>`).join("");
  const c = grade.customer||{};
  const customerRows = [
    ["회사", c.company],
    ["담당자", c.contact],
    ["직급", c.title],
    ["전화", c.phone],
    ["이메일", c.email],
    ["주소", c.address],
  ].filter(r=>r[1]);
  // 유효한 Part No만 남기기
  const validItems = (products.items||[])
    .map(it=>{ const prod = ALL_PRODUCTS.find(p=>p.partNo===it.partNo); return prod ? {...it, prod} : null; })
    .filter(Boolean);
  const invalidCount = (products.items||[]).length - validItems.length;

  const itemRows = validItems.length ? validItems.map(it=>`
      <tr>
        <td><span class="partno">${escapeHtml(it.partNo)}</span><br><span class="sheet-tag">${(it.prod.sheet||"").replace("2026 Price_","")}</span></td>
        <td>${escapeHtml(it.prod.description)}</td>
        <td style="text-align:center">${it.qty}</td>
        <td class="price-cell">${fmt(priceForGrade(it.prod, grade.grade))}원</td>
        <td>${escapeHtml(it.rationale||"")}</td>
      </tr>`).join("") : `<tr><td colspan="5" class="no-match">선정된 제품이 없습니다. 메일 내용을 구체화하거나 수동 검색을 이용하세요.</td></tr>`;

  const replyData = meta3?.data || null;
  MK_EMAIL_PROPOSAL = {
    grade: grade.grade,
    customer: c,
    items: validItems,
    reply_draft: replyData,
    existingClient: grade._existing_client || null,
    _emailBody: (document.getElementById("emailBody")?.value||"").trim(),
    _gradeRaw: grade,
    _productsRaw: products
  };

  out.innerHTML = `
    <div class="email-card">
      <div class="email-head">
        <div>
          <div class="section-title" style="border:none;padding:0;margin:0 0 6px">Agent 1 · 거래 등급 판별</div>
          <div class="email-grade-val">${escapeHtml(gradeLbl)} <span class="pill">${grade._existing_client ? "기존 고객 적용" : "신뢰도 "+conf1+"%"}</span>${grade._existing_client ? ` <span class="muted" style="font-size:11px">· ${escapeHtml(grade._existing_client.company||"")}</span>` : ""}</div>
        </div>
        <div class="muted" style="font-size:11px;text-align:right">model: ${escapeHtml(meta1?.model||"")}</div>
      </div>
      <div class="email-rationale"><strong>근거.</strong> ${escapeHtml(grade.rationale||"")}</div>
      ${signals ? `<details class="email-details"><summary>판별 시그널 (${grade.signals.length})</summary><ul>${signals}</ul></details>` : ""}
      ${grade.subject_summary ? `<div class="email-sum"><strong>문의 요지.</strong> ${escapeHtml(grade.subject_summary)}</div>` : ""}

      ${customerRows.length ? `
      <div class="section-title" style="margin-top:24px">추출된 고객 정보</div>
      <table class="agent-review"><tbody>
        ${customerRows.map(([k,v])=>`<tr><th>${k}</th><td>${escapeHtml(v)}</td></tr>`).join("")}
      </tbody></table>
      ` : ""}

      <div class="section-title" style="margin-top:24px">Agent 2 · 선정 제품 <span class="pill" style="margin-left:8px">신뢰도 ${conf2}%</span></div>
      <div class="scroll-wrap" style="max-height:320px">
        <table>
          <thead><tr>
            <th>Part No</th><th>품명</th><th style="width:60px;text-align:center">수량</th>
            <th style="width:120px;text-align:right">단가(${gradeLbl})</th><th>근거</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
      ${invalidCount ? `<div class="email-err" style="margin-top:8px">※ ${invalidCount}개 Part No 는 카탈로그에 존재하지 않아 제외했습니다.</div>` : ""}
      ${products.notes ? `<div class="email-notes"><strong>Notes.</strong> ${escapeHtml(products.notes)}</div>` : ""}

      ${renderReplyDraft(replyData)}

      <div class="btn-row">
        <button class="btn primary" onclick="applyEmailProposal()">적용 · 견적서 작성으로</button>
        <button class="btn" onclick="clearEmailInput()">취소</button>
      </div>
    </div>`;
}

function renderReplyDraft(reply){
  if(!reply){
    return `<details class="email-reply-draft" open>
      <summary>✉ 회신 초안 <span class="reply-conf">생성 실패 — [재생성] 버튼을 눌러 다시 시도</span></summary>
      <div class="reply-body">
        <div class="email-err" style="margin:0">Agent 3 호출이 실패했습니다. 네트워크·모델 상태 확인 후 재시도하세요.</div>
        <div class="reply-actions"><button class="btn" onclick="regenerateReplyDraft()">재생성</button></div>
      </div>
    </details>`;
  }
  const conf = Math.round((reply.confidence||0)*100);
  const open = (reply.open_questions||[]);
  const ans = (reply.answered_questions||[]);
  return `<details class="email-reply-draft" open>
    <summary>✉ 회신 초안 <span class="reply-conf">신뢰도 ${conf}%${ans.length?` · 답변 ${ans.length}건`:""}${open.length?` · 확인필요 ${open.length}건`:""}</span></summary>
    <div class="reply-body">
      <label class="reply-label">제목</label>
      <input type="text" class="reply-subject" id="replySubject" value="${escapeHtml(reply.subject||"")}">
      <label class="reply-label">본문 (편집 가능)</label>
      <textarea class="reply-text" id="replyBody" rows="14">${escapeHtml(reply.body_text||"")}</textarea>
      ${open.length ? `
        <div class="reply-warn">
          <strong>⚠ 담당자 확인 필요:</strong>
          <ul>${open.map(q=>`<li>${escapeHtml(q)}</li>`).join("")}</ul>
        </div>` : ""}
      <div class="reply-actions">
        <button class="btn primary" onclick="copyReplyDraft()">클립보드 복사</button>
        <button class="btn" onclick="copyReplyDraft(true)">본문만 복사</button>
        <button class="btn" onclick="regenerateReplyDraft()">재생성</button>
      </div>
    </div>
  </details>`;
}

function copyReplyDraft(bodyOnly){
  const subj = (document.getElementById("replySubject")?.value||"").trim();
  const body = (document.getElementById("replyBody")?.value||"").trim();
  if(!body){ if(window.mkToast) mkToast("복사할 내용이 없습니다","warn"); return; }
  const text = bodyOnly ? body : (subj ? `제목: ${subj}\n\n${body}` : body);
  const onOk = ()=>{ if(window.mkToast) mkToast("회신 초안 복사됨","ok"); else alert("복사되었습니다."); };
  const onErr = ()=>{
    // fallback: select textarea and execCommand
    const ta = document.getElementById("replyBody"); if(ta){ ta.select(); document.execCommand("copy"); onOk(); }
    else alert("복사 실패. 수동으로 선택해 복사해주세요.");
  };
  if(navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(onOk, onErr);
  else onErr();
}

async function regenerateReplyDraft(){
  if(!MK_EMAIL_PROPOSAL){ alert("재생성할 컨텍스트가 없습니다."); return; }
  const curBody = (document.getElementById("replyBody")?.value||"").trim();
  const origBody = MK_EMAIL_PROPOSAL.reply_draft?.body_text || "";
  if(curBody && curBody !== origBody){
    if(!confirm("편집한 내용이 있습니다. 재생성하면 덮어쓰여집니다. 계속할까요?")) return;
  }
  const out = document.getElementById("emailResult");
  if(out){
    const det = out.querySelector(".email-reply-draft .reply-body");
    if(det) det.innerHTML = `<div class="email-step">회신 초안 재생성 중…</div>`;
  }
  try{
    const g3 = await runReplyAgent(
      MK_EMAIL_PROPOSAL._emailBody || "",
      MK_EMAIL_PROPOSAL._gradeRaw || { grade: MK_EMAIL_PROPOSAL.grade, customer: MK_EMAIL_PROPOSAL.customer },
      MK_EMAIL_PROPOSAL._productsRaw || { items: MK_EMAIL_PROPOSAL.items.map(i=>({partNo:i.partNo, qty:i.qty})) }
    );
    MK_EMAIL_PROPOSAL.reply_draft = g3.data;
    // 회신 섹션만 다시 렌더
    const det = document.querySelector(".email-reply-draft");
    if(det) det.outerHTML = renderReplyDraft(g3.data);
  }catch(e){
    if(window.mkToast) mkToast("재생성 실패: "+(e.message||e),"warn");
    else alert("재생성 실패: "+(e.message||e));
  }
}

function priceForGrade(p, grade){
  const g = grade==="dealer"?"dealer":grade==="oem"?"oem":"endUser";
  const m = (window.MK_SETTINGS?.multipliers?.[grade]) ?? 100;
  return Math.round(p[g]*m/100);
}

async function applyEmailProposal(){
  if(!MK_EMAIL_PROPOSAL){ alert("적용할 제안이 없습니다."); return; }
  const { grade, customer, items, existingClient } = MK_EMAIL_PROPOSAL;

  // [무조건 저장] 고객 — 기존이면 업데이트, 신규면 생성
  try{ await autoSaveClient(customer, grade, existingClient); }
  catch(e){ console.warn("고객 자동 저장 실패(진행 계속):", e); }

  if(customer){
    setIfExists("customerName", customer.company);
    const contact = [customer.contact, customer.title].filter(Boolean).join(" ").trim();
    setIfExists("contactPerson", contact);
    setIfExists("contactPhone", customer.phone);
    setIfExists("contactEmail", customer.email);
  }
  if(grade && typeof setGrade==="function") setGrade(grade);

  // 장바구니 — 무조건 에이전트 제안으로 교체 (저장 스킵 옵션 없음)
  cart.length = 0;
  items.forEach(it=>{
    cart.push({ ...it.prod, qty: it.qty, customPrice: null });
  });
  renderCart();
  document.getElementById("cartCount").textContent = cart.reduce((s,i)=>s+i.qty, 0);

  window.MK_EMAIL_CONTEXT = {
    original: MK_EMAIL_PROPOSAL._emailBody || "",
    subject_summary: MK_EMAIL_PROPOSAL._gradeRaw?.subject_summary || "",
    reply_draft: MK_EMAIL_PROPOSAL.reply_draft || null,
    customer: MK_EMAIL_PROPOSAL.customer || {}
  };
  switchTab("quote");
}

// 고객 자동 저장 — 기존 매칭 있으면 update, 없으면 insert
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
  // 빈 값으로 기존 데이터를 덮어쓰지 않도록 update 시 null 필드는 제거
  const targetId = existingClient?.id;
  if(targetId){
    const patch = {};
    Object.keys(payload).forEach(k=>{ if(payload[k]!=null && payload[k]!=="") patch[k]=payload[k]; });
    // 등급은 기존 DB 값이 있으면 변경하지 않는다 (기존 고객 정책)
    if(existingClient?.grade) delete patch.grade;
    if(Object.keys(patch).length === 0) return;
    await sb().from("smartech_clients").update(patch).eq("id", targetId);
  } else {
    await sb().from("smartech_clients").insert({ ...payload, user_id: window.MK_USER.id });
  }
  if(typeof loadClients === "function") await loadClients();
}
