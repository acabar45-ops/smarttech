/* ============================================================
   extras.js — Supabase edition (No localStorage)
   · 설정 (등급 배수) → smartech_user_settings
   · 고객 관리 → smartech_clients
   · 발행 보관함 → smartech_quotations
   · 명함 OCR → Claude 프록시 (Edge Function)
============================================================ */

window.MK_SETTINGS = { multipliers: { dealer:100, oem:100, enduser:100 }, model_preference: "haiku" };
window.MK_QUOTE_ADJUST = 100;
window.MK_MUL_EDIT = false;
window.MK_MUL_SNAPSHOT = null;
let MK_CLIENTS = [];
let MK_ARCHIVE = [];

function requireUser(){
  if(!window.MK_USER){ alert("로그인이 필요합니다. 상단 로그인 바를 확인하세요."); return false; }
  return true;
}
function sb(){ return window.MK_SB; }

async function loadUserSettings(){
  if(!window.MK_USER) return;
  const { data, error } = await sb().from("smartech_user_settings").select("*").eq("user_id", window.MK_USER.id).maybeSingle();
  if(error){ console.warn("settings load", error); return; }
  if(data){
    window.MK_SETTINGS.multipliers = data.multipliers || window.MK_SETTINGS.multipliers;
    window.MK_SETTINGS.model_preference = data.model_preference || "haiku";
  } else {
    await sb().from("smartech_user_settings").insert({ user_id: window.MK_USER.id });
  }
  syncSettingsUI();
  if(typeof renderCart==="function") renderCart();
}

async function persistSettings(){
  if(!window.MK_USER) return;
  await sb().from("smartech_user_settings").upsert({
    user_id: window.MK_USER.id,
    multipliers: window.MK_SETTINGS.multipliers,
    model_preference: window.MK_SETTINGS.model_preference,
  }, { onConflict: "user_id" });
}

function clampPct(val){
  const n = parseFloat(val);
  if(!isFinite(n)) return 100;
  return Math.max(50, Math.min(150, Math.round(n*10)/10));
}
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

function updateMul(grade, v){
  const n = clampPct(v);
  window.MK_SETTINGS.multipliers[grade] = n;
  if(!window.MK_MUL_EDIT) persistSettings();
  const setV = document.getElementById("set"+cap(grade)+"Val");
  const setR = document.getElementById("set"+cap(grade));
  const mulI = document.getElementById("mul"+cap(grade));
  if(setV && document.activeElement!==setV) setV.value = n;
  if(setR && document.activeElement!==setR) setR.value = n;
  if(mulI && document.activeElement!==mulI) mulI.value = n;
  if(typeof renderCart==="function") renderCart();
}
function enterMulEdit(){
  if(!requireUser()) return;
  window.MK_MUL_EDIT = true;
  window.MK_MUL_SNAPSHOT = JSON.parse(JSON.stringify(window.MK_SETTINGS.multipliers));
  setMulInputsEnabled(true); toggleMulBtns(true);
}
async function saveMulEdit(){
  ["dealer","oem","enduser"].forEach(g=>{
    const el = document.getElementById("set"+cap(g)+"Val");
    if(el) window.MK_SETTINGS.multipliers[g] = clampPct(el.value);
  });
  await persistSettings();
  window.MK_MUL_EDIT = false; window.MK_MUL_SNAPSHOT = null;
  setMulInputsEnabled(false); toggleMulBtns(false);
  syncSettingsUI();
  if(typeof renderCart==="function") renderCart();
  flashLock("저장됨");
}
function cancelMulEdit(){
  if(window.MK_MUL_SNAPSHOT) window.MK_SETTINGS.multipliers = window.MK_MUL_SNAPSHOT;
  window.MK_MUL_EDIT = false; window.MK_MUL_SNAPSHOT = null;
  setMulInputsEnabled(false); toggleMulBtns(false);
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
  if(!pill) return;
  pill.textContent = txt; pill.classList.add("saved");
  setTimeout(()=>{ pill.textContent = "잠금"; pill.classList.remove("saved"); }, 1400);
}
async function resetMul(){
  if(!confirm("모든 등급 배수를 100%로 초기화하시겠습니까?")) return;
  window.MK_SETTINGS.multipliers = { dealer:100, oem:100, enduser:100 };
  await persistSettings();
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
  const tgl = document.getElementById("useHighModel");
  if(tgl) tgl.checked = window.MK_SETTINGS.model_preference === "sonnet";
}

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
  const s = document.getElementById("quoteAdjust"); if(s) s.value = 100;
  const n = document.getElementById("quoteAdjustNum"); if(n) n.value = 100;
  if(typeof renderCart==="function") renderCart();
}

