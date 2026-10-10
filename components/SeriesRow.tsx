import Link from 'next/link'
import Cover from '@/components/Cover'
import { Topic } from '@/lib/site-config'
import { topicSlug } from '@/lib/cover'

export interface SeriesCard {
  name: string
  count: number          // 공개 글 편수
  coverUrl: string | null
}

/**
 * 서재 페이지의 '시리즈' 줄 — 표지·이름·편수 카드를 가로로 밀어 본다.
 * 카드를 누르면 그 시리즈 페이지(/topics/[시리즈])로 간다.
 * 공개 글이 없는 시리즈는 부르는 쪽에서 이미 걸러서 넘긴다.
 */
export default function SeriesRow({ items, topics }: { items: SeriesCard[]; topics: Topic[] }) {
  if (items.length === 0) return null
  return (
    <section className="series-wrap" aria-label="시리즈">
      <div className="series-head">
        <h2 className="label" style={{ margin: 0 }}>시리즈</h2>
        <span className="meta">{items.length}</span>
      </div>
      <ul className="series-row no-scrollbar">
        {items.map(s => (
          <li key={s.name} className="series-card">
            <Link href={`/topics/${topicSlug(s.name)}`}>
              <Cover title={s.name} topic={s.name} topics={topics} image={s.coverUrl}
                className="series-cover" />
              <span className="series-name">{s.name}</span>
              <span className="meta">{s.count}편</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
