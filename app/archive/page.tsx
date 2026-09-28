import type { Metadata } from 'next'
import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { toFeed } from '@/lib/feed'
import { loadSourceNotes } from '@/lib/source-notes'
import PostBrowser from '@/components/PostBrowser'

export const revalidate = 300
export const metadata: Metadata = { title: '전체' }

export default async function ArchivePage() {
  const config = await getSiteConfig()

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, kind, topic, content, thumbnail_url, excerpt, summary, created_at, source_note_ids')
    .eq('published', true).eq('visibility', 'public')
    .order('created_at', { ascending: false })
  assertDbOk(error, '보관함')

  // 요약 창의 "이 글이 나온 메모" — 공개한 메모만 읽어 온다
  const sourceNotes = await loadSourceNotes(data || [], '보관함/나온 메모')

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <div className="wrap" style={{ paddingBottom: '4px' }}>
        <h1 className="serif" style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
          {config.latestTitle}
        </h1>
        <p className="meta-sub" style={{ margin: 0 }}>여기에 열어 둔 글과 메모를 모았습니다.</p>
      </div>
      <PostBrowser entries={toFeed(data || [], config.topics, sourceNotes)}
        topics={config.topics} showTabs={config.showShortNotes} />
    </div>
  )
}
