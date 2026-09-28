import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { topicFromSlug } from '@/lib/cover'
import { parentNameOf, topicNamesUnder } from '@/lib/site-config'
import { toFeed } from '@/lib/feed'
import { loadSourceNotes } from '@/lib/source-notes'
import PostBrowser from '@/components/PostBrowser'

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

  // 대분류면 그 대분류 글 + 모든 중분류 글을 함께 보여 준다
  const names = topicNamesUnder(config.topics, name)

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, kind, topic, content, thumbnail_url, excerpt, summary, created_at, source_note_ids')
    .eq('published', true).eq('visibility', 'public').in('topic', names)
    .order('created_at', { ascending: false })
  assertDbOk(error, `주제/${name}`)

  // 중분류면 "대분류 > 중분류" 로 어디에 있는지 보여 준다
  const parent = parentNameOf(config.topics, name)

  // 요약 창의 "이 글이 나온 메모" — 공개한 메모만 읽어 온다
  const sourceNotes = await loadSourceNotes(data || [], `주제/${name}/나온 메모`)

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      {parent && (
        <p className="wrap meta-sub" style={{ margin: '0 0 4px' }}>{parent} &gt; {name}</p>
      )}
      <PostBrowser entries={toFeed(data || [], config.topics, sourceNotes)}
        topics={config.topics} showTabs={config.showShortNotes} lockedTopic={name} />
    </div>
  )
}
