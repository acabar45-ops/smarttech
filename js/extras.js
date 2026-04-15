/* ============================================================
   extras.js — McKinsey edition
   · 명함 OCR (Tesseract.js, kor+eng)
   · 고객 관리 (localStorage)
   · 발행 견적 보관함 (localStorage)
   · 등급별 배수 · 견적 미세조정
============================================================ */

const MK_LS = {
  clients: "mk.clients.v1",
  archive: "mk.archive.v1",
  settings: "mk.settings.v1",
};

// ---------- 설정 (등급 배수) ----------
window.MK_SETTINGS = loadSettings();
window.MK_QUOTE_ADJUST = 100;

function loadSettings(){
  try{
    const raw = localStorage.getItem(MK_LS.settings);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return { multipliers: { dealer:100, oem:100, enduser:100 } };
}
function saveSettings(){ localStorage.setItem(MK_LS.settings, JSON.stringify(window.MK_SETTINGS)); }

function clampPct(val){
  const n = parseFloat(val);
  if(!isFinite(n)) return 100;
  return Math.max(50, Math.min(150, Math.round(n*10)/10));
}
window.MK_MUL_EDIT = false;
window.MK_MUL_SNAPSHOT = null;

function updateMul(grade, val){
  const v = clampPct(val);
  window.MK_SETTINGS.multipliers[grade] = v;
  if(!window.MK_MUL_EDIT){ saveSettings(); }
  const setV = document.getElementById("set"+cap(grade)+"Val");
  const setR = document.getElementById("set"+cap(grade));
  const mulI = document.getElementById("mul"+cap(grade));
  if(setV && document.activeElement!==setV) setV.value = v;
  if(setR && document.activeElement!==setR) setR.value = v;
  if(mulI && document.activeElement!==mulI) mulI.value = v;
  if(typeof renderCart==="function") renderCart();
}
function enterMulEdit(){
  window.MK_MUL_EDIT = true;
  window.MK_MUL_SNAPSHOT = JSON.parse(JSON.stringify(window.MK_SETTINGS.multipliers));
  setMulInputsEnabled(true);
  toggleMulBtns(true);
}
function saveMulEdit(){
  ["dealer","oem","enduser"].forEach(g=>{
    const el = document.getElementById("set"+cap(g)+"Val");
    if(el) window.MK_SETTINGS.multipliers[g] = clampPct(el.value);
  });
  saveSettings();
  window.MK_MUL_EDIT = false;
  window.MK_MUL_SNAPSHOT = null;
  setMulInputsEnabled(false);
  toggleMulBtns(false);
  syncSettingsUI();
  if(typeof renderCart==="function") renderCart();
  flashLock("저장됨");
}
function cancelMulEdit(){
  if(window.MK_MUL_SNAPSHOT){
    window.MK_SETTINGS.multipliers = window.MK_MUL_SNAPSHOT;
  }
  window.MK_MUL_EDIT = false;
  window.MK_MUL_SNAPSHOT = null;
  setMulInputsEnabled(false);
  toggleMulBtns(false);
  syncSettingsUI();
  if(typeof renderCart==="function") renderCart();
}
function setMulInputsEnabled(on){
  ["dealer","oem","enduser"].forEach(g=>{
    const r = document.getElementById("set"+cap(g));
    const v = document.getElementById("set"+cap(g)+"Val");
    if(r) r.disabled = !on;
    if(v) v.readOnly = !on;
  });
  const grid = document.getElementById("mulGrid");
  if(grid) grid.classList.toggle("editing", on);
  const pill = document.getElementById("mulLockStatus");
  if(pill){ pill.textContent = on ? "수정 중" : "잠금"; pill.classList.toggle("open", on); }
}
function toggleMulBtns(editing){
  const v = document.getElementById("mulBtnView");
  const e = document.getElementById("mulBtnEdit");
  if(v) v.style.display = editing ? "none" : "";
  if(e) e.style.display = editing ? "" : "none";
}
function flashLock(txt){
  const pill = document.getElementById("mulLockStatus");
  if(pill){
    pill.textContent = txt; pill.classList.add("saved");
    setTimeout(()=>{ pill.textContent = "잠금"; pill.classList.remove("saved"); }, 1400);
  }
  if(window.mkToast) window.mkToast(txt,"ok");
}
function resetMul(){
  if(!confirm("모든 등급 배수를 100%로 초기화하시겠습니까?")) return;
  window.MK_SETTINGS.multipliers = { dealer:100, oem:100, enduser:100 };
  saveSettings();
  syncSettingsUI();
  if(typeof renderCart==="function") renderCart();
  flashLock("초기화됨");
}
function syncSettingsUI(){
  ["dealer","oem","enduser"].forEach(g=>{
    const v = window.MK_SETTINGS.multipliers[g] ?? 100;
    const r = document.getElementById("set"+cap(g)); if(r) r.value = v;
    const l = document.getElementById("set"+cap(g)+"Val"); if(l) l.value = v;
    const b = document.getElementById("mul"+cap(g)); if(b) b.value = v;
  });
}
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

// ---------- 견적 미세조정 ----------
function onAdjust(v){
  const n = clampPct(v);
  window.MK_QUOTE_ADJUST = n;
  const num = document.getElementById("quoteAdjustNum");
  if(num && document.activeElement!==num) num.value = n;
  if(typeof renderCart==="function") renderCart();
}
function onAdjustNum(v){
  const n = clampPct(v);
  window.MK_QUOTE_ADJUST = n;
  const sld = document.getElementById("quoteAdjust");
  if(sld) sld.value = n;
  if(typeof renderCart==="function") renderCart();
}
function resetAdjust(){
  window.MK_QUOTE_ADJUST = 100;
  document.getElementById("quoteAdjust").value = 100;
  const num = document.getElementById("quoteAdjustNum");
  if(num) num.value = 100;
  if(typeof renderCart==="function") renderCart();
}

// ---------- 고객 관리 ----------
function loadClients(){
  try{ return JSON.parse(localStorage.getItem(MK_LS.clients)||"[]"); }catch(e){ return []; }
}
function saveClients(list){ localStorage.setItem(MK_LS.clients, JSON.stringify(list)); }

function currentFormCustomer(){
  return {
    company: val("customerName"),
    contact: val("contactPerson"),
    phone:   val("contactPhone"),
    email:   val("contactEmail"),
    grade:   (typeof currentGrade!=="undefined"?currentGrade:"dealer"),
    updatedAt: new Date().toISOString(),
  };
}
function val(id){ const el=document.getElementById(id); return el?el.value.trim():""; }

function saveCurrentCustomer(){
  const c = currentFormCustomer();
  if(!c.company && !c.contact){
    if(window.mkToast) window.mkToast("회사명 또는 담당자를 입력하세요","warn");
    else alert("회사명 또는 담당자를 입력하세요.");
    return;
  }
  const list = loadClients();
  const key = (c.company+"|"+c.email).toLowerCase();
  const i = list.findIndex(x=>((x.company||"")+"|"+(x.email||"")).toLowerCase()===key);
  if(i>=0){ list[i] = { ...list[i], ...c }; }
  else { c.id = "c_"+Date.now(); list.unshift(c); }
  saveClients(list);
  renderClients();
  if(window.mkToast) window.mkToast("고객 정보 저장됨","ok");
  else alert("고객 정보가 저장되었습니다.");
}

function renderClients(){
  const q = (val("clientSearch")||"").toLowerCase();
  const list = loadClients().filter(c=>{
    if(!q) return true;
    return [c.company,c.contact,c.email,c.phone].some(v=>(v||"").toLowerCase().includes(q));
  });
  const tbody = document.getElementById("clientRows");
  if(!tbody) return;
  if(!list.length){ tbody.innerHTML = `<tr><td colspan="7" class="no-match">저장된 고객이 없습니다.</td></tr>`; return; }
  tbody.innerHTML = list.map(c=>{
    const upd = c.updatedAt ? c.updatedAt.slice(0,10) : "";
    const g = ({dealer:"Dealer",oem:"OEM",enduser:"End User"})[c.grade]||"Dealer";
    return `<tr>
      <td><strong>${escapeHtml(c.company||"-")}</strong></td>
      <td>${escapeHtml(c.contact||"")}</td>
      <td>${escapeHtml(c.phone||"")}</td>
      <td>${escapeHtml(c.email||"")}</td>
      <td><span class="sheet-tag">${g}</span></td>
      <td><span class="sheet-tag">${upd}</span></td>
      <td style="text-align:right">
        <button class="add-btn" onclick="loadClient('${c.id}')">불러오기</button>
        <button class="del-btn" onclick="deleteClient('${c.id}')">삭제</button>
      </td>
    </tr>`;
  }).join("");
}
function loadClient(id){
  const c = loadClients().find(x=>x.id===id); if(!c) return;
  setIfExists("customerName", c.company);
  setIfExists("contactPerson", c.contact);
  setIfExists("contactPhone", c.phone);
  setIfExists("contactEmail", c.email);
  if(c.grade && typeof setGrade==="function") setGrade(c.grade);
  switchTab("quote");
}
function deleteClient(id){
  if(!confirm("삭제하시겠습니까?")) return;
  saveClients(loadClients().filter(x=>x.id!==id));
  renderClients();
}
function setIfExists(id,v){ const el=document.getElementById(id); if(el) el.value = v||""; }

function exportClients(){
  downloadJSON("clients.json", loadClients());
}
function importClients(ev){
  const f = ev.target.files[0]; if(!f) return;
  const fr = new FileReader();
  fr.onload = e=>{
    try{
      const data = JSON.parse(e.target.result);
      if(!Array.isArray(data)) throw 0;
      const cur = loadClients();
      const ids = new Set(cur.map(x=>x.id));
      data.forEach(c=>{ if(!c.id) c.id="c_"+Date.now()+Math.random().toString(36).slice(2,6); if(!ids.has(c.id)) cur.push(c); });
      saveClients(cur); renderClients();
      alert("가져오기 완료: "+data.length+"건");
    }catch(e){ alert("JSON 파일이 올바르지 않습니다."); }
  };
  fr.readAsText(f);
}

// ---------- OCR (명함 스캔) ----------
function wireOCR(){
  const input = document.getElementById("ocrInput");
  const drop = document.getElementById("ocrDrop");
  if(!input||!drop) return;
  input.addEventListener("change", e=>{ const f=e.target.files[0]; if(f) runOCR(f); });
  ["dragover","dragenter"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag");}));
  ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag");}));
  drop.addEventListener("drop", e=>{ const f=e.dataTransfer.files[0]; if(f) runOCR(f); });
}

const MK_API_LS = "mk.anthropic.key";
const MK_MODEL_LS = "mk.anthropic.model";

function getApiKey(){ return localStorage.getItem(MK_API_LS)||""; }
function getModel(){
  return localStorage.getItem(MK_MODEL_LS) === "sonnet" ? "claude-sonnet-4-6" : "claude-haiku-4-5";
}
function saveApiKey(){
  const v = (document.getElementById("apiKey").value||"").trim();
  if(v) localStorage.setItem(MK_API_LS, v); else localStorage.removeItem(MK_API_LS);
  const hi = document.getElementById("useHighModel");
  if(hi) localStorage.setItem(MK_MODEL_LS, hi.checked ? "sonnet" : "haiku");
  refreshEngineStatus();
  if(window.mkToast) window.mkToast("저장됨","ok");
}
function clearApiKey(){
  localStorage.removeItem(MK_API_LS);
  const el = document.getElementById("apiKey"); if(el) el.value = "";
  refreshEngineStatus();
}
function refreshEngineStatus(){
  const el = document.getElementById("engineStatus"); if(!el) return;
  const hasKey = !!getApiKey();
  const hasTess = typeof Tesseract !== "undefined";
  if(hasKey){
    el.innerHTML = `<span class="ok">● Claude Vision 명함 파서 에이전트 활성</span> <span class="muted">(model: ${getModel()})</span>`;
  } else if(hasTess){
    el.innerHTML = `<span class="muted">● Tesseract.js (kor+eng) fallback · API 키 미설정</span>`;
  } else {
    el.innerHTML = `<span class="err">● 사용 가능한 판독 엔진 없음</span>`;
  }
  const tgl = document.getElementById("useHighModel");
  if(tgl) tgl.checked = localStorage.getItem(MK_MODEL_LS) === "sonnet";
  const k = document.getElementById("apiKey");
  if(k && !k.value && hasKey) k.placeholder = "sk-ant-…(저장됨)";
}

function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload = ()=>{ const s=fr.result; const i=s.indexOf(","); resolve(s.slice(i+1)); };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// ---------- 명함 판독 전문 에이전트 (Claude Vision) ----------
const CARD_AGENT_PROMPT = `당신은 한국·영문 명함 판독 전문 에이전트입니다.
제공된 명함 이미지에서 구조화된 정보를 추출하여 extract_business_card 도구로 단 한 번 반환하십시오.

판독 규칙:
1. 회사명은 명함 표기 그대로 반환하며 법인격(㈜, (주), 주식회사, Co., Ltd., Corporation, Inc.)을 임의로 생략·축약·번역하지 마십시오.
2. 한국 전화번호는 하이픈 포함으로 정규화: 휴대전화 010-0000-0000, 서울 02-000-0000, 그 외 지역 031-000-0000 등.
3. 국가코드(+82)가 있으면 제거 후 맨 앞에 0을 붙입니다. 예) +82 10-1234-5678 → 010-1234-5678.
4. 휴대전화(010/011/016/017/018/019)와 사무실 번호를 반드시 분리합니다. 명시가 없으면 01X 계열은 mobile, 그 외는 office.
5. 직급(대표이사, 회장, 부장, 차장, 과장, 대리, 주임, 팀장, 연구원, Director, CEO, CTO, PM 등)은 title, 부서(연구소·영업본부 등)는 department 로 분리합니다.
6. 한글 회사명과 영문 회사명이 병기된 경우 각각 company / company_en 에 분리합니다.
7. 명함에 없는 필드는 반드시 null 로 반환하십시오. 추측하거나 만들어내지 마십시오.
8. confidence 는 전체 판독 자체평가(0.0~1.0). 저해상도·가림·기울어짐·손글씨·역광은 감점.
9. 출력은 반드시 extract_business_card 도구 호출 1회로만 하십시오. 다른 텍스트 금지.`;

const CARD_AGENT_SCHEMA = {
  type: "object",
  properties: {
    company:    { type:["string","null"], description:"한국어 회사명 (법인격 원문 보존)" },
    company_en: { type:["string","null"], description:"영문 회사명" },
    contact:    { type:["string","null"], description:"담당자 이름" },
    title:      { type:["string","null"], description:"직급/직책" },
    department: { type:["string","null"], description:"부서/팀" },
    mobile:     { type:["string","null"], description:"휴대전화 (010-0000-0000)" },
    office:     { type:["string","null"], description:"사무실 전화" },
    fax:        { type:["string","null"] },
    email:      { type:["string","null"] },
    address:    { type:["string","null"] },
    website:    { type:["string","null"] },
    memo:       { type:["string","null"], description:"사업자번호·슬로건 등 기타" },
    confidence: { type:"number", minimum:0, maximum:1 }
  },
  required: ["confidence"]
};

async function parseWithClaude(file){
  const key = getApiKey();
  const model = getModel();
  const b64 = await fileToBase64(file);
  const mediaType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
  const body = {
    model,
    max_tokens: 1024,
    tools: [{
      name: "extract_business_card",
      description: "명함 이미지에서 구조화된 연락 정보를 추출합니다.",
      input_schema: CARD_AGENT_SCHEMA
    }],
    tool_choice: { type:"tool", name:"extract_business_card" },
    messages: [{
      role:"user",
      content: [
        { type:"image", source:{ type:"base64", media_type:mediaType, data:b64 } },
        { type:"text", text: CARD_AGENT_PROMPT }
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
    const txt = await res.text();
    let msg = txt; try{ msg = JSON.parse(txt).error?.message || txt; }catch(e){}
    throw new Error("Claude API "+res.status+": "+String(msg).slice(0,240));
  }
  const json = await res.json();
  const block = (json.content||[]).find(c=>c.type==="tool_use" && c.name==="extract_business_card");
  if(!block) throw new Error("에이전트 응답에서 도구 호출을 찾지 못했습니다.");
  return { data: block.input, usage: json.usage, model: json.model };
}

function mapAgentToForm(d){
  const company = d.company || d.company_en || "";
  const contact = [d.contact, d.title].filter(Boolean).join(" ").trim();
  const phone = d.mobile || d.office || "";
  return { company, contact, phone, email: d.email||"" };
}

function renderAgentReview(d, status, meta){
  const conf = d.confidence!=null ? Math.round(d.confidence*100)+"%" : "-";
  const rows = [
    ["회사명",      d.company],
    ["회사명 (EN)", d.company_en],
    ["담당자",      d.contact],
    ["직급",        d.title],
    ["부서",        d.department],
    ["휴대전화",    d.mobile],
    ["사무실",      d.office],
    ["팩스",        d.fax],
    ["이메일",      d.email],
    ["주소",        d.address],
    ["웹사이트",    d.website],
    ["메모",        d.memo],
  ].filter(r=>r[1]);
  const engineLbl = meta.engine==="claude"
    ? `<span class="ok">Claude Vision · ${escapeHtml(meta.model||"")}</span>`
    : `<span class="muted">Tesseract.js</span>`;
  const usage = meta.usage ? ` · in ${meta.usage.input_tokens||0}t · out ${meta.usage.output_tokens||0}t` : "";
  status.innerHTML =
    `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
       <span class="ok">판독 완료</span>
       <span class="muted" style="font-size:11px">${engineLbl} · 신뢰도 ${conf}${usage}</span>
     </div>
     ${rows.length ? `<table class="agent-review"><tbody>${rows.map(([k,v])=>`<tr><th>${k}</th><td>${escapeHtml(v)}</td></tr>`).join("")}</tbody></table>` : `<div class="muted">추출된 필드가 없습니다.</div>`}
     <div class="muted" style="font-size:11px;margin-top:8px">회사명·담당자·연락처·이메일은 고객 정보 폼에 자동으로 반영되었습니다.</div>`;
}

async function runOCR(file){
  const status = document.getElementById("ocrStatus");
  const hasKey = !!getApiKey();
  const hasTess = typeof Tesseract !== "undefined";
  if(!hasKey && !hasTess){
    status.innerHTML = `<span class="err">판독 엔진이 없습니다. 설정 탭에서 API 키를 등록하거나 인터넷 연결을 확인하세요.</span>`;
    return;
  }
  if(hasKey){
    status.innerHTML = `<span class="muted">Claude Vision 명함 파서 에이전트 판독 중…</span>`;
    try{
      const { data, usage, model } = await parseWithClaude(file);
      applyParsed(mapAgentToForm(data));
      renderAgentReview(data, status, { engine:"claude", usage, model });
      return;
    }catch(e){
      const fbMsg = hasTess ? ` Tesseract 로 재시도합니다…` : ``;
      status.innerHTML = `<span class="err">Claude 판독 실패: ${escapeHtml(e.message||String(e))}</span> <span class="muted">${fbMsg}</span>`;
      if(!hasTess) return;
    }
  }
  status.innerHTML += `<div class="muted" style="margin-top:6px">Tesseract.js 인식 중… <span id="ocrPct">0%</span></div>`;
  try{
    const { data } = await Tesseract.recognize(file, "kor+eng", {
      logger: m=>{
        if(m.status && m.progress!=null){
          const p = document.getElementById("ocrPct");
          if(p) p.textContent = Math.round(m.progress*100)+"% ("+m.status+")";
        }
      }
    });
    const parsed = parseCard(data.text||"");
    applyParsed(parsed);
    renderAgentReview({
      company:parsed.company||null, contact:parsed.contact||null,
      mobile:parsed.phone||null, email:parsed.email||null, confidence:0.55
    }, status, { engine:"tesseract" });
  }catch(e){
    status.innerHTML = `<span class="err">Tesseract 인식 실패: ${escapeHtml(String(e))}</span>`;
  }
}

function parseCard(text){
  const lines = text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const joined = lines.join(" ");
  const emailM = joined.match(/[\w.+\-]+@[\w\-]+\.[\w.\-]+/);
  const phoneM = joined.match(/(\+?\d{1,3}[-.\s]?)?(0?\d{1,2}[-.\s]?)\d{3,4}[-.\s]?\d{4}/g);
  const mobile = (phoneM||[]).find(p=>/^(\+?82-?)?0?1\d/.test(p.replace(/\s/g,""))) || (phoneM||[])[0] || "";
  const office = (phoneM||[]).find(p=>p!==mobile) || "";
  // 회사: (주), Co., Ltd, Corporation 등 포함된 라인 우선
  let company = lines.find(l=>/(\(주\)|㈜|주식회사|Co\.?,?\s?Ltd|Corp|Inc|Limited|Company|GmbH|S\.?A\.?)/i.test(l))
             || lines.find(l=>/[A-Za-z]/.test(l)&&l.length<40&&!/@/.test(l))
             || "";
  // 담당자: 한글 2~4자 + 직급/직책 포함
  const titleRx = /(대표|이사|부장|차장|과장|대리|주임|사원|팀장|실장|연구원|박사|상무|전무|본부장|Manager|Director|CEO|CTO|President|Engineer|Lead|Principal)/i;
  let contact = lines.find(l=>titleRx.test(l)) || "";
  if(!contact){
    contact = lines.find(l=>/^[가-힣]{2,4}(\s+[가-힣]{1,6})?$/.test(l)) || "";
  }
  return {
    company: company.replace(/\s+/g," ").trim(),
    contact: contact.replace(/\s+/g," ").trim(),
    phone:   (mobile||office).replace(/\s+/g,""),
    email:   emailM ? emailM[0] : "",
  };
}

function applyParsed(p){
  const filled = [];
  const pairs = [["company","customerName"],["contact","contactPerson"],["phone","contactPhone"],["email","contactEmail"]];
  pairs.forEach(([k,id])=>{
    if(p[k]){ setIfExists(id, p[k]); filled.push(id); }
  });
  filled.forEach(id=>{
    const el = document.getElementById(id); if(!el) return;
    el.classList.remove("flash");
    void el.offsetWidth;
    el.classList.add("flash");
  });
  if(window.mkToast && filled.length) window.mkToast(`${filled.length}개 항목 자동 입력됨`,"ok");
}

// ---------- 발행 견적 보관함 ----------
window.MK_ARCHIVE_SAVE = function(){
  if(typeof cart==="undefined" || !cart.length) return;
  const sub = cart.reduce((s,item)=>{
    const p = item.customPrice!==null ? item.customPrice : getP(item);
    return s + p*item.qty;
  },0);
  const vat = Math.round(sub*0.1);
  const rec = {
    id: "q_"+Date.now(),
    quoteNo: val("quoteNo"),
    issuedAt: new Date().toISOString(),
    customer: currentFormCustomer(),
    grade: currentGrade,
    adjust: window.MK_QUOTE_ADJUST,
    multipliers: JSON.parse(JSON.stringify(window.MK_SETTINGS.multipliers)),
    items: cart.map(it=>({ partNo:it.partNo, description:it.description, qty:it.qty, unit:(it.customPrice!==null?it.customPrice:getP(it)) })),
    subtotal: sub, vat, total: sub+vat,
  };
  const list = loadArchive();
  const i = list.findIndex(x=>x.quoteNo && x.quoteNo===rec.quoteNo);
  if(i>=0) list[i] = rec; else list.unshift(rec);
  saveArchive(list);
  renderArchive();
};
function loadArchive(){ try{ return JSON.parse(localStorage.getItem(MK_LS.archive)||"[]"); }catch(e){ return []; } }
function saveArchive(list){ localStorage.setItem(MK_LS.archive, JSON.stringify(list)); }

function renderArchive(){
  const q = (val("archiveSearch")||"").toLowerCase();
  const list = loadArchive().filter(r=>{
    if(!q) return true;
    return [r.quoteNo, r.customer?.company, r.customer?.contact].some(v=>(v||"").toLowerCase().includes(q));
  });
  const tb = document.getElementById("archiveRows"); if(!tb) return;
  if(!list.length){ tb.innerHTML = `<tr><td colspan="7" class="no-match">발행된 견적이 없습니다.</td></tr>`; return; }
  tb.innerHTML = list.map(r=>{
    const g = ({dealer:"Dealer",oem:"OEM",enduser:"End User"})[r.grade]||"-";
    const dt = r.issuedAt ? r.issuedAt.slice(0,10) : "";
    return `<tr>
      <td><span class="partno">${escapeHtml(r.quoteNo||"-")}</span></td>
      <td>${dt}</td>
      <td>${escapeHtml(r.customer?.company||"")}</td>
      <td><span class="sheet-tag">${g}</span></td>
      <td class="price-cell">${fmt(r.subtotal||0)}원</td>
      <td class="price-cell"><strong>${fmt(r.total||0)}원</strong></td>
      <td style="text-align:right">
        <button class="add-btn" onclick="archiveLoad('${r.id}')">불러오기</button>
        <button class="del-btn" onclick="archiveDelete('${r.id}')">삭제</button>
      </td>
    </tr>`;
  }).join("");
}
function archiveLoad(id){
  const r = loadArchive().find(x=>x.id===id); if(!r) return;
  cart.length = 0;
  r.items.forEach(it=>{
    const prod = ALL_PRODUCTS.find(p=>p.partNo===it.partNo);
    if(prod) cart.push({ ...prod, qty:it.qty, customPrice:it.unit });
  });
  if(r.customer){
    setIfExists("customerName", r.customer.company);
    setIfExists("contactPerson", r.customer.contact);
    setIfExists("contactPhone", r.customer.phone);
    setIfExists("contactEmail", r.customer.email);
  }
  if(r.quoteNo) setIfExists("quoteNo", r.quoteNo);
  if(r.grade && typeof setGrade==="function") setGrade(r.grade);
  if(r.adjust!=null){ window.MK_QUOTE_ADJUST = r.adjust; const s=document.getElementById("quoteAdjust"); if(s){s.value=r.adjust; document.getElementById("quoteAdjustVal").textContent=r.adjust+"%";} }
  renderCart();
  document.getElementById("cartCount").textContent = cart.reduce((s,i)=>s+i.qty,0);
  switchTab("quote");
}
function archiveDelete(id){
  if(!confirm("삭제하시겠습니까?")) return;
  saveArchive(loadArchive().filter(x=>x.id!==id));
  renderArchive();
}
function exportArchive(){ downloadJSON("quotations.json", loadArchive()); }

// ---------- 유틸 ----------
function downloadJSON(name, data){
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

// ---------- 탭 훅 ----------
window.MK_ON_TAB = function(t){
  if(t==="clients") renderClients();
  if(t==="archive") renderArchive();
  if(t==="settings") syncSettingsUI();
};

// ---------- 초기화 ----------
document.addEventListener("DOMContentLoaded", ()=>{
  wireOCR();
  syncSettingsUI();
  renderClients();
  renderArchive();
  refreshEngineStatus();
});
setTimeout(()=>{ wireOCR(); syncSettingsUI(); refreshEngineStatus(); }, 50);