async function onModelToggle(){
  const hi = document.getElementById("useHighModel");
  window.MK_SETTINGS.model_preference = hi && hi.checked ? "sonnet" : "haiku";
  await persistSettings();
  refreshEngineStatus();
}
function getModel(){
  return window.MK_SETTINGS.model_preference === "sonnet" ? "claude-sonnet-4-6" : "claude-haiku-4-5";
}

// ---------- 고객 관리 ----------
function val(id){ const el=document.getElementById(id); return el?el.value.trim():""; }
function setIfExists(id,v){ const el=document.getElementById(id); if(el) el.value = v||""; }

function currentFormCustomer(){
  return {
    company: val("customerName"),
    contact: val("contactPerson"),
    phone:   val("contactPhone"),
    email:   val("contactEmail"),
    grade:   (typeof currentGrade!=="undefined"?currentGrade:"dealer"),
  };
}

async function saveCurrentCustomer(){
  if(!requireUser()) return;
  const c = currentFormCustomer();
  if(!c.company && !c.contact){ alert("회사명 또는 담당자를 입력하세요."); return; }
  const key = (c.company||"") + "|" + (c.email||"");
  const existing = MK_CLIENTS.find(x => ((x.company||"")+"|"+(x.email||""))===key);
  if(existing){
    const { error } = await sb().from("smartech_clients").update(c).eq("id", existing.id);
    if(error){ alert("저장 실패: "+error.message); return; }
  } else {
    const { error } = await sb().from("smartech_clients").insert({ ...c, user_id: window.MK_USER.id });
    if(error){ alert("저장 실패: "+error.message); return; }
  }
  await loadClients();
  alert("고객 정보가 저장되었습니다.");
}

async function loadClients(){
  if(!window.MK_USER){ MK_CLIENTS = []; renderClients(); return; }
  const { data, error } = await sb().from("smartech_clients").select("*").order("updated_at", { ascending: false });
  if(error){ console.warn("clients load", error); return; }
  MK_CLIENTS = data || [];
  renderClients();
}

