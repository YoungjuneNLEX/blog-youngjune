'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Topic } from '@/lib/site-config'
import { formatDateTime } from '@/lib/date'

export interface MemoRow {
  id: string
  content: string | null
  topic: string | null
  created_at: string
}

/**
 * 빠른 메모 — 들어오면 바로 쓸 수 있어야 한다.
 * 제목도 표지도 없고, 주제는 안 골라도 된다. 저장하면 곧장 비공개로 들어간다.
 * 휴대폰을 먼저 보고 만들었다. 누르는 것들은 모두 44px 이상.
 */
export default function QuickMemo({ topics, recent }: { topics: Topic[]; recent: MemoRow[] }) {
  const [text, setText] = useState('')
  const [topic, setTopic] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [list, setList] = useState<MemoRow[]>(recent)
  const boxRef = useRef<HTMLTextAreaElement>(null)

  // 화면에 들어오면 곧바로 입력창에 커서를 둔다
  useEffect(() => { boxRef.current?.focus() }, [])

  async function save() {
    const body = text.trim()
    if (!body || saving) return
    setSaving(true)
    setError('')

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
    // 주제는 남겨 둔다 — 같은 주제로 이어서 적는 일이 많다
    boxRef.current?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // 데스크톱에서 ⌘/Ctrl + Enter 로 저장
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      save()
    }
  }

  const chipBase: React.CSSProperties = {
    minHeight: '44px', padding: '0 14px', borderRadius: '999px',
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-sub)', fontSize: '0.88rem', cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.25rem 1rem 4rem' }}>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: '12px', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)',
          letterSpacing: '-0.02em' }}>적바림</h1>
        <Link href="/notes" style={{ fontSize: '0.88rem', color: 'var(--text-sub)' }}
          className="hover:opacity-70 transition">노트 창고 →</Link>
      </div>

      {/* 입력창 */}
      <textarea
        ref={boxRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={6}
        placeholder="지금 떠오른 것을 그대로 적어두세요."
        style={{ width: '100%', resize: 'vertical', padding: '14px',
          fontSize: '1.02rem', lineHeight: 1.75, borderRadius: '12px',
          border: '1px solid var(--border)', background: 'var(--bg-card)',
          color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit' }} />

      {/* 주제 — 안 골라도 된다 */}
      <div className="no-scrollbar"
        style={{ display: 'flex', gap: '8px', overflowX: 'auto', margin: '12px 0 4px',
          paddingBottom: '2px' }}>
        <button onClick={() => setTopic(null)}
          style={{ ...chipBase, ...(topic === null
            ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 600 }
            : {}) }}>
          분류 전
        </button>
        {topics.map(t => {
          const on = topic === t.name
          return (
            <button key={t.name} onClick={() => setTopic(on ? null : t.name)}
              style={{ ...chipBase, ...(on
                ? { background: t.color, borderColor: t.color, color: '#fff', fontWeight: 600 }
                : {}) }}>
              {t.name}
            </button>
          )
        })}
      </div>

      {error && (
        <p style={{ color: '#a33', fontSize: '0.85rem', marginTop: '8px' }}>{error}</p>
      )}

      {/* 저장 */}
      <button onClick={save} disabled={saving || !text.trim()}
        style={{ width: '100%', minHeight: '52px', marginTop: '12px',
          borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: 'var(--accent)', color: '#fff', fontSize: '1rem', fontWeight: 700,
          opacity: saving || !text.trim() ? 0.45 : 1 }}>
        {saving ? '적는 중…' : '적바림'}
      </button>
      <p style={{ color: 'var(--text-sub)', fontSize: '0.78rem', marginTop: '8px',
        textAlign: 'center' }}>
        비공개로 저장됩니다. 공개는 노트 창고에서 고릅니다.
      </p>

      {/* 최근에 적은 것 */}
      {list.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-sub)',
            marginBottom: '10px' }}>최근에 적은 것</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0,
            display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {list.map(m => (
              <li key={m.id}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '12px 14px' }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>{m.content}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                    {formatDateTime(m.created_at)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                    · {m.topic || '분류 전'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
