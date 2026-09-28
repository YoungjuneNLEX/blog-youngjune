'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Cover, { Thumb } from '@/components/Cover'
import SummarySheet from '@/components/SummarySheet'
import CategoryPanel from '@/components/CategoryPanel'
import { Topic } from '@/lib/site-config'
import { FeedEntry } from '@/lib/feed'
import { SheetData } from '@/lib/public'

/**
 * 글 목록 (C안) — 글/짧은 노트 탭, 주제 고르기, 앨범형·목록형 전환.
 * 홈·전체·주제 페이지가 모두 이 부품을 쓴다.
 */
export default function PostBrowser({
  entries, topics, showTabs = true, lockedTopic = null, notePreview = 0,
}: {
  entries: FeedEntry[]
  topics: Topic[]
  showTabs?: boolean          // 짧은 노트 탭을 보일지 (설정에서 끌 수 있다)
  lockedTopic?: string | null // 주제 페이지처럼 주제가 이미 정해진 경우
  notePreview?: number        // 글 탭 아래에 짧은 노트를 몇 개 미리 보일지 (홈)
}) {
  const [tab, setTab] = useState<'article' | 'note'>('article')
  const [album, setAlbum] = useState(true)
  const [pick, setPick] = useState(false)
  const [open, setOpen] = useState<SheetData | null>(null)

  const shown = useMemo(() => {
    const kind = showTabs ? tab : 'article'
    return entries.filter(e => e.kind === kind)
  }, [entries, tab, showTabs])

  function sheetOf(e: FeedEntry): SheetData {
    return {
      href: `/posts/${e.id}`,
      title: e.title,
      topic: e.topic,
      image: e.image,
      metaText: `${e.topicLabel} · ${e.minutes}분 · ${e.dateText}`,
      coverMeta: `적바림 · ${e.dateText}`,
      summary: e.summary.length > 0 ? e.summary : e.excerpt ? [e.excerpt] : [],
      sourceNotes: e.sourceNotes,
      items: [],
    }
  }

  const previewNotes = useMemo(
    () => entries.filter(e => e.kind === 'note').slice(0, notePreview),
    [entries, notePreview],
  )

  const label = lockedTopic || '전체 주제'
  const isNotes = showTabs && tab === 'note'

  return (
    <div>
      {showTabs && (
        <nav aria-label="보기" className="tabs">
          <button className={`tab${tab === 'article' ? ' tab-on' : ''}`}
            onClick={() => setTab('article')}>글</button>
          <button className={`tab${tab === 'note' ? ' tab-on' : ''}`}
            onClick={() => setTab('note')}>짧은 노트</button>
        </nav>
      )}

      <div className="browse-bar">
        <button type="button" className="topic-pick" onClick={() => setPick(true)}
          aria-haspopup="dialog">
          {label}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
        </button>

        {!isNotes && (
          <div className="view-pick">
            <button type="button" aria-label="앨범형" className={album ? 'on' : ''}
              onClick={() => setAlbum(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" aria-hidden>
                <rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" />
                <rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button type="button" aria-label="목록형" className={album ? '' : 'on'}
              onClick={() => setAlbum(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M9 6h11M9 12h11M9 18h11" />
                <rect x="3.5" y="4.5" width="3" height="3" rx="0.5" />
                <rect x="3.5" y="10.5" width="3" height="3" rx="0.5" />
                <rect x="3.5" y="16.5" width="3" height="3" rx="0.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {shown.length === 0 && (
        <p className="empty">{isNotes ? '아직 열어 둔 메모가 없습니다.' : '아직 열어 둔 글이 없습니다.'}</p>
      )}

      {/* 짧은 노트 — 표지 없이 본문 그대로 */}
      {isNotes && shown.length > 0 && (
        <div className="note-list">
          {shown.map(e => (
            <Link key={e.id} href={`/posts/${e.id}`} className="note-item">
              <p className="note-text">{e.text}</p>
              <span className="meta">{e.dateText} · {e.topicLabel}</span>
            </Link>
          ))}
        </div>
      )}

      {/* 긴 글 — 앨범형 */}
      {!isNotes && album && shown.length > 0 && (
        <div className="album">
          {shown.map(e => (
            <button key={e.id} className="album-card" onClick={() => setOpen(sheetOf(e))}>
              <Cover title={e.title} topic={e.topic} topics={topics} image={e.image} />
              <span className="album-title">{e.title}</span>
              <span className="meta">{e.dateText} · {e.topicLabel}</span>
            </button>
          ))}
        </div>
      )}

      {/* 긴 글 — 목록형 */}
      {!isNotes && !album && shown.length > 0 && (
        <div className="rows">
          {shown.map(e => (
            <button key={e.id} className="row-card" onClick={() => setOpen(sheetOf(e))}>
              <div>
                <span className="meta">{e.dateText} · {e.minutes}분</span>
                <span className="row-title">{e.title}</span>
                <span className="row-sum">{e.summary[0] || e.excerpt}</span>
              </div>
              <Thumb title={e.title} topic={e.topic} topics={topics} image={e.image} />
            </button>
          ))}
        </div>
      )}

      {/* 글 탭 아래 짧은 노트 미리 보기 (홈, 시안 PastelHome) */}
      {!isNotes && notePreview > 0 && showTabs && previewNotes.length > 0 && (
        <section className="note-strip">
          <div className="note-strip-head">
            <h2 className="sec-title" style={{ fontSize: '17px' }}>짧은 노트</h2>
            <button className="sec-more" onClick={() => setTab('note')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              더 보기
            </button>
          </div>
          {previewNotes.map(e => (
            <Link key={e.id} href={`/posts/${e.id}`} className="note-item"
              style={{ background: 'var(--bg-card)' }}>
              <p className="note-text">{e.text}</p>
              <span className="meta">{e.dateText} · {e.topicLabel}</span>
            </Link>
          ))}
        </section>
      )}

      {pick && (
        <CategoryPanel topics={topics} current={lockedTopic} onClose={() => setPick(false)} />
      )}

      {open && <SummarySheet data={open} topics={topics} onClose={() => setOpen(null)} />}
    </div>
  )
}
