import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { coverImage, topicFromSlug } from '@/lib/cover'
import { isSeries, parentNameOf, topicNamesUnder } from '@/lib/site-config'
import { loadSeriesNumbers } from '@/lib/series'
import { toFeed } from '@/lib/feed'
import { loadSourceNotes } from '@/lib/source-notes'
import PostBrowser, { TopicIntro } from '@/components/PostBrowser'

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

  // 연재로 보는 주제면 '처음부터' 가 기본이고, 글마다 N화가 붙는다
  const series = isSeries(config.topics, name)
  const seriesNos = await loadSeriesNumbers(config.topics, `주제/${name}/연재 번호`)

  // 소개 카드 — 소개글이 비어 있으면 카드를 아예 그리지 않고 지금처럼 목록만 보인다.
  // 대표 이미지: 직접 올린 것 → 없으면 가장 오래된 공개 긴 글 중 사진이 있는 것 → 없으면 주제 색 표지.
  const topic = config.topics.find(t => t.name === name)
  let intro: TopicIntro | null = null
  if (topic?.description) {
    const firstPhoto = [...(data || [])].reverse()
      .filter(p => p.kind !== 'note').map(p => coverImage(p)).find(Boolean) || null
    intro = {
      name, parent,
      description: topic.description,
      coverUrl: topic.coverUrl || firstPhoto,
      count: (data || []).length,
    }
  }

  // 요약 창의 "이 글이 나온 메모" — 공개한 메모만 읽어 온다
  const sourceNotes = await loadSourceNotes(data || [], `주제/${name}/나온 메모`)

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      {parent && !intro && (
        <p className="wrap meta-sub" style={{ margin: '0 0 4px' }}>{parent} &gt; {name}</p>
      )}
      <PostBrowser entries={toFeed(data || [], config.topics, sourceNotes, seriesNos)}
        topics={config.topics} showTabs={config.showShortNotes} lockedTopic={name}
        intro={intro} series={series} />
    </div>
  )
}
