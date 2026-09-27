import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { parseTemplates } from '@/lib/templates'
import NotesWarehouse, { WarehouseRow } from '@/components/NotesWarehouse'

// 쓰는 공간은 캐시하지 않는다.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '노트 창고',
  manifest: '/memo-manifest.json',
}

export default async function NotesPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/')

  const config = await getSiteConfig()

  const { data } = await supabaseAdmin
    .from('posts')
    .select('id, title, content, kind, topic, published, created_at, source_note_ids')
    .order('created_at', { ascending: false })

  const { data: templateRow } = await supabaseAdmin
    .from('site_settings').select('value').eq('key', 'templates').maybeSingle()

  // 이미 초안으로 자란 메모 — 따로 컬럼을 두지 않고 source_note_ids 에서 모은다
  const grown = new Set<string>()
  for (const row of data || []) {
    for (const id of (row.source_note_ids as string[] | null) || []) grown.add(id)
  }

  return (
    <NotesWarehouse
      rows={(data || []) as WarehouseRow[]}
      topics={config.topics}
      templates={parseTemplates(templateRow?.value).map(t => ({ id: t.id, name: t.name }))}
      grown={Array.from(grown)}
    />
  )
}
