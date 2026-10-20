/**
 * 이 기기에 남은 캐시를 모두 비운다. (서비스 워커가 만든 것 포함)
 * 로그아웃할 때 부른다. 브라우저에서만 쓴다.
 */
export async function clearAppCaches(): Promise<void> {
  try {
    // 서비스 워커에게도 알린다 (워커가 들고 있는 캐시 정리)
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_CACHES' })
  } catch { /* 무시 */ }
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
  } catch { /* 무시 */ }
}
