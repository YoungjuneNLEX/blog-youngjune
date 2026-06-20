// 캐시 버전 — 배포할 때마다 숫자를 올리면 옛 캐시가 모두 비워집니다.
const CACHE = 'book-shop-v3'
const OFFLINE_URL = '/'

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([OFFLINE_URL, '/manifest.json']))
  )
  // 새 서비스 워커를 기다리지 않고 즉시 활성화
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) return

  // 페이지(HTML) 이동 요청은 항상 네트워크 우선 — 항상 최신 화면을 받음
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // 그 외 정적 리소스는 네트워크 우선, 실패 시 캐시 폴백
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return res
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match(OFFLINE_URL)))
  )
})
