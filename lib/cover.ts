import { Topic } from './site-config'

/** 본문 HTML 을 미리보기용 평문으로 바꾼다. */
export function toPlainText(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function excerptOf(
  post: { excerpt?: string | null; content?: string | null },
  length = 110,
): string {
  const text = post.excerpt?.trim() || toPlainText(post.content)
  return text.length <= length ? text : text.slice(0, length).trimEnd() + '…'
}

/** 본문 HTML 에서 첫 번째 이미지 주소를 꺼낸다. */
export function firstImage(html: string | null | undefined): string | null {
  if (!html) return null
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : null
}

/**
 * 표지 이미지를 정한다. 고르는 단계를 따로 만들지 않는다.
 *   1) 직접 지정한 thumbnail_url
 *   2) 본문의 첫 이미지
 *   3) 없으면 null — 주제 색 위에 제목을 찍는 타이포 표지를 쓴다
 */
export function coverImage(
  post: { thumbnail_url?: string | null; content?: string | null },
): string | null {
  return post.thumbnail_url?.trim() || firstImage(post.content) || null
}

/** 주제 색. 모르는 주제거나 분류 전이면 강조색을 쓴다. */
export function topicColor(topic: string | null | undefined, topics: Topic[]): string {
  if (!topic) return '#8b5e3c'
  return topics.find(t => t.name === topic)?.color || '#8b5e3c'
}

/** 주제 이름을 주소 조각으로. 제목 자체가 식별자다. */
export function topicSlug(name: string): string {
  return encodeURIComponent(name)
}

/**
 * 주소 조각을 주제 이름으로.
 * 한글 주소는 환경에 따라 한 번 또는 두 번 인코딩된 채로 들어오므로
 * 더 이상 바뀌지 않을 때까지 풀어 준다. (한 번만 풀면 %EC... 가 남아 404 가 났음)
 */
export function topicFromSlug(slug: string): string {
  let cur = slug
  for (let i = 0; i < 3; i++) {
    let next: string
    try { next = decodeURIComponent(cur) } catch { break }
    if (next === cur) break
    cur = next
  }
  return cur
}

/**
 * 배경색이 밝은지 판단한다. (독서 #e9dcc8 처럼 밝은 표지에는 어두운 글자를 쓴다)
 * sRGB 상대 휘도 근사값.
 */
export function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.45
}

/** 표지 배경 위에 얹을 글자색 한 쌍 (본문용 / 흐린 글씨용) */
export function coverInk(bg: string): { fg: string; dim: string } {
  return isLightColor(bg)
    ? { fg: '#2c1a0e', dim: '#6b4f3a' }
    : { fg: '#f5ead9', dim: '#d8c4a8' }
}
