'use client'

import { useState } from 'react'
import Link from 'next/link'
import Cover from '@/components/Cover'
import SummarySheet from '@/components/SummarySheet'
import { Topic } from '@/lib/site-config'
import { SheetData, StoryCard } from '@/lib/public'

/** 최근 글 — 모바일은 대표 글 + 가로 카드, PC 는 2:1:1 그리드 */
export default function HomeStories({
  title, cards, topics,
}: { title: string; cards: StoryCard[]; topics: Topic[] }) {
  const [open, setOpen] = useState<SheetData | null>(null)

  if (cards.length === 0) return null

  function sheetOf(c: StoryCard): SheetData {
    const label = topics.find(t => t.name === c.topic)?.short || c.topic || '적바림'
    return {
      href: `/posts/${c.id}`,
      title: c.title,
      topic: c.topic,
      image: c.image,
      metaText: `${label} · ${c.minutes}분 · ${c.dateText}`,
      coverMeta: `적바림 · ${c.dateText}`,
      summary: c.summary.length > 0 ? c.summary : c.excerpt ? [c.excerpt] : [],
      sourceNotes: [],
      items: [],
    }
  }

  const [lead, ...rest] = cards

  return (
    <section style={{ paddingTop: '24px' }}>
      <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: '16px' }}>
        <h2 className="sec-title">{title}</h2>
        <Link href="/archive" className="sec-more">모두 보기</Link>
      </div>

      <div className="wrap home-stories">
        <button className="feature" onClick={() => setOpen(sheetOf(lead))}
          style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
          <Cover title={lead.title} topic={lead.topic} topics={topics}
            image={lead.image} meta={`적바림 · ${lead.dateText}`} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="feature-title">{lead.title}</span>
            <span className="meta-sub">
              {topics.find(t => t.name === lead.topic)?.short || lead.topic || '적바림'} · {lead.minutes}분
            </span>
          </span>
        </button>

        {rest.length > 0 && (
          <div className="rail bleed no-scrollbar">
            {rest.map(c => (
              <button key={c.id} className="rail-card" onClick={() => setOpen(sheetOf(c))}
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}>
                <Cover title={c.title} topic={c.topic} topics={topics} image={c.image} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="rail-card-title">{c.title}</span>
                  <span className="meta-sub">
                    {topics.find(t => t.name === c.topic)?.short || c.topic || '적바림'} · {c.minutes}분
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && <SummarySheet data={open} topics={topics} onClose={() => setOpen(null)} />}
    </section>
  )
}
