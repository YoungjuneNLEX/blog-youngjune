'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Topic } from '@/lib/site-config'
import { formatTime } from '@/lib/date'

export interface MemoRow {
  id: string
  content: string | null
  topic: string | null
  created_at: string
}

/**
 * 적바림 — 들어오면 바로 쓸 수 있어야 한다.
 * 제목도 표지도 없고 주제는 안 골라도 된다. 저장하면 곧장 나만 보기로 들어간다.
 */
export default function QuickMemo({ topics, today }: { topics: Topic[]; today: MemoRow[] }) {
  const [text, setText] = useState('')
  const [topic, setTopic] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [list, setList] = useState<MemoRow[]>(today)
  const boxRef = useRef<HTMLTextAreaElement>(null)

  // 화면에 들어오면 곧바로 입력창에 커서를 둔다
  useEffect(() => { boxRef.current?.focus() }, [])

  async function save() {
    const body = text.trim()
    if (!body || saving) return
    setSaving(true); setError('')

    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: body, topic }),
    })
    setSaving(false)

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || '저장하지 못했습니다. 다시 시도해주세요.')
      return
    }
    const saved: MemoRow = await res.json()
    setList(prev => [saved, ...prev])
    setText('')
    // 주제는 남겨 둔다 — 같은 주제로 이어 적는 일이 많다
    boxRef.current?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); save() }
  }

  const label = (name: string | null) =>
    topics.find(t => t.name === name)?.short || name || '분류 전'

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px 48px',
      display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="wordmark">적바림</span>
        <Link href="/notes" style={{ fontSize: '14px' }}>창고 보기</Link>
      </div>

      <div className="memo-card">
        <label htmlFor="memo" className="meta-sub">지금 떠오른 것</label>
        <textarea id="memo" ref={boxRef} className="memo-box"
          value={text} onChange={e => setText(e.target.value)} onKeyDown={onKeyDown}
          placeholder="제목 없이, 한 줄이어도 괜찮아요" />

        {/* 주제 — 안 고르면 '분류 전'으로 들어간다. 다시 누르면 해제된다. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {topics.map(t => {
            const on = topic === t.name
            return (
              <button key={t.name} type="button" onClick={() => setTopic(on ? null : t.name)}
                className={`chip${on ? ' chip-on' : ''}`}>
                {t.short}
              </button>
            )
          })}
        </div>

        {error && <p style={{ margin: 0, color: '#a33', fontSize: '13px' }}>{error}</p>}

        <div className="memo-foot">
          <span className="meta-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            나만 보기로 저장
          </span>
          <button type="button" onClick={save} disabled={saving || !text.trim()}
            className="btn btn-accent" style={{ padding: '0 22px' }}>
            {saving ? '적는 중…' : '적기'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="label" style={{ marginBottom: '6px' }}>오늘 적은 것</div>
        {list.length === 0 ? (
          <p className="meta-sub" style={{ padding: '14px 0' }}>오늘은 아직 적은 것이 없습니다.</p>
        ) : list.map(m => (
          <div key={m.id} className="memo-row">
            <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {m.content}
            </p>
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>{formatTime(m.created_at)}</span><span>·</span>
              <span>{label(m.topic)}</span><span>·</span>
              <span>나만 보기</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
