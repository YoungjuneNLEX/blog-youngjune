import { toPlainText } from '@/lib/cover'

// X 는 링크를 23자로 셈한다. 280 에서 링크와 사이 공백을 빼고 여유를 둔다.
export const X_TEXT_LIMIT = 250

/**
 * 짧은 글 하나를 X 에 올리는 글쓰기 창(웹 인텐트) 주소.
 * 본문이 길면 앞부분 + "…" 만 넣고, 원문 링크(/posts/[id])를 붙인다.
 * 글관리의 'X에 공유'와 글쓰기의 '공개 + X'가 같은 함수를 쓴다. X API 는 쓰지 않는다.
 */
export function xShareUrl(id: string, content: string | null | undefined): string {
  const body = toPlainText(content)
  const text = body.length > X_TEXT_LIMIT
    ? body.slice(0, X_TEXT_LIMIT - 1).trimEnd() + '…'
    : body
  const link = `${window.location.origin}/posts/${id}`
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`
}

/**
 * X 창을 새 창으로 연다. 열렸으면 true, 팝업이 막혔으면 false.
 * noopener 를 주면 열려도 null 이 돌아와 막힘을 알 수 없으므로,
 * 그냥 열고 나서 opener 를 끊는다.
 */
export function openXWindow(url: string): boolean {
  const w = window.open(url, '_blank')
  if (!w) return false
  try { w.opener = null } catch { /* 끊지 못해도 창은 열려 있다 */ }
  return true
}
