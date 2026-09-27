import { supabaseAdmin, assertDbOk } from './supabase'
import { toPlainText } from './cover'

/**
 * 초안의 밑이 된 메모 본문을 한 번에 읽어 온다.
 * 공개한 메모(published + visibility='public')만 담는다.
 * 비공개 메모는 아예 담기지 않으므로 요약 창에도 새어 나가지 않는다.
 */
export async function loadSourceNotes(
  rows: { source_note_ids?: string[] | null }[],
  where: string,
): Promise<Map<string, string>> {
  const ids = Array.from(new Set(rows.flatMap(r => r.source_note_ids || [])))
  if (ids.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, content')
    .in('id', ids)
    .eq('kind', 'note').eq('published', true).eq('visibility', 'public')
  assertDbOk(error, where)

  // 요약 창에는 한 줄만 보이므로 너무 긴 메모는 앞부분만 담는다
  return new Map((data || []).map(n => {
    const text = toPlainText(n.content)
    return [n.id as string, text.length > 120 ? text.slice(0, 120) + '…' : text]
  }))
}
