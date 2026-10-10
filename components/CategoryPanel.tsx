'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { orderedTopics, Topic, topicNamesUnder } from '@/lib/site-config'
import { topicSlug } from '@/lib/cover'

interface Counts { total: number; counts: Record<string, number> }

// 한 번 받아 온 숫자는 창을 다시 열어도 다시 받지 않는다
let cached: Counts | null = null

/**
 * 서재 화면 — 모바일은 전체 화면, PC 는 가운데 창.
 * 맨 위 "전체 글 N", 그 아래 서재 → 들여쓴 시리즈. 오른쪽에 글 수.
 * 누르면 그 서재·시리즈의 글 목록으로 간다. '전체 글'은 홈(전체 서재)으로 돌아간다.
 * 지금 보고 있는 곳은 쪽빛으로 표시. current 가 빈 문자열이면 아무것도 표시하지 않는다.
 *
 * 방문자에게 공개 글이 한 편도 없는 시리즈는 숨긴다. (만들어 놓고 안 쓴 시리즈가 빈 책처럼 보이지 않게)
 * 숫자를 받아 오기 전에는 시리즈를 보이지 않다가, 받으면 글이 있는 시리즈만 나타난다.
 * 숫자를 끝내 못 받으면 숨길 근거가 없으므로 전부 보여 준다.
 */
export default function CategoryPanel({
  topics, current, onClose,
}: { topics: Topic[]; current: string | null; onClose: () => void }) {
  const router = useRouter()
  const [counts, setCounts] = useState<Counts | null>(cached)
  const [failed, setFailed] = useState(false)

  // 숫자는 곁들이는 정보다. 못 받아 와도 목록은 그대로 보여 준다.
  useEffect(() => {
    if (cached) return
    let alive = true
    fetch('/api/topic-counts')
      .then(r => r.json())
      .then((d: Counts) => {
        if (!d || typeof d.total !== 'number') { if (alive) setFailed(true); return }
        cached = d
        if (alive) setCounts(d)
      })
      .catch(() => { if (alive) setFailed(true) })   // 숫자 없이 전부 보여 준다
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

  /** 서재는 시리즈 글까지 더해서 센다 */
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
      <div className="cat-panel" role="dialog" aria-label="서재"
        onClick={e => e.stopPropagation()}>
        <div className="cat-head">
          <button onClick={onClose} aria-label="닫기" className="icon-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <span className="cat-title">서재</span>
        </div>

        <div className="cat-list">
          <button className={`cat-row cat-all${current === null ? ' on' : ''}`}
            onClick={() => go('/')}>
            <span>전체 글</span>
            {counts && <span className="cat-count">{counts.total}</span>}
          </button>

          {orderedTopics(topics).map(({ topic, depth }) => {
            const n = countOf(topic.name)
            // 공개 글이 없는 시리즈는 방문자 화면에서 숨긴다 (지금 보고 있는 시리즈는 예외)
            if (depth === 1 && !failed && current !== topic.name) {
              if (counts === null || n === 0) return null
            }
            return (
              <button key={topic.id}
                className={`cat-row${depth === 1 ? ' cat-sub' : ''}${current === topic.name ? ' on' : ''}`}
                onClick={() => go(`/topics/${topicSlug(topic.name)}`)}>
                <span className="cat-name">
                  <span>{topic.name}</span>
                  {topic.description && <span className="cat-desc">{topic.description}</span>}
                </span>
                {n !== null && <span className="cat-count">{n}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
