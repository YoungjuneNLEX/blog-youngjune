// 적바림 서비스 워커
// 로그인 뒤의 화면·API·비공개 첨부(서명된 주소)는 이 기기에 캐시하지 않는다.
// 캐시하는 것은 내 사이트의 정적 파일(_next/static, icons)뿐이다.
// 로그아웃할 때 화면이 CLEAR_CACHES 메시지를 보내면 캐시를 전부 비운다.
const CACHE = 'jeokbarim-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CLEAR_CACHES') {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))))
  }
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // 다른 도메인(Storage 의 서명된 주소 등)은 건드리지 않는다
  if (url.origin !== self.location.origin) return

  // 정적 파일만 네트워크 우선 → 실패하면 캐시. 페이지·API 는 항상 네트워크로 간다.
  const isStatic = url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')
  if (!isStatic) return

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(req, clone))
        }
        return res
      })
      .catch(() => caches.match(req))
  )
})
