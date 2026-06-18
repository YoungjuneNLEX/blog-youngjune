// 작은 책방 — 서비스 워커 (PWA 설치 + 기본 오프라인 대비)
// 전략: 네트워크 우선 → 실패 시 캐시. 항상 최신을 보여주되, 오프라인이면 캐시로 대체합니다.
const CACHE = 'jakeun-chaekbang-v1';
const PRECACHE = ['/', '/logo.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                 // 글 저장 등 POST는 건드리지 않음
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // 외부(트위터·유튜브 등)는 패스
  if (url.pathname.startsWith('/api/')) return;     // 서버리스 함수는 항상 네트워크
  if (url.pathname.startsWith('/admin')) return;    // 관리자 페이지는 캐시하지 않음(항상 최신)

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/')))
  );
});
