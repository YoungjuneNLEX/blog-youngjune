'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Topic } from '@/lib/site-config'
import { coverInk, topicPair, topicSlug } from '@/lib/cover'
import { SheetData } from '@/lib/public'

/**
 * 요약 창.
 * 모바일은 아래에서 올라오는 시트, PC 는 가운데 모달. (한 마크업으로 CSS 에서 갈린다)
 */
export default function SummarySheet({
  data, topics, onClose,
}: { data: SheetData; topics: Topic[]; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  // 열려 있는 동안 뒤 배경이 스크롤되지 않게, Esc 로 닫히게
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const pair = topicPair(data.topic, topics)
  const bg = pair.color
  const ink = coverInk(pair.color, pair.ink)
  // 사진 위에는 덮개가 깔리므로 흰 글자를 쓴다
  const fg = data.image ? '#ffffff' : ink.fg
  const dim = data.image ? 'rgba(255,255,255,0.85)' : ink.dim
  const label = topics.find(t => t.name === data.topic)?.short || data.topic || '적바림'

  async function share() {
    const url = data.href ? new URL(data.href, window.location.origin).toString() : window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: data.title, url }) } catch { /* 취소는 그냥 넘어간다 */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('아래 링크를 복사하세요', url)
    }
  }

  return (
    <div className="scrim" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-label="글 요약" onClick={e => e.stopPropagation()}>
        <span className="sheet-grip" />

        <div className="sheet-top">
          {/* 표지 — 모바일은 작은 썸네일, PC 는 왼쪽 칸 전체 */}
          <div className="sheet-cover" style={{ background: bg, color: fg }}>
            {data.image && <img src={data.image} alt="" />}
            {data.image && <span className="cover-veil" />}
            <span className="cover-topic only-pc" style={{ color: dim }}>{label}</span>
            <span className="sheet-cover-title">{data.title}</span>
            {data.coverMeta && (
              <span className="cover-meta only-pc" style={{ color: dim }}>{data.coverMeta}</span>
            )}
          </div>

          <div className="sheet-head">
            <div>
              <h2 className="sheet-title">{data.title}</h2>
              <span className="meta-sub">{data.metaText}</span>
            </div>
            <button onClick={onClose} aria-label="닫기" className="icon-btn"
              style={{ margin: '-8px -10px 0 0' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="sheet-body">
          {/* 세 줄 요약 — 발행할 때 만들어 저장해 둔 것만 읽는다 */}
          <div className="summary-box">
            <span className="label" style={{ color: 'var(--text-sub)' }}>
              {data.summary.length > 0 ? '세 줄 요약 · AI 작성' : '미리보기'}
            </span>
            {data.summary.length > 0 ? (
              <ol>{data.summary.map((line, i) => <li key={i}>{line}</li>)}</ol>
            ) : (
              <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.65 }}>
                {data.items.length > 0 ? `글 ${data.items.length}편이 묶여 있습니다.` : '아직 요약이 없습니다.'}
              </p>
            )}
          </div>

          {/* 책에 묶인 글 목록 */}
          {data.items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span className="label">이 책에 쓴 글</span>
              {data.items.map(it => (
                <Link key={it.id} href={`/posts/${it.id}`} onClick={onClose}
                  style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--quote)' }}>
                  {it.title} <span className="meta">· {it.dateText}</span>
                </Link>
              ))}
            </div>
          )}

          {/* 이 글이 나온 메모 — 공개한 메모가 있을 때만 보인다 */}
          {data.sourceNotes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="label">이 글이 나온 메모</span>
              {data.sourceNotes.map(n => (
                <Link key={n.id} href={`/posts/${n.id}`} onClick={onClose}
                  style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--quote)' }}>
                  {n.text}
                </Link>
              ))}
            </div>
          )}

          <div className="sheet-actions">
            {data.href && (
              <Link href={data.href} className="btn btn-ink" onClick={onClose}>전문 읽기</Link>
            )}
            <div className="sheet-actions-2">
              {data.topic && (
                <Link href={`/topics/${topicSlug(data.topic)}`} className="btn" onClick={onClose}>
                  같은 주제
                </Link>
              )}
              <button onClick={share} className="btn" type="button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                  <path d="M12 3v12" /><path d="M7 8l5-5 5 5" />
                </svg>
                {copied ? '링크 복사됨' : '공유하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
