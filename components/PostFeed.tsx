'use client'

import { useState } from 'react'
import Link from 'next/link'
import Cover from '@/components/Cover'
import SummarySheet from '@/components/SummarySheet'
import { Topic } from '@/lib/site-config'
import { FeedEntry } from '@/lib/feed'
import { SheetData } from '@/lib/public'

/** 주제·보관함의 목록. 긴 글은 표지 카드로, 메모는 본문 그대로. */
export default function PostFeed({
  entries, topics,
}: { entries: FeedEntry[]; topics: Topic[] }) {
  const [open, setOpen] = useState<SheetData | null>(null)

  if (entries.length === 0) {
    return <p className="meta-sub" style={{ padding: '32px 0' }}>아직 여기에 글이 없습니다.</p>
  }

  const articles = entries.filter(e => e.kind === 'article')
  const notes = entries.filter(e => e.kind === 'note')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {articles.length > 0 && (
        <div className="feed-grid">
          {articles.map(e => (
            <button key={e.id} className="feed-card"
              onClick={() => setOpen({
                href: `/posts/${e.id}`,
                title: e.title,
                topic: e.topic,
                image: e.image,
                metaText: `${e.topicLabel} · ${e.minutes}분 · ${e.dateText}`,
                coverMeta: `적바림 · ${e.dateText}`,
                summary: e.summary.length > 0 ? e.summary : e.excerpt ? [e.excerpt] : [],
                sourceNotes: [],
                items: [],
              })}>
              <Cover title={e.title} topic={e.topic} topics={topics} image={e.image} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="serif" style={{ fontSize: '18px', fontWeight: 700 }}>{e.title}</span>
                <span className="meta-sub">{e.topicLabel} · {e.minutes}분</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div>
          <h2 className="sec-title" style={{ marginBottom: '4px' }}>짧은 노트</h2>
          {notes.map(e => (
            <Link key={e.id} href={`/posts/${e.id}`} className="note-item">
              <span className="meta">{e.dateText} · {e.topicLabel}</span>
              <p className="note-text">{e.text}</p>
            </Link>
          ))}
        </div>
      )}

      {open && <SummarySheet data={open} topics={topics} onClose={() => setOpen(null)} />}
    </div>
  )
}
