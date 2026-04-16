/* ============================================================
   service-worker.js — 최소 PWA 쉘 (Chrome 설치 가능 조건 충족)
   · 네트워크 우선, 실패 시 캐시 fallback
   · 정적 자산 precache (앱 핵심 파일)
   · Supabase / Anthropic / fonts 는 네트워크 전용 (캐시 안 함)
============================================================ */

const CACHE_VERSION = "smartech-v22";
const PRECACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/script.js",
  "/js/product-types.js",
  "/js/extras.js",
  "/js/email-agent.js",
  "/js/supabase-client.js",
  "/manifest.json",
  "/images/smartech_logo.png",
  "/images/icon-192.png",
  "/images/icon-512.png",
];

self.addEventListener("install", (e)=>{
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(PRECACHE).catch(()=>{/* 일부 실패 허용 */}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e)=>{
  const req = e.request;
  const url = new URL(req.url);

  // 동일 오리진만 캐시 전략 적용
  if(url.origin !== self.location.origin){ return; /* 네트워크 기본 동작 */ }
  if(req.method !== "GET") return;

  // HTML: 네트워크 우선 (최신 UI 유지), 실패 시 캐시
  if(req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")){
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        return resp;
      }).catch(() => caches.match(req).then(r => r || caches.match("/index.html")))
    );
    return;
  }

  // JS/CSS/이미지: stale-while-revalidate
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(resp => {
        if(resp && resp.ok){
          const copy = resp.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return resp;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});
