import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { isTodayKST } from '@/lib/date'
import WriteScreen from '@/components/WriteScreen'
import type { MemoRow } from '@/components/ShortWriter'

// 쓰는 공간은 캐시하지 않는다.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '글쓰기',
  // 휴대폰 홈 화면에 추가하면 이 화면이 바로 열리도록 전용 manifest 를 쓴다.
  // (공개 사이트용 /manifest.json 은 그대로 둔다)
  manifest: '/memo-manifest.json',
}

export default async function WritePage() {
  // 짧은 글은 관리자만 쓴다. 그 밖의 글쓴이는 긴 글만 쓴다.
  const session = await auth()
  const isAdmin = session?.user?.role === 'admin'
  const config = await getSiteConfig()

  let today: MemoRow[] = []
  if (isAdmin) {
    // 넉넉히 가져와 한국 시간 기준 오늘 것만 남긴다
    const { data } = await supabaseAdmin
      .from('posts')
      .select('id, content, topic, created_at')
      .eq('kind', 'note')
      .order('created_at', { ascending: false })
      .limit(40)
    today = ((data || []) as MemoRow[]).filter(m => isTodayKST(m.created_at))
  }

  return <WriteScreen isAdmin={isAdmin} today={today} topics={config.topics} />
}
