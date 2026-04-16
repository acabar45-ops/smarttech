/* ============================================================
   supabase-client.js
   · Supabase 세션 (sessionStorage — localStorage 미사용)
   · Magic-link 로그인/로그아웃
   · Claude 프록시 Edge Function 호출
============================================================ */

const SB_URL = "https://dmnppqcpymougyvkmajm.supabase.co";
const SB_ANON = "sb_publishable_cNy-sfwm4TQK1nYxEQwDuQ_dyR0Jwen";
const SB_FN = "smartech-claude-proxy";

window.MK_SB = null;
window.MK_USER = null;
window.MK_ON_AUTH = null;

function initSupabase(){
  if(!window.supabase){ console.error("Supabase SDK not loaded"); return; }
  window.MK_SB = window.supabase.createClient(SB_URL, SB_ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: window.sessionStorage,    // ⚠ localStorage 사용 금지
      storageKey: "smartech_auth",
      flowType: "pkce",
    },
    global: {
      headers: { "x-application": "smartech-quotation" }
    }
  });
  window.MK_SB.auth.onAuthStateChange((_ev, session)=>{
    window.MK_USER = session?.user || null;
    if(window.MK_ON_AUTH) window.MK_ON_AUTH(window.MK_USER);
  });
  // 세션 초기 로딩
  window.MK_SB.auth.getSession().then(({ data })=>{
    window.MK_USER = data.session?.user || null;
    if(window.MK_ON_AUTH) window.MK_ON_AUTH(window.MK_USER);
  });
}

// 이메일+비밀번호 로그인
async function mkSignInPw(email, password){
  const { data, error } = await window.MK_SB.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data;
}
// 회원가입 (이메일 인증 off 전제 → 즉시 세션 발급)
async function mkSignUp(email, password){
  const { data, error } = await window.MK_SB.auth.signUp({ email, password });
  if(error) throw error;
  return data;
}
// 매직링크 (백업용으로 유지)
async function mkSignIn(email){
  const { error } = await window.MK_SB.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname }
  });
  if(error) throw error;
}
async function mkSignOut(){
  await window.MK_SB.auth.signOut();
  window.MK_USER = null;
  window.location.reload();
}

/* ---------- Claude 프록시 호출 ----------
 * 브라우저에는 Anthropic 키가 없음. Supabase Edge Function 이
 * 서버 측 시크릿으로 대리 호출. JWT 검증 필수. */
async function mkCallClaude(body){
  if(!window.MK_USER){ throw new Error("로그인이 필요합니다."); }
  const { data: s } = await window.MK_SB.auth.getSession();
  const token = s.session?.access_token;
  if(!token){ throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요."); }
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(), 90000); // 90s hard timeout
  let res;
  try{
    res = await fetch(`${SB_URL}/functions/v1/${SB_FN}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${token}`,
        "apikey": SB_ANON,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch(e){
    clearTimeout(timeout);
    if(e.name === "AbortError") throw new Error("요청 타임아웃 (90초 초과)");
    throw e;
  }
  clearTimeout(timeout);
  const text = await res.text();
  let json; try{ json = JSON.parse(text); }catch(e){ throw new Error("프록시 응답 파싱 실패: "+text.slice(0,200)); }
  if(!res.ok){
    const msg = json?.error?.message || text;
    throw new Error("Claude 프록시 "+res.status+": "+String(msg).slice(0,240));
  }
  return json;
}

initSupabase();
