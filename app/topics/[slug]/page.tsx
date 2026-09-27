import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { topicFromSlug } from '@/lib/cover'
import { toFeed } from '@/lib/feed'
import { loadSourceNotes } from '@/lib/source-notes'
import PostFeed from '@/components/PostFeed'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: topicFromSlug(slug) }
}

export async function generateStaticParams() {
  const config = await getSiteConfig()
  return config.topics.map(t => ({ slug: encodeURIComponent(t.name) }))
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params
  const name = topicFromSlug(slug)
  const config = await getSiteConfig()

  // 설정에 없는 주제는 없는 페이지로 본다
  if (!config.topics.some(t => t.name === name)) notFound()

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, kind, topic, content, thumbnail_url, excerpt, summary, created_at, source_note_ids')
    .eq('published', true).eq('visibility', 'public').eq('topic', name)
    .order('created_at', { ascending: false })
  assertDbOk(error, `주제/${name}`)

  // 요약 창의 "이 글이 나온 메모" — 공개한 메모만 읽어 온다
  const sourceNotes = await loadSourceNotes(data || [], `주제/${name}/나온 메모`)

  return (
    <div className="wrap" style={{ paddingTop: '28px', paddingBottom: '48px' }}>
      <h1 className="serif" style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 24px' }}>
        {name}
      </h1>
      <PostFeed entries={toFeed(data || [], config.topics, sourceNotes)} topics={config.topics} />
    </div>
  )
}
