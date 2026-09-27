'use client'

import { useState } from 'react'
import SummarySheet from '@/components/SummarySheet'
import { Topic } from '@/lib/site-config'
import { coverInk } from '@/lib/cover'
import { SheetData } from '@/lib/public'

export interface ShelfBook {
  title: string
  cover: string | null
  items: { id: string; title: string; dateText: string }[]
}

// 시안의 책등 색. 제목에 따라 늘 같은 색이 나오게 순서대로 돌려 쓴다.
const SPINES = ['#c9b08e', '#7c5a3e', '#9fae93', '#d9c7ae', '#5c4636', '#b89a74']

/** 책장 — 독후감을 쓴 책의 표지. 누르면 요약 창이 뜬다. */
export default function BookShelf({
  title, books, topics,
}: { title: string; books: ShelfBook[]; topics: Topic[] }) {
  const [open, setOpen] = useState<SheetData | null>(null)
  if (books.length === 0) return null

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 className="sec-title">{title}</h2>

      <div className="shelf bleed no-scrollbar">
        {books.map((b, i) => {
          const bg = SPINES[i % SPINES.length]
          const ink = coverInk(bg)
          return (
            <button key={b.title} className="book" aria-label={b.title}
              style={{ background: bg, color: b.cover ? '#f5ead9' : ink.fg }}
              onClick={() => setOpen({
                href: b.items[0] ? `/posts/${b.items[0].id}` : null,
                title: b.title,
                topic: '독서',
                image: b.cover,
                metaText: `독서 · 글 ${b.items.length}편`,
                coverMeta: '',
                summary: [],
                sourceNotes: [],
                items: b.items,
              })}>
              {b.cover && <img src={b.cover} alt="" loading="lazy" />}
              {!b.cover && <span className="book-name">{b.title}</span>}
            </button>
          )
        })}
      </div>

      <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: 'var(--text-sub)' }}>
        독후감을 쓴 책의 표지가 꽂힙니다. 누르면 요약이 뜹니다.
      </p>

      {open && <SummarySheet data={open} topics={topics} onClose={() => setOpen(null)} />}
    </aside>
  )
}
