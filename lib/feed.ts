import { coverImage, excerptOf, toPlainText } from './cover'
import { Topic } from './site-config'
import { readingMinutes, shortDate, sourceNotesOf, summaryLines } from './public'

/** 주제·보관함 목록에 쓰는 한 줄 */
export interface FeedEntry {
  id: string
  kind: 'article' | 'note'
  title: string
  topic: string | null
  topicLabel: string
  image: string | null
  dateText: string
  minutes: number
  summary: string[]
  excerpt: string
  text: string          // 메모 본문 (kind='note' 일 때)
  sourceNotes: { id: string; text: string }[]
  seriesNo: number | null   // 연재로 보는 주제의 N화 (아니면 null)
}

interface Row {
  id: string
  title: string
  kind: string
  topic: string | null
  content: string | null
  thumbnail_url: string | null
  excerpt: string | null
  summary: string | null
  created_at: string
  source_note_ids?: string[] | null
}

export function toFeed(
  rows: Row[], topics: Topic[], notes?: Map<string, string>, series?: Map<string, number>,
): FeedEntry[] {
  return rows.map(p => ({
    id: p.id,
    kind: p.kind === 'note' ? 'note' : 'article',
    title: p.title,
    topic: p.topic,
    topicLabel: topics.find(t => t.name === p.topic)?.short || p.topic || '분류 전',
    image: coverImage(p),
    dateText: shortDate(p.created_at),
    minutes: readingMinutes(p.content),
    summary: summaryLines(p.summary),
    excerpt: excerptOf(p, 120),
    text: toPlainText(p.content),
    sourceNotes: sourceNotesOf(p.source_note_ids, notes),
    seriesNo: p.kind === 'note' ? null : series?.get(p.id) ?? null,
  }))
}
