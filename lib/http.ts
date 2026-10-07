/**
 * 시간 제한이 있는 fetch.
 * 휴대폰은 통신이 잠깐 끊기거나 앱이 뒤로 가면 요청이 끝나지 않고 매달릴 수 있다.
 * 그러면 "저장 중…"에서 영원히 멈추므로, 정해진 시간이 지나면 끊고 오류로 돌려준다.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  ms = 20000,
): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(input, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** 사람이 읽을 오류 문구 */
export function networkErrorMessage(e: unknown): string {
  if (e instanceof DOMException && e.name === 'AbortError') {
    return '응답이 너무 늦어 멈췄습니다. 쓴 글은 그대로 있으니 다시 눌러 주세요.'
  }
  return '연결이 끊겼습니다. 쓴 글은 그대로 있으니 잠시 뒤 다시 눌러 주세요.'
}
