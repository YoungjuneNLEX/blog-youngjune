// 짧은 글(평문)과 긴 글(HTML) 사이를 오갈 때 쓰는 변환.
// 글쓰기 화면에서 [짧은 글 | 긴 글] 을 바꿔도 쓰던 본문이 그대로 따라가게 한다.

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
const escapeHtml = (s: string) => s.replace(/[&<>]/g, c => ESC[c])

/** 평문 → 에디터 HTML. 줄마다 문단 하나. */
export function textToHtml(text: string): string {
  if (!text.trim()) return ''
  return text.replace(/\r\n/g, '\n').split('\n')
    .map(line => (line.trim() ? `<p>${escapeHtml(line)}</p>` : '<p></p>'))
    .join('')
}

/** 에디터 HTML → 평문. 문단·줄바꿈은 줄바꿈으로 남긴다. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li|blockquote|pre|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 짧은 글로 옮기면 사라지는 서식(이미지·제목·목록·표·인용)이 있는지 */
export function hasRichFormat(html: string): boolean {
  return /<(img|table|h[1-6]|ul|ol|blockquote|pre|a\s)/i.test(html)
}
