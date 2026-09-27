import { formatDateTime } from './date'
import { excerptOf, toPlainText } from './cover'

/** 글 한 편을 카드·요약 창에 쓰기 좋은 모양으로 추린 것 */
export interface StoryCard {
  id: string
  title: string
  topic: string | null
  image: string | null
  dateText: string        // 9월 25일
  minutes: number         // 읽는 데 걸리는 시간(분)
  summary: string[]       // 세 줄 요약 (없으면 빈 배열)
  excerpt: string
}

/** 요약 창에 들어가는 내용. 글에도 책에도 쓴다. */
export interface SheetData {
  href: string | null                              // 전문 읽기 주소
  title: string
  topic: string | null
  image: string | null
  metaText: string                                 // 주제 · N분 · 날짜
  coverMeta: string                                // 표지 아래 줄
  summary: string[]
  sourceNotes: { id: string; text: string }[]      // 이 글이 나온 메모 (5단계에서 채워짐)
  items: { id: string; title: string; dateText: string }[]  // 책에 묶인 글 목록
}

/** 한글 분당 500자로 어림한다. 최소 1분. */
export function readingMinutes(content: string | null | undefined): number {
  return Math.max(1, Math.round(toPlainText(content).length / 500))
}

/** 9월 25일 — formatDateTime("9월 25일 오전 10:20") 에서 앞 두 조각만 쓴다 */
export function shortDate(iso: string): string {
  const [month, day] = formatDateTime(iso).split(' ')
  return `${month} ${day}`
}

/**
 * 저장된 요약을 세 줄로 나눈다.
 * 줄바꿈으로 나누고, 앞에 붙은 번호나 기호는 떼어낸다.
 */
export function summaryLines(summary: string | null | undefined): string[] {
  if (!summary?.trim()) return []
  return summary
    .split('\n')
    .map(line => line.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3)
}

export function toStoryCard(
  post: {
    id: string; title: string; topic: string | null; content: string | null
    thumbnail_url: string | null; excerpt: string | null; summary: string | null
    created_at: string
  },
  image: string | null,
): StoryCard {
  return {
    id: post.id,
    title: post.title,
    topic: post.topic,
    image,
    dateText: shortDate(post.created_at),
    minutes: readingMinutes(post.content),
    summary: summaryLines(post.summary),
    excerpt: excerptOf(post, 120),
  }
}
