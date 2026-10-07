'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Cover, { Thumb } from '@/components/Cover'
import SummarySheet from '@/components/SummarySheet'
import CategoryPanel from '@/components/CategoryPanel'
import { Topic } from '@/lib/site-config'
import { FeedEntry } from '@/lib/feed'
import { SheetData } from '@/lib/public'

/** 주제 페이지 맨 위 소개 카드에 들어가는 것. 소개글이 있을 때만 서버가 만들어 보낸다. */
export interface TopicIntro {
  name: string
  parent: string | null     // 중분류면 상위 분류 이름
  description: string
  coverUrl: string | null   // 대표 이미지 → 없으면 첫 공개 글 표지. 둘 다 없으면 null(주제 색 표지)
  count: number             // 이 페이지에 나오는 공개 글 수
}

/**
 * 글 목록 (C안) — 긴 글/짧은 글 탭, 주제 고르기, 앨범형·목록형 전환.
 * 홈·주제 페이지가 이 부품을 쓴다.
 * 주제 페이지에서는 소개 카드와 '최신순 | 처음부터' 전환이 붙는다.
 */
export default function PostBrowser({
  entries, topics, showTabs = true, lockedTopic = null, notePreview = 0,
  intro = null, series = false,
}: {
  entries: FeedEntry[]
  topics: Topic[]
  showTabs?: boolean          // 짧은 글 탭을 보일지 (설정에서 끌 수 있다)
  lockedTopic?: string | null // 주제 페이지처럼 주제가 이미 정해진 경우
  notePreview?: number        // 긴 글 아래에 짧은 글을 몇 개 미리 보일지 (홈)
  intro?: TopicIntro | null   // 주제 소개 카드 (없으면 카드를 그리지 않는다)
  series?: boolean            // 이 주제를 연재로 보는가 → 기본 정렬이 '처음부터'
}) {
  const [tab, setTab] = useState<'article' | 'note'>('article')
  const [album, setAlbum] = useState(true)
  // 정렬은 주제 페이지에서만 의미가 있다. 홈은 최근 글만 받아 두어서 '처음부터'가 틀린 결과를 보인다.
  const sortable = Boolean(lockedTopic)
  const [oldFirst, setOldFirst] = useState(series)
  const [pick, setPick] = useState(false)
  const [open, setOpen] = useState<SheetData | null>(null)

  const shown = useMemo(() => {
    const kind = showTabs ? tab : 'article'
    const list = entries.filter(e => e.kind === kind)
    // 서버가 최신순으로 보낸다. 긴 글만 뒤집어 '처음부터'(오래된 글이 위)로 본다.
    return kind === 'article' && sortable && oldFirst ? [...list].reverse() : list
  }, [entries, tab, showTabs, sortable, oldFirst])

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
      seriesNo: e.seriesNo,
      items: [],
    }
  }

  const previewNotes = useMemo(
    () => entries.filter(e => e.kind === 'note').slice(0, notePreview),
    [entries, notePreview],
  )

  const label = lockedTopic || '전체 주제'
  const isNotes = showTabs && tab === 'note'

  const sortToggle = (
    <div className="seg" role="group" aria-label="정렬">
      <button className={!oldFirst ? 'on' : ''} onClick={() => setOldFirst(false)}>최신순</button>
      <button className={oldFirst ? 'on' : ''} onClick={() => setOldFirst(true)}>처음부터</button>
    </div>
  )

  return (
    <div>
      {/* 주제 소개 카드 — 소개글이 있을 때만 */}
      {intro && (
        <div className="intro-wrap">
          <section className="intro" aria-label="카테고리 소개">
            <Cover title={intro.name} topic={intro.name} topics={topics} image={intro.coverUrl} />
            <div className="intro-body">
              {intro.parent && <span className="meta-sub">{intro.parent} &gt;</span>}
              <h1 className="intro-name">{intro.name}</h1>
              <p className="intro-desc">{intro.description}</p>
              <div className="intro-foot">
                <span className="meta">글 {intro.count}편</span>
                {sortable && !isNotes && sortToggle}
              </div>
            </div>
          </section>
        </div>
      )}

      {showTabs && (
        <nav aria-label="보기" className="tabs">
          <button className={`tab${tab === 'article' ? ' tab-on' : ''}`}
            onClick={() => setTab('article')}>긴 글</button>
          <button className={`tab${tab === 'note' ? ' tab-on' : ''}`}
            onClick={() => setTab('note')}>짧은 글</button>
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

      {/* 소개 카드가 없는 주제 페이지는 정렬 전환을 목록 위에 따로 둔다 */}
      {sortable && !intro && !isNotes && (
        <div className="sort-row">{sortToggle}</div>
      )}

      {shown.length === 0 && (
        <p className="empty">{isNotes ? '아직 열어 둔 짧은 글이 없습니다.' : '아직 열어 둔 긴 글이 없습니다.'}</p>
      )}

      {/* 짧은 글 — 표지 없이 본문 그대로 */}
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

      {/* 긴 글 아래 짧은 글 미리 보기 (홈, 시안 PastelHome) */}
      {!isNotes && notePreview > 0 && showTabs && previewNotes.length > 0 && (
        <section className="note-strip">
          <div className="note-strip-head">
            <h2 className="sec-title" style={{ fontSize: '17px' }}>짧은 글</h2>
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
