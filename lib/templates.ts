/**
 * 글 템플릿 — 글쓰기 화면에서 불러다 쓰는 뼈대.
 * site_settings 의 key='templates' 에 JSON 배열로 담는다. (테이블을 새로 만들지 않는다)
 */
export interface PostTemplate {
  id: string
  name: string
  body: string   // 에디터에 넣을 HTML
}

export const DEFAULT_TEMPLATES: PostTemplate[] = [
  {
    id: 'qa',
    name: '질의응답',
    body:
      '<p><strong>날짜</strong></p><p></p>' +
      '<p><strong>Q.</strong></p><p></p>' +
      '<p><strong>A.</strong></p><p></p>' +
      '<p><strong>근거</strong></p><p></p>',
  },
  {
    id: 'book',
    name: '독후감',
    body:
      '<p><strong>책 · 저자</strong></p><p></p>' +
      '<p><strong>인상 깊은 문장</strong></p><blockquote><p></p></blockquote>' +
      '<p><strong>내 생각</strong></p><p></p>',
  },
  {
    id: 'devotion',
    name: '묵상',
    body:
      '<p><strong>본문</strong></p><p></p>' +
      '<p><strong>느낀 점</strong></p><p></p>' +
      '<p><strong>오늘의 적용</strong></p><p></p>',
  },
]

/** 저장된 값이 깨졌어도 안전하게 배열로 만든다. */
export function parseTemplates(value: unknown): PostTemplate[] {
  const raw = typeof value === 'string' ? safeParse(value) : value
  if (!Array.isArray(raw)) return []
  return raw
    .filter((t): t is PostTemplate =>
      !!t && typeof t.name === 'string' && t.name.trim() !== '' && typeof t.body === 'string')
    .map((t, i) => ({ id: String(t.id || `t${i}`), name: t.name.trim(), body: t.body }))
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s) } catch { return null }
}
