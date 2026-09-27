import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
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
    .select('id, title, content, kind, topic, published, created_at')
    .order('created_at', { ascending: false })

  return <NotesWarehouse rows={(data || []) as WarehouseRow[]} topics={config.topics} />
}
