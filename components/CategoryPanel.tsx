'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { orderedTopics, Topic, topicNamesUnder } from '@/lib/site-config'
import { topicSlug } from '@/lib/cover'

interface Counts { total: number; counts: Record<string, number> }

// 한 번 받아 온 숫자는 창을 다시 열어도 다시 받지 않는다
let cached: Counts | null = null

/**
 * 카테고리 화면 — 모바일은 전체 화면, PC 는 가운데 창.
 * 맨 위 "전체 글 N", 그 아래 대분류 → 들여쓴 중분류. 오른쪽에 글 수.
 * 누르면 그 분류의 글 목록으로 간다. 지금 보고 있는 분류는 쪽빛으로 표시.
 */
export default function CategoryPanel({
  topics, current, onClose,
}: { topics: Topic[]; current: string | null; onClose: () => void }) {
  const router = useRouter()
  const [counts, setCounts] = useState<Counts | null>(cached)

  // 숫자는 곁들이는 정보다. 못 받아 와도 목록은 그대로 보여 준다.
  useEffect(() => {
    if (cached) return
    let alive = true
    fetch('/api/topic-counts')
      .then(r => r.json())
      .then((d: Counts) => {
        if (!d || typeof d.total !== 'number') return
        cached = d
        if (alive) setCounts(d)
      })
      .catch(() => { /* 숫자 없이 보여 준다 */ })
    return () => { alive = false }
  }, [])

  // 열려 있는 동안 뒤가 스크롤되지 않게, Esc 로 닫히게
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

  /** 대분류는 중분류 글까지 더해서 센다 */
  function countOf(name: string): number | null {
    if (!counts) return null
    return topicNamesUnder(topics, name)
      .reduce((sum, n) => sum + (counts.counts[n] || 0), 0)
  }

  function go(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <div className="scrim cat-scrim" onClick={onClose} role="presentation">
      <div className="cat-panel" role="dialog" aria-label="카테고리"
        onClick={e => e.stopPropagation()}>
        <div className="cat-head">
          <button onClick={onClose} aria-label="닫기" className="icon-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <span className="cat-title">카테고리</span>
        </div>

        <div className="cat-list">
          <button className={`cat-row cat-all${current === null ? ' on' : ''}`}
            onClick={() => go('/archive')}>
            <span>전체 글</span>
            {counts && <span className="cat-count">{counts.total}</span>}
          </button>

          {orderedTopics(topics).map(({ topic, depth }) => {
            const n = countOf(topic.name)
            return (
              <button key={topic.id}
                className={`cat-row${depth === 1 ? ' cat-sub' : ''}${current === topic.name ? ' on' : ''}`}
                onClick={() => go(`/topics/${topicSlug(topic.name)}`)}>
                <span>{topic.name}</span>
                {n !== null && <span className="cat-count">{n}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
