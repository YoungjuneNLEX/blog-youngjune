import { isSeries, Topic } from './site-config'
import { supabaseAdmin, assertDbOk } from './supabase'

/**
 * 연재 번호(N화) 계산.
 *
 * 번호는 "그 글에 붙은 주제 이름 그대로" 같은 주제의 공개 긴 글 중 몇 번째인지다.
 * 대분류 페이지처럼 중분류 글을 함께 보여 주는 목록의 순서와는 다를 수 있다.
 * 연재로 보기가 켜진 주제의 글에만 번호가 붙는다.
 * 기준은 created_at 오래된 순, 공개 글만.
 */
export function seriesNumbers(
  rows: { id: string; topic: string | null; created_at: string }[],
  topics: Topic[],
): Map<string, number> {
  const out = new Map<string, number>()
  const count = new Map<string, number>()
  const sorted = [...rows].sort((a, b) =>
    a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0)
  for (const r of sorted) {
    if (!r.topic || !isSeries(topics, r.topic)) continue
    const n = (count.get(r.topic) || 0) + 1
    count.set(r.topic, n)
    out.set(r.id, n)
  }
  return out
}

/**
 * 공개 긴 글 전부의 연재 번호. 목록 페이지(홈·주제)가 카드와 요약 창에 쓴다.
 * 연재로 보는 주제가 하나도 없으면 조회하지 않는다.
 * DB 조회가 실패하면 예외를 던진다. (캐시된 페이지를 빈 값으로 덮어쓰지 않도록)
 */
export async function loadSeriesNumbers(topics: Topic[], where: string): Promise<Map<string, number>> {
  if (!topics.some(t => isSeries(topics, t.name))) return new Map()

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, topic, created_at')
    .eq('published', true).eq('visibility', 'public').eq('kind', 'article')
    .not('topic', 'is', null)
    .order('created_at', { ascending: true }).order('id', { ascending: true })
  assertDbOk(error, where)

  return seriesNumbers(
    (data || []) as { id: string; topic: string | null; created_at: string }[], topics)
}
