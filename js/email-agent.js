/* ============================================================
   email-agent.js — 메일 자동견적 (2-Agent 파이프라인)
   Agent 1: 거래 등급 분류 + 고객정보 추출
   Agent 2: 카탈로그 기반 제품 선정
============================================================ */

let MK_EMAIL_PROPOSAL = null;

function clearEmailInput(){
  const t = document.getElementById("emailBody"); if(t) t.value = "";
  const r = document.getElementById("emailResult"); if(r) r.innerHTML = "";
  MK_EMAIL_PROPOSAL = null;
}

// ---------- 카탈로그 사전필터 ----------
function compactProducts(list){
  return list.map(p=>({ p:p.partNo, d:p.description, s:(p.sheet||"").replace("2026 Price_","") }));
}
function prefilterCatalog(email){
  const txt = (email||"").toLowerCase();
  if(!txt.trim() || typeof ALL_PRODUCTS==="undefined") return [];
  // 모델 키워드 (영문 모델명)
  const modelHints = ["rv","e2m","nes","nxds","nxr","next","gxs","exs","eds","eh","stp","eld","xds","t-station","tic","ipx","ev","pfpe","ist"];
  const processMap = [
    { kw:["코팅","sputter","스퍼터","액정","렌즈","inline"], add:["nes","exs","gxs","rv","e2m","next"] },
    { kw:["이차전지","battery","degassing","탈취","전해액"], add:["gxs","nes","exs"] },
    { kw:["진공로","vacuum furnace","열처리","소성","탄화"], add:["gxs","exs","eh"] },
    { kw:["가스","실린더","purge","퍼지","고순도","특수가스"], add:["nxds","e2m","eh","next"] },
    { kw:["이중배관","극저온","단열","보온","리크","leak"], add:["nxds","eld","next"] },
    { kw:["동결건조","제약","pharma","유산균","lyo"], add:["e2m","gxs","exs","nxds"] },
    { kw:["oled","display","디스플레이","증착"], add:["gxs","exs"] },
    { kw:["진공오븐","오븐","oven","건조","화학","화장품"], add:["nxds","gxs"] },
    { kw:["연구","analysis","r&d","sem","tem","gc-ms","lc-ms","질량분석","전자현미경"], add:["nxr","nxds","next","xds"] },
  ];
  // 이메일 토큰 수집
  const rawTokens = txt.match(/[a-z][a-z0-9\-]{2,}/g) || [];
  const tokens = new Set(rawTokens);
  // 공정 키워드 기반 확장
  processMap.forEach(pm=>{
    if(pm.kw.some(k=>txt.includes(k))) pm.add.forEach(x=>tokens.add(x));
  });
  // 일반 모델 힌트도 모두 후보로
  modelHints.forEach(m=>{ if(txt.includes(m)) tokens.add(m); });

  // 점수화: partNo/description 에 토큰이 몇개 나타나는지
  const scored = ALL_PRODUCTS.map(p=>{
    const hay = (p.partNo+" "+p.description).toLowerCase();
    let score = 0;
    tokens.forEach(t=>{ if(t.length>=3 && hay.includes(t)) score += (hay.indexOf(t)<20?3:1); });
    // 정확 Part No 매칭 보너스
    rawTokens.forEach(t=>{ if(t.length>=4 && p.partNo.toLowerCase()===t) score += 10; });
    return { p, score };
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0, 80);
  return scored.map(x=>x.p);
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

async function callTool(toolName, schema, systemPrompt, userText, extraUserBlocks=[]){
  const key = getApiKey();
  if(!key) throw new Error("설정 탭에서 Anthropic API 키를 먼저 저장하세요.");
  const body = {
    model: getModel(),
    max_tokens: 2048,
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
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{
      "content-type":"application/json",
      "x-api-key": key,
      "anthropic-version":"2023-06-01",
      "anthropic-dangerous-direct-browser-access":"true"
    },
    body: JSON.stringify(body)
  });
  if(!res.ok){
    const t = await res.text();
    let m = t; try{ m = JSON.parse(t).error?.message || t; }catch(e){}
    throw new Error("API "+res.status+": "+String(m).slice(0,240));
  }
  const j = await res.json();
  const blk = (j.content||[]).find(c=>c.type==="tool_use" && c.name===toolName);
  if(!blk) throw new Error(toolName+" 응답에서 도구 호출을 찾지 못했습니다.");
  return { data: blk.input, usage: j.usage, model: j.model };
}

async function runEmailAgents(){
  const email = (document.getElementById("emailBody").value||"").trim();
  const out = document.getElementById("emailResult");
  if(!email){ out.innerHTML = `<div class="email-err">메일 본문을 붙여넣으세요.</div>`; return; }
  if(!getApiKey()){ out.innerHTML = `<div class="email-err">설정 탭에서 Anthropic API 키를 먼저 저장하세요.</div>`; return; }

  out.innerHTML = `<div class="email-step"><strong>Agent 1</strong> · 거래 등급 분류 및 고객정보 추출 중…</div>`;

  let g1;
  try{
    g1 = await callTool("classify_grade", CLASSIFY_SCHEMA, CLASSIFY_PROMPT,
      "---- 메일 본문 시작 ----\n" + email + "\n---- 메일 본문 끝 ----");
  }catch(e){
    out.innerHTML = `<div class="email-err">Agent 1 실패: ${escapeHtml(e.message||String(e))}</div>`;
    return;
  }
  const gradeData = g1.data;

  // 카탈로그 사전 필터
  const candidates = prefilterCatalog(email);
  const compact = compactProducts(candidates);

  out.innerHTML += `<div class="email-step"><strong>Agent 2</strong> · 후보 ${compact.length}개 중 제품 선정 중…</div>`;

  if(!compact.length){
    // 비어 있으면 전체 카탈로그 간단 요약을 넘기지 않고 빈 결과 처리
    renderEmailProposal(gradeData, { items:[], confidence:0, notes:"메일에서 제품 관련 단서가 발견되지 않았습니다. 수동 검색을 권장합니다." }, g1);
    return;
  }

  let g2;
  try{
    const catalogJson = JSON.stringify(compact);
    const userText =
      "고객 등급(Agent 1 판정): " + gradeData.grade + "\n\n" +
      "---- 메일 본문 시작 ----\n" + email + "\n---- 메일 본문 끝 ----\n\n" +
      "---- 후보 카탈로그 (JSON: p=Part No, d=품명, s=시트) ----\n" + catalogJson;
    g2 = await callTool("select_products", SELECT_SCHEMA, SELECT_PROMPT_HEADER, userText);
  }catch(e){
    out.innerHTML += `<div class="email-err">Agent 2 실패: ${escapeHtml(e.message||String(e))}</div>`;
    return;
  }
  renderEmailProposal(gradeData, g2.data, g1, g2);
}

function renderEmailProposal(grade, products, meta1, meta2){
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

  MK_EMAIL_PROPOSAL = { grade: grade.grade, customer: c, items: validItems };

  out.innerHTML = `
    <div class="email-card">
      <div class="email-head">
        <div>
          <div class="section-title" style="border:none;padding:0;margin:0 0 6px">Agent 1 · 거래 등급 판별</div>
          <div class="email-grade-val">${escapeHtml(gradeLbl)} <span class="pill">신뢰도 ${conf1}%</span></div>
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

      <div class="btn-row">
        <button class="btn primary" onclick="applyEmailProposal()">적용 · 견적서 작성으로</button>
        <button class="btn" onclick="clearEmailInput()">취소</button>
      </div>
    </div>`;
}

function priceForGrade(p, grade){
  const g = grade==="dealer"?"dealer":grade==="oem"?"oem":"endUser";
  const m = (window.MK_SETTINGS?.multipliers?.[grade]) ?? 100;
  return Math.round(p[g]*m/100);
}

function applyEmailProposal(){
  if(!MK_EMAIL_PROPOSAL){ alert("적용할 제안이 없습니다."); return; }
  const { grade, customer, items } = MK_EMAIL_PROPOSAL;
  // 고객정보 채움
  if(customer){
    setIfExists("customerName", customer.company);
    const contact = [customer.contact, customer.title].filter(Boolean).join(" ").trim();
    setIfExists("contactPerson", contact);
    setIfExists("contactPhone", customer.phone);
    setIfExists("contactEmail", customer.email);
  }
  // 등급 설정
  if(grade && typeof setGrade==="function") setGrade(grade);
  // 장바구니 교체 여부
  const replace = cart.length===0 || confirm("기존 장바구니를 비우고 에이전트 제안으로 교체할까요? 취소 시 기존 품목에 추가됩니다.");
  if(replace) cart.length = 0;
  items.forEach(it=>{
    const ex = cart.find(c=>c.partNo===it.partNo);
    if(ex) ex.qty += it.qty;
    else cart.push({ ...it.prod, qty: it.qty, customPrice: null });
  });
  renderCart();
  document.getElementById("cartCount").textContent = cart.reduce((s,i)=>s+i.qty, 0);
  switchTab("quote");
}
