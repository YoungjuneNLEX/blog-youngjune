'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Topic } from '@/lib/site-config'
import { formatDay, formatTime } from '@/lib/date'

export interface WarehouseRow {
  id: string
  title: string
  content: string | null
  kind: 'note' | 'article'
  topic: string | null
  published: boolean
  created_at: string
}

type Filter =
  | { type: 'all' }
  | { type: 'untagged' }
  | { type: 'published' }
  | { type: 'growing' }
  | { type: 'topic'; name: string }

// 본문 HTML 을 미리보기용 평문으로
function toPlainText(html: string | null): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function dayKey(iso: string) {
  return formatDay(iso)
}

/**
 * 노트 창고 — 적어 둔 것을 날짜별로 펼쳐 놓고, 골라서 처리하는 곳.
 * "공개는 나중에 고르는 것"이라는 원칙이 실제로 일어나는 화면이다.
 */
export default function NotesWarehouse({
  rows, topics,
}: { rows: WarehouseRow[]; topics: Topic[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>({ type: 'all' })
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [topicOpen, setTopicOpen] = useState(false)

  const shown = useMemo(() => rows.filter(r => {
    switch (filter.type) {
      case 'untagged':  return !r.topic
      case 'published': return r.published
      // 키우는 중 = 쓰다 만 긴 글
      case 'growing':   return r.kind === 'article' && !r.published
      case 'topic':     return r.topic === filter.name
      default:          return true
    }
  }), [rows, filter])

  // 날짜별로 묶는다 (최신 날짜가 위)
  const byDay = useMemo(() => {
    const map = new Map<string, WarehouseRow[]>()
    for (const r of shown) {
      const k = dayKey(r.created_at)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(r)
    }
    return Array.from(map.entries())
  }, [shown])

  function toggle(id: string) {
    setPicked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function run(body: Record<string, unknown>, method: 'PATCH' | 'DELETE' = 'PATCH') {
    if (picked.size === 0 || busy) return
    setBusy(true)
    const res = await fetch('/api/notes', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(picked), ...body }),
    })
    setBusy(false)
    setTopicOpen(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || '처리하지 못했습니다.')
      return
    }
    setPicked(new Set())
    router.refresh()
  }

  const filters: { key: string; label: string; value: Filter }[] = [
    { key: 'all', label: '모든 노트', value: { type: 'all' } },
    { key: 'untagged', label: '분류 전', value: { type: 'untagged' } },
    { key: 'published', label: '공개한 것', value: { type: 'published' } },
    { key: 'growing', label: '키우는 중', value: { type: 'growing' } },
    ...topics.map(t => ({ key: `t:${t.name}`, label: t.name, value: { type: 'topic' as const, name: t.name } })),
  ]
  const activeKey = filter.type === 'topic' ? `t:${filter.name}` : filter.type

  const chip: React.CSSProperties = {
    minHeight: '44px', padding: '0 14px', borderRadius: '999px',
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-sub)', fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap',
  }
  const action: React.CSSProperties = {
    minHeight: '44px', padding: '0 16px', borderRadius: '10px',
    border: '1px solid var(--border)', background: 'var(--bg-card)',
    color: 'var(--text-sub)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '1.25rem 1rem 6rem' }}>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: '12px', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)',
          letterSpacing: '-0.02em' }}>노트 창고</h1>
        <Link href="/memo" style={{ fontSize: '0.88rem', color: 'var(--accent)', fontWeight: 600 }}
          className="hover:opacity-70 transition">+ 적바림</Link>
      </div>

      {/* 보기 필터 */}
      <div className="no-scrollbar"
        style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {filters.map(f => {
          const on = activeKey === f.key
          return (
            <button key={f.key} onClick={() => { setFilter(f.value); setPicked(new Set()) }}
              style={{ ...chip, ...(on
                ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', fontWeight: 600 }
                : {}) }}>
              {f.label}
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', margin: '12px 0' }}>
        {shown.length}개
      </p>

      {/* 날짜별 목록 */}
      {byDay.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-sub)',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          여기에 해당하는 노트가 없습니다.
        </div>
      ) : byDay.map(([day, items]) => (
        <section key={day} style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)',
            marginBottom: '8px' }}>{day}</h2>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0,
            display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map(r => {
              const on = picked.has(r.id)
              const preview = toPlainText(r.content)
              return (
                <li key={r.id}
                  style={{ background: 'var(--bg-card)',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '12px', padding: '12px 14px',
                    display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

                  <label style={{ minWidth: '44px', minHeight: '44px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', margin: '-12px 0 -12px -14px',
                    cursor: 'pointer', flexShrink: 0 }}>
                    <input type="checkbox" checked={on} onChange={() => toggle(r.id)}
                      style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }} />
                  </label>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {r.kind === 'article' ? (
                      <Link href={`/write/${r.id}`}
                        style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.98rem' }}
                        className="hover:underline">
                        {r.title || '(제목 없음)'}
                      </Link>
                    ) : (
                      <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: 1.7,
                        whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>{preview}</p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
                      flexWrap: 'wrap', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px',
                        border: '1px solid var(--border)', color: 'var(--text-sub)' }}>
                        {r.kind === 'note' ? '메모' : '긴 글'}
                      </span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px',
                        border: '1px solid var(--border)',
                        color: r.topic ? 'var(--accent)' : 'var(--text-sub)' }}>
                        {r.topic || '분류 전'}
                      </span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px',
                        background: r.published ? '#e6f4ea' : 'var(--border-soft)',
                        color: r.published ? '#3f7d54' : 'var(--text-sub)' }}>
                        {r.published ? '공개' : '비공개'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                        {formatTime(r.created_at)}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {/* 고른 것 처리 — 화면 아래 고정 */}
      {picked.size > 0 && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
          background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
          padding: '10px 1rem calc(10px + env(safe-area-inset-bottom))',
          boxShadow: '0 -6px 20px rgba(44,26,14,0.10)' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex',
            alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 700,
              marginRight: 'auto' }}>{picked.size}개 고름</span>

            <button onClick={() => run({ action: 'publish' })} disabled={busy}
              style={{ ...action, background: 'var(--accent)', borderColor: 'var(--accent)',
                color: '#fff' }}>공개하기</button>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setTopicOpen(v => !v)} disabled={busy} style={action}>
                주제 바꾸기
              </button>
              {topicOpen && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
                  minWidth: '10rem', background: 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(44,26,14,0.15)' }}>
                  <button onClick={() => run({ action: 'topic', topic: '' })}
                    style={{ display: 'block', width: '100%', textAlign: 'left',
                      minHeight: '44px', padding: '0 14px', background: 'none', border: 'none',
                      color: 'var(--text-sub)', fontSize: '0.9rem', cursor: 'pointer' }}>
                    분류 전으로
                  </button>
                  {topics.map(t => (
                    <button key={t.name} onClick={() => run({ action: 'topic', topic: t.name })}
                      style={{ display: 'block', width: '100%', textAlign: 'left',
                        minHeight: '44px', padding: '0 14px', background: 'none',
                        borderTop: '1px solid var(--border-soft)', borderLeft: 'none',
                        borderRight: 'none', borderBottom: 'none',
                        color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer' }}>
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5단계에서 켠다 */}
            <button disabled title="5단계에서 만듭니다"
              style={{ ...action, opacity: 0.4, cursor: 'not-allowed' }}>
              묶어서 글 초안 만들기
            </button>

            <button onClick={() => { if (confirm(`${picked.size}개를 지울까요? 되돌릴 수 없습니다.`)) run({}, 'DELETE') }}
              disabled={busy} style={{ ...action, color: '#a33' }}>삭제</button>

            <button onClick={() => setPicked(new Set())} disabled={busy}
              style={{ ...action, border: 'none', background: 'none' }}>해제</button>
          </div>
        </div>
      )}
    </div>
  )
}
