import type { Metadata } from 'next'
import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { toFeed } from '@/lib/feed'
import PostFeed from '@/components/PostFeed'

export const revalidate = 300
export const metadata: Metadata = { title: '전체' }

export default async function ArchivePage() {
  const config = await getSiteConfig()

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, kind, topic, content, thumbnail_url, excerpt, summary, created_at')
    .eq('published', true).eq('visibility', 'public')
    .order('created_at', { ascending: false })
  assertDbOk(error, '보관함')

  return (
    <div className="wrap" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
      <h1 className="serif" style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 4px' }}>전체</h1>
      <p className="meta-sub" style={{ margin: '0 0 24px' }}>여기에 열어 둔 글과 메모를 모았습니다.</p>
      <PostFeed entries={toFeed(data || [], config.topics)} topics={config.topics} />
    </div>
  )
}
