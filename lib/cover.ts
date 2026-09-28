import { NEUTRAL_TOPIC, Topic } from './site-config'

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

/** 주제의 바탕/글자 짝. 모르는 주제거나 분류 전이면 무채색 짝을 쓴다. */
export function topicPair(
  topic: string | null | undefined, topics: Topic[],
): { color: string; ink: string } {
  const found = topic ? topics.find(t => t.name === topic) : undefined
  if (!found) return { ...NEUTRAL_TOPIC }
  return { color: found.color || NEUTRAL_TOPIC.color, ink: found.ink || NEUTRAL_TOPIC.ink }
}

/** 주제 바탕색만 필요할 때 */
export function topicColor(topic: string | null | undefined, topics: Topic[]): string {
  return topicPair(topic, topics).color
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
 * 배경색이 밝은지 판단한다. (파스텔 표지에는 짙은 글자를 쓴다)
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

/**
 * 표지 글자 한 쌍 (제목용 / 흐린 글씨용).
 * 주제에 글자색(ink)이 정해져 있으면 그것을 쓰고, 흐린 글씨는 살짝 연하게 만든다.
 */
export function coverInk(bg: string, ink?: string): { fg: string; dim: string } {
  if (ink) return { fg: ink, dim: fade(ink, 0.72) }
  return isLightColor(bg)
    ? { fg: '#1f1f1f', dim: '#5f5f5f' }
    : { fg: '#ffffff', dim: '#e4e4e2' }
}

/** 글자색을 흰색 쪽으로 살짝 섞어 흐린 글씨용 색을 만든다 */
function fade(hex: string, keep: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (full.length !== 6) return hex
  const mix = (i: number) => {
    const v = parseInt(full.slice(i, i + 2), 16)
    return Math.round(v * keep + 255 * (1 - keep)).toString(16).padStart(2, '0')
  }
  return `#${mix(0)}${mix(2)}${mix(4)}`
}
