import { supabaseAdmin } from '@/lib/supabase'
import MemoScreen, { MemoRow } from '@/components/MemoScreen'

/** 빠른 메모 — 제목 없이 바로 적는다. 최근 메모는 날짜별로 아래에 쌓인다. */
export default async function MemoPage() {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, content, created_at')
    .eq('kind', 'note')
    .order('created_at', { ascending: false })
    .limit(40)

  return <MemoScreen initial={(data || []) as MemoRow[]} loadFailed={Boolean(error)} />
}
