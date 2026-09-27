import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import QuickMemo, { MemoRow } from '@/components/QuickMemo'

// 쓰는 공간은 캐시하지 않는다.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '적바림',
  // 휴대폰 홈 화면에 추가하면 이 화면이 바로 열리도록 전용 manifest 를 쓴다.
  // (공개 사이트용 /manifest.json 은 그대로 둔다)
  manifest: '/memo-manifest.json',
}

export default async function MemoPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/')

  const config = await getSiteConfig()

  const { data } = await supabaseAdmin
    .from('posts')
    .select('id, content, topic, created_at')
    .eq('kind', 'note')
    .order('created_at', { ascending: false })
    .limit(10)

  return <QuickMemo topics={config.topics} recent={(data || []) as MemoRow[]} />
}
