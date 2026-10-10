import { coverImage } from '@/lib/cover'
import { childTopics, Topic } from '@/lib/site-config'
import type { SeriesCard } from '@/components/SeriesRow'

interface Row {
  topic: string | null
  kind?: string | null
  thumbnail_url?: string | null
  content?: string | null
}

/**
 * 서재 페이지에 무엇을 놓을지 정한다.
 *  - cards : 시리즈 줄. 공개 글이 한 편도 없는 시리즈는 뺀다(빈 책처럼 보이지 않게).
 *  - listed: 목록에 둘 글. 서재면 서재에 바로 속한 글만, 시리즈면 받은 글 전부.
 *  - hideList: 보일 시리즈가 있는데 서재에 바로 속한 글이 없으면 목록 칸을 통째로 숨긴다.
 *              (둘 다 없으면 평소 '글이 없습니다' 안내를 위해 숨기지 않는다)
 * rows 는 최신순이라고 본다. 시리즈 카드 표지는 가장 오래된 사진 있는 긴 글에서 얻는다.
 */
export function libraryView<T extends Row>(topics: Topic[], topic: Topic | undefined, rows: T[]) {
  const isLibrary = !!topic && !topic.parentId
  if (!topic || !isLibrary) {
    return { isLibrary: false, cards: [] as SeriesCard[], listed: rows, hideList: false }
  }
  const cards: SeriesCard[] = childTopics(topics, topic.id).flatMap(c => {
    const own = rows.filter(p => p.topic === c.name)
    if (own.length === 0) return []
    const photo = [...own].reverse()
      .filter(p => p.kind !== 'note').map(p => coverImage(p)).find(Boolean) || null
    return [{ name: c.name, count: own.length, coverUrl: c.coverUrl || photo }]
  })
  const listed = rows.filter(p => p.topic === topic.name)
  return { isLibrary: true, cards, listed, hideList: cards.length > 0 && listed.length === 0 }
}
