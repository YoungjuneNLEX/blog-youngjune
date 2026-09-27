'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Topic } from '@/lib/site-config'
import { toPlainText } from '@/lib/cover'
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
  | { type: 'all' } | { type: 'untagged' } | { type: 'published' }
  | { type: 'growing' } | { type: 'topic'; name: string }

// X 는 링크를 23자로 셈한다. 280 에서 링크와 사이 공백을 빼고 여유를 둔다.
const X_TEXT_LIMIT = 250

/**
 * 노트 창고 — 적어 둔 것을 날짜별로 펼쳐 놓고 골라서 처리하는 곳.
 * "공개는 나중에 고르는 것"이라는 원칙이 실제로 일어나는 화면이다.
 * 옛 서재관리(/manage)를 여기로 합쳤다.
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

  const byDay = useMemo(() => {
    const map = new Map<string, WarehouseRow[]>()
    for (const r of shown) {
      const k = formatDay(r.created_at)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(r)
    }
    return Array.from(map.entries())
  }, [shown])

  function toggle(id: string) {
    setPicked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
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
    setBusy(false); setTopicOpen(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || '처리하지 못했습니다.')
      return
    }
    setPicked(new Set())
    router.refresh()
  }

  /**
   * X 글쓰기 창을 연다. X API 는 쓰지 않고 인텐트 주소로 새 창만 연다.
   * 창은 클릭 처리 안에서 바로 열어야 팝업 차단에 걸리지 않으므로,
   * 공개 전환은 창을 연 뒤에 보낸다.
   */
  function shareToX() {
    if (picked.size !== 1) { alert('메모 하나만 골라주세요.'); return }
    const id = Array.from(picked)[0]
    const row = rows.find(r => r.id === id)
    if (!row) return
    if (row.kind !== 'note') { alert('메모만 X에 공유할 수 있습니다.'); return }
    if (!confirm('X에 공유하면 이 메모는 적바림에서도 공개로 바뀝니다. 계속할까요?')) return

    const url = `${window.location.origin}/posts/${id}`
    const body = toPlainText(row.content)
    const text = body.length > X_TEXT_LIMIT
      ? body.slice(0, X_TEXT_LIMIT - 1).trimEnd() + '…'
      : body

    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank', 'noopener,noreferrer',
    )
    run({ action: 'publish' })
  }

  const views: { key: string; label: string; value: Filter }[] = [
    { key: 'all', label: '모든 노트', value: { type: 'all' } },
    { key: 'untagged', label: '분류 전', value: { type: 'untagged' } },
    { key: 'published', label: '공개한 것', value: { type: 'published' } },
    { key: 'growing', label: '키우는 중', value: { type: 'growing' } },
  ]
  const activeKey = filter.type === 'topic' ? `t:${filter.name}` : filter.type
  const pick = (v: Filter) => { setFilter(v); setPicked(new Set()) }

  const actions = (
    <>
      <button onClick={() => run({ action: 'publish' })} disabled={busy} className="btn">
        선택한 것 공개하기
      </button>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setTopicOpen(v => !v)} disabled={busy} className="btn"
          style={{ width: '100%' }}>주제 바꾸기</button>
        {topicOpen && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, zIndex: 50,
            minWidth: '11rem', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(44,26,14,0.15)' }}>
            <button onClick={() => run({ action: 'topic', topic: '' })}
              style={{ display: 'block', width: '100%', textAlign: 'left', minHeight: '44px',
                padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-sub)', fontSize: '15px', fontFamily: 'inherit' }}>
              분류 전으로
            </button>
            {topics.map(t => (
              <button key={t.name} onClick={() => run({ action: 'topic', topic: t.name })}
                style={{ display: 'block', width: '100%', textAlign: 'left', minHeight: '44px',
                  padding: '0 14px', background: 'none', borderTop: '1px solid var(--border-soft)',
                  borderLeft: 'none', borderRight: 'none', borderBottom: 'none', cursor: 'pointer',
                  color: 'var(--text-main)', fontSize: '15px', fontFamily: 'inherit' }}>
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={shareToX} disabled={busy} className="btn">X에 공유</button>
      <button onClick={() => { if (confirm(`${picked.size}개를 지울까요? 되돌릴 수 없습니다.`)) run({}, 'DELETE') }}
        disabled={busy} className="btn" style={{ color: '#a33' }}>삭제</button>
    </>
  )

  return (
    <div className="wh-page">
      {/* 창고 머리글 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '12px', padding: '16px var(--gutter)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', minWidth: 0 }}>
          <Link href="/memo" className="wordmark">적바림</Link>
          <span className="meta-sub">내 창고</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '14px' }}>사이트 보기</Link>
          <Link href="/write" className="btn btn-accent">새 긴 글</Link>
        </div>
      </header>

      <div className="wh-grid">
        {/* PC: 왼쪽 보기 목록 */}
        <nav className="wh-nav">
          <div className="label" style={{ margin: '0 0 8px 12px' }}>보기</div>
          {views.map(v => (
            <button key={v.key} onClick={() => pick(v.value)}
              className={activeKey === v.key ? 'on' : undefined}>{v.label}</button>
          ))}
          <div className="label" style={{ margin: '24px 0 8px 12px' }}>주제</div>
          {topics.map(t => (
            <button key={t.name} onClick={() => pick({ type: 'topic', name: t.name })}
              className={activeKey === `t:${t.name}` ? 'on' : undefined}>{t.name}</button>
          ))}
        </nav>

        <main className="wh-main" style={{ padding: '20px var(--gutter) 96px' }}>
          {/* 모바일: 가로 칩 */}
          <div className="wh-chips chip-row bleed no-scrollbar" style={{ marginBottom: '12px' }}>
            {views.map(v => (
              <button key={v.key} onClick={() => pick(v.value)}
                className={`chip${activeKey === v.key ? ' chip-on' : ''}`}>{v.label}</button>
            ))}
            {topics.map(t => (
              <button key={t.name} onClick={() => pick({ type: 'topic', name: t.name })}
                className={`chip${activeKey === `t:${t.name}` ? ' chip-on' : ''}`}>{t.short}</button>
            ))}
          </div>

          {byDay.length === 0 ? (
            <p className="meta-sub" style={{ padding: '32px 0' }}>여기에 해당하는 노트가 없습니다.</p>
          ) : byDay.map(([day, items]) => (
            <section key={day}>
              <div className="wh-day">{day}</div>
              {items.map(r => {
                const on = picked.has(r.id)
                return (
                  <div key={r.id} className="wh-row">
                    <input type="checkbox" id={`n-${r.id}`} checked={on} onChange={() => toggle(r.id)} />
                    <label htmlFor={`n-${r.id}`}>
                      {r.kind === 'article' ? (
                        <span className="wh-text" style={{ fontWeight: 700 }}>
                          {r.title || '(제목 없음)'}
                          <Link href={`/write/${r.id}`} onClick={e => e.stopPropagation()}
                            style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--accent)' }}>
                            고치기
                          </Link>
                        </span>
                      ) : (
                        <span className="wh-text">{toPlainText(r.content)}</span>
                      )}
                      <span className="meta">
                        {formatTime(r.created_at)} · {r.topic || '분류 전'} ·{' '}
                        {r.published ? '공개됨' : '나만 보기'}
                        {r.kind === 'article' && ' · 긴 글'}
                      </span>
                    </label>
                  </div>
                )
              })}
            </section>
          ))}
        </main>

        {/* PC: 오른쪽 처리 패널 */}
        <aside className="wh-aside">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="label">선택한 메모 {picked.size}개</div>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--quote)' }}>
              같은 흐름의 메모를 골라 한 편의 글로 키웁니다.
            </p>
          </div>

          <button className="btn btn-ink" disabled title="5단계에서 만듭니다">
            묶어서 글 초안 만들기
          </button>
          {actions}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px',
            paddingTop: '20px', borderTop: '1px solid var(--border-soft)' }}>
            <div className="label">규칙</div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: 'var(--quote)' }}>
              모든 메모는 나만 보기로 저장됩니다. 공개는 여기서 직접 고를 때만 일어납니다.
              X에 공유하면 그 메모는 적바림에서도 공개로 바뀝니다.
            </p>
          </div>
        </aside>
      </div>

      {/* 모바일: 아래 고정 처리 막대 */}
      {picked.size > 0 && (
        <div className="wh-bar">
          <div className="wh-bar-inner">
            <span style={{ fontSize: '14px', fontWeight: 700, marginRight: 'auto' }}>
              {picked.size}개 고름
            </span>
            {actions}
            <button onClick={() => setPicked(new Set())} disabled={busy} className="btn"
              style={{ border: 'none' }}>해제</button>
          </div>
        </div>
      )}
    </div>
  )
}