function renderClients(){
  const q = (val("clientSearch")||"").toLowerCase();
  const list = MK_CLIENTS.filter(c=>{
    if(!q) return true;
    return [c.company,c.contact,c.email,c.phone].some(v=>(v||"").toLowerCase().includes(q));
  });
  const tbody = document.getElementById("clientRows");
  if(!tbody) return;
  if(!list.length){ tbody.innerHTML = `<tr><td colspan="7" class="no-match">${window.MK_USER ? "저장된 고객이 없습니다." : "로그인 후 이용 가능합니다."}</td></tr>`; return; }
  tbody.innerHTML = list.map(c=>{
    const upd = c.updated_at ? c.updated_at.slice(0,10) : "";
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
  const c = MK_CLIENTS.find(x=>x.id===id); if(!c) return;
  setIfExists("customerName", c.company);
  setIfExists("contactPerson", c.contact);
  setIfExists("contactPhone", c.phone);
  setIfExists("contactEmail", c.email);
  if(c.grade && typeof setGrade==="function") setGrade(c.grade);
  switchTab("quote");
}
async function deleteClient(id){
  if(!confirm("삭제하시겠습니까?")) return;
  const { error } = await sb().from("smartech_clients").delete().eq("id", id);
  if(error){ alert("삭제 실패: "+error.message); return; }
  await loadClients();
}
function exportClients(){ downloadJSON("clients.json", MK_CLIENTS); }
async function importClients(ev){
  if(!requireUser()) return;
  const f = ev.target.files[0]; if(!f) return;
  const fr = new FileReader();
  fr.onload = async e=>{
    try{
      const data = JSON.parse(e.target.result);
      if(!Array.isArray(data)) throw 0;
      const rows = data.map(c=>({
        user_id: window.MK_USER.id,
        company:c.company, company_en:c.company_en, contact:c.contact, title:c.title,
        department:c.department, phone:c.phone, mobile:c.mobile, office:c.office,
        fax:c.fax, email:c.email, address:c.address, website:c.website, memo:c.memo,
        grade:c.grade||"dealer",
      }));
      const { error } = await sb().from("smartech_clients").insert(rows);
      if(error){ alert("가져오기 실패: "+error.message); return; }
      await loadClients();
      alert("가져오기 완료: "+rows.length+"건");
    }catch(e){ alert("JSON 파일이 올바르지 않습니다."); }
  };
  fr.readAsText(f);
}

// ---------- OCR ----------
function wireOCR(){
  const input = document.getElementById("ocrInput");
  const drop = document.getElementById("ocrDrop");
  if(!input||!drop) return;
  if(input._wired) return;
  input._wired = true;
  input.addEventListener("change", e=>{ const f=e.target.files[0]; if(f) runOCR(f); });
  ["dragover","dragenter"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag");}));
  ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag");}));
  drop.addEventListener("drop", e=>{ const f=e.dataTransfer.files[0]; if(f) runOCR(f); });
}

function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const fr = new FileReader();
    fr.onload = ()=>{ const s=fr.result; const i=s.indexOf(","); resolve(s.slice(i+1)); };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

const CARD_AGENT_PROMPT = `당신은 한국·영문 명함 판독 전문 에이전트입니다.
제공된 명함 이미지에서 구조화된 정보를 추출하여 extract_business_card 도구로 단 한 번 반환하십시오.

판독 규칙:
1. 회사명은 명함 표기 그대로 반환하며 법인격(㈜, (주), 주식회사, Co., Ltd., Corporation, Inc.)을 임의로 생략·축약·번역하지 마십시오.
2. 한국 전화번호는 하이픈 포함으로 정규화: 휴대전화 010-0000-0000, 서울 02-000-0000, 그 외 지역 031-000-0000 등.
3. 국가코드(+82)가 있으면 제거 후 맨 앞에 0을 붙입니다.
4. 휴대전화(010/011/016/017/018/019)와 사무실 번호를 분리합니다.
5. 직급은 title, 부서는 department 로 분리합니다.
6. 한글·영문 회사명 병기 시 company / company_en 로 분리합니다.
7. 명함에 없는 필드는 반드시 null. 추측 금지.
8. confidence 는 전체 판독 자체평가(0.0~1.0).
9. 출력은 extract_business_card 도구 호출 1회로만.`;

const CARD_AGENT_SCHEMA = {
  type:"object",
  properties:{
    company:{type:["string","null"]}, company_en:{type:["string","null"]},
    contact:{type:["string","null"]}, title:{type:["string","null"]}, department:{type:["string","null"]},
    mobile:{type:["string","null"]}, office:{type:["string","null"]}, fax:{type:["string","null"]},
    email:{type:["string","null"]}, address:{type:["string","null"]}, website:{type:["string","null"]},
    memo:{type:["string","null"]}, confidence:{type:"number",minimum:0,maximum:1}
  },
  required:["confidence"]
};

async function parseCardViaProxy(file){
  const b64 = await fileToBase64(file);
  const mediaType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
  const json = await mkCallClaude({
    model: getModel(),
    max_tokens: 1024,
    tools: [{ name:"extract_business_card", description:"명함 이미지에서 구조화된 연락 정보를 추출합니다.", input_schema: CARD_AGENT_SCHEMA }],
    tool_choice: { type:"tool", name:"extract_business_card" },
    messages: [{
      role:"user",
      content: [
        { type:"image", source:{ type:"base64", media_type:mediaType, data:b64 } },
        { type:"text", text: CARD_AGENT_PROMPT }
      ]
    }]
  });
  const block = (json.content||[]).find(c=>c.type==="tool_use" && c.name==="extract_business_card");
  if(!block) throw new Error("응답에서 도구 호출을 찾지 못했습니다.");
  return { data: block.input, usage: json.usage, model: json.model };
}

function mapAgentToForm(d){
  const company = d.company || d.company_en || "";
  const contact = [d.contact, d.title].filter(Boolean).join(" ").trim();
  const phone = d.mobile || d.office || "";
  return { company, contact, phone, email: d.email||"" };
}
function applyParsed(p){
  if(p.company) setIfExists("customerName", p.company);
  if(p.contact) setIfExists("contactPerson", p.contact);
  if(p.phone)   setIfExists("contactPhone", p.phone);
  if(p.email)   setIfExists("contactEmail", p.email);
}
function renderAgentReview(d, status, meta){
  const conf = d.confidence!=null ? Math.round(d.confidence*100)+"%" : "-";
  const rows = [
    ["회사명",d.company],["회사명 (EN)",d.company_en],["담당자",d.contact],["직급",d.title],
    ["부서",d.department],["휴대전화",d.mobile],["사무실",d.office],["팩스",d.fax],
    ["이메일",d.email],["주소",d.address],["웹사이트",d.website],["메모",d.memo],
  ].filter(r=>r[1]);
  const engineLbl = `<span class="ok">Claude Vision · ${escapeHtml(meta.model||"")}</span>`;
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
  if(!window.MK_USER){ status.innerHTML = `<span class="err">로그인이 필요합니다.</span>`; return; }
  status.innerHTML = `<span class="muted">Claude Vision 명함 파서 에이전트 판독 중…</span>`;
  try{
    const { data, usage, model } = await parseCardViaProxy(file);
    applyParsed(mapAgentToForm(data));
    renderAgentReview(data, status, { usage, model });
  }catch(e){
    status.innerHTML = `<span class="err">판독 실패: ${escapeHtml(e.message||String(e))}</span>`;
  }
}

// ---------- 발행 보관함 ----------
window.MK_ARCHIVE_SAVE = async function(){
  if(!window.MK_USER) return;
  if(typeof cart==="undefined" || !cart.length) return;
  const sub = cart.reduce((s,item)=>{
    const p = item.customPrice!==null ? item.customPrice : getP(item);
    return s + p*item.qty;
  },0);
  const vat = Math.round(sub*0.1);
  const rec = {
    user_id: window.MK_USER.id,
    quote_no: val("quoteNo") || ("Q"+Date.now()),
    grade: currentGrade,
    adjust_pct: window.MK_QUOTE_ADJUST,
    multipliers: JSON.parse(JSON.stringify(window.MK_SETTINGS.multipliers)),
    customer: currentFormCustomer(),
    items: cart.map(it=>({ partNo:it.partNo, description:it.description, qty:it.qty, unit:(it.customPrice!==null?it.customPrice:getP(it)) })),
    subtotal: sub, vat, total: sub+vat,
    issued_at: new Date().toISOString(),
  };
  const { error } = await sb().from("smartech_quotations").upsert(rec, { onConflict: "user_id,quote_no" });
  if(error){ console.warn("archive save", error); return; }
  await loadArchive();
};

async function loadArchive(){
  if(!window.MK_USER){ MK_ARCHIVE = []; renderArchive(); return; }
  const { data, error } = await sb().from("smartech_quotations").select("*").order("issued_at", { ascending:false }).limit(500);
  if(error){ console.warn("archive load", error); return; }
  MK_ARCHIVE = data || [];
  renderArchive();
}

function renderArchive(){
  const q = (val("archiveSearch")||"").toLowerCase();
  const list = MK_ARCHIVE.filter(r=>{
    if(!q) return true;
    return [r.quote_no, r.customer?.company, r.customer?.contact].some(v=>(v||"").toLowerCase().includes(q));
  });
  const tb = document.getElementById("archiveRows"); if(!tb) return;
  if(!list.length){ tb.innerHTML = `<tr><td colspan="7" class="no-match">${window.MK_USER ? "발행된 견적이 없습니다." : "로그인 후 이용 가능합니다."}</td></tr>`; return; }
  tb.innerHTML = list.map(r=>{
    const g = ({dealer:"Dealer",oem:"OEM",enduser:"End User"})[r.grade]||"-";
    const dt = r.issued_at ? r.issued_at.slice(0,10) : "";
    return `<tr>
      <td><span class="partno">${escapeHtml(r.quote_no||"-")}</span></td>
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
  const r = MK_ARCHIVE.find(x=>x.id===id); if(!r) return;
  cart.length = 0;
  (r.items||[]).forEach(it=>{
    const prod = ALL_PRODUCTS.find(p=>p.partNo===it.partNo);
    if(prod) cart.push({ ...prod, qty:it.qty, customPrice:it.unit });
  });
  if(r.customer){
    setIfExists("customerName", r.customer.company);
    setIfExists("contactPerson", r.customer.contact);
    setIfExists("contactPhone", r.customer.phone);
    setIfExists("contactEmail", r.customer.email);
  }
  if(r.quote_no) setIfExists("quoteNo", r.quote_no);
  if(r.grade && typeof setGrade==="function") setGrade(r.grade);
  if(r.adjust_pct!=null){
    window.MK_QUOTE_ADJUST = Number(r.adjust_pct);
    const s=document.getElementById("quoteAdjust"); if(s) s.value=r.adjust_pct;
    const n=document.getElementById("quoteAdjustNum"); if(n) n.value=r.adjust_pct;
  }
  renderCart();
  document.getElementById("cartCount").textContent = cart.reduce((s,i)=>s+i.qty,0);
  switchTab("quote");
}
async function archiveDelete(id){
  if(!confirm("삭제하시겠습니까?")) return;
  const { error } = await sb().from("smartech_quotations").delete().eq("id", id);
  if(error){ alert("삭제 실패: "+error.message); return; }
  await loadArchive();
}
function exportArchive(){ downloadJSON("quotations.json", MK_ARCHIVE); }

// ---------- 유틸 ----------
function downloadJSON(name, data){
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

window.MK_ON_TAB = function(t){
  if(t==="clients") loadClients();
  if(t==="archive") loadArchive();
  if(t==="settings") syncSettingsUI();
};

function refreshEngineStatus(){
  const el = document.getElementById("engineStatus"); if(!el) return;
  if(window.MK_USER){
    el.innerHTML = `<span class="ok">● Supabase 로그인 완료 — Claude 프록시 활성</span> <span class="muted">(${escapeHtml(window.MK_USER.email||"")} · model: ${getModel()})</span>`;
  } else {
    el.innerHTML = `<span class="err">● 로그인 필요</span>`;
  }
}

function renderAuthBar(){
  const bar = document.getElementById("authBar"); if(!bar) return;
  if(window.MK_USER){
    bar.innerHTML = `
      <span class="auth-email">${escapeHtml(window.MK_USER.email||"")}</span>
      <button class="btn-mini" onclick="mkSignOut()">로그아웃</button>`;
  } else {
    bar.innerHTML = `
      <input type="email" id="loginEmail" placeholder="you@company.com" class="auth-input" onkeydown="if(event.key==='Enter')doSignIn()">
      <button class="btn-mini" onclick="doSignIn()">매직링크 전송</button>`;
  }
}
async function doSignIn(){
  const email = (document.getElementById("loginEmail").value||"").trim();
  if(!email){ alert("이메일을 입력하세요."); return; }
  try{ await mkSignIn(email); alert("매직링크를 이메일로 전송했습니다. 받은편지함을 확인해 주세요."); }
  catch(e){ alert("로그인 요청 실패: "+(e.message||e)); }
}

window.MK_ON_AUTH = async function(user){
  renderAuthBar();
  refreshEngineStatus();
  if(user){
    await loadUserSettings();
    await loadClients();
    await loadArchive();
  } else {
    MK_CLIENTS = []; MK_ARCHIVE = [];
    renderClients(); renderArchive();
    window.MK_SETTINGS = { multipliers: { dealer:100, oem:100, enduser:100 }, model_preference:"haiku" };
    syncSettingsUI();
    if(typeof renderCart==="function") renderCart();
  }
};

document.addEventListener("DOMContentLoaded", ()=>{
  wireOCR();
  renderAuthBar();
  refreshEngineStatus();
});
setTimeout(()=>{ wireOCR(); renderAuthBar(); refreshEngineStatus(); }, 50);
