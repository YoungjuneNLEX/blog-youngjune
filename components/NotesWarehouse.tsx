'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { childTopics, libraries, orderedTopics, Topic, topicNamesUnder } from '@/lib/site-config'
import { toPlainText } from '@/lib/cover'
import { openXWindow, xShareUrl } from '@/lib/x-share'
import { formatDay, formatTime } from '@/lib/date'

export interface WarehouseRow {
  id: string
  title: string
  content: string | null
  kind: 'note' | 'article'   // DB 값 그대로. 화면에서는 note = 짧은 글, article = 긴 글
  topic: string | null
  published: boolean
  created_at: string
}

type Tab = 'short' | 'long'
type Filter =
  | { type: 'all' } | { type: 'untagged' } | { type: 'published' }
  | { type: 'private' } | { type: 'topic'; name: string }

/** 서재 바꾸기 메뉴의 한 줄 — 터치 영역 44px */
function menuItem(border: boolean): React.CSSProperties {
  return { display: 'block', width: '100%', textAlign: 'left', minHeight: '44px',
    padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer',
    borderTop: border ? '1px solid var(--border-soft)' : 'none',
    color: 'var(--text-main)', fontSize: '15px', fontFamily: 'inherit' }
}

/**
 * 글관리 — 쓴 글을 날짜별로 펼쳐 놓고 골라서 처리하는 곳.
 * 맨 위 [짧은 글 | 긴 글] 탭마다 같은 필터(분류 전·공개 여부·서재)를 쓰고,
 * 짧은 글은 공개·서재·X 공유·묶어서 긴 글 초안, 긴 글은 공개·서재를 고른다.
 * "공개는 나중에 고르는 것"이라는 원칙이 실제로 일어나는 화면이다.
 */
export default function NotesWarehouse({
  rows, topics, templates, grown, initialTab = 'short',
}: {
  rows: WarehouseRow[]
  topics: Topic[]
  templates: { id: string; name: string }[]
  grown: string[]          // 이미 긴 글 초안으로 자란 짧은 글
  initialTab?: Tab
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [filter, setFilter] = useState<Filter>({ type: 'all' })
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [topicOpen, setTopicOpen] = useState(false)
  const [pickLib, setPickLib] = useState<Topic | null>(null)   // 서재 바꾸기 2단계에서 고른 서재
  const [templateId, setTemplateId] = useState('')
  const grownSet = useMemo(() => new Set(grown), [grown])

  const kind = tab === 'short' ? 'note' : 'article'
  const counts = useMemo(() => ({
    short: rows.filter(r => r.kind === 'note').length,
    long: rows.filter(r => r.kind === 'article').length,
  }), [rows])

  const shown = useMemo(() => rows.filter(r => {
    if (r.kind !== kind) return false
    switch (filter.type) {
      case 'untagged':  return !r.topic
      case 'published': return r.published
      case 'private':   return !r.published
      // 서재를 고르면 그 아래 시리즈 글까지 함께 보여 준다
      case 'topic':     return !!r.topic && topicNamesUnder(topics, filter.name).includes(r.topic)
      default:          return true
    }
  }), [rows, kind, filter, topics])

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
    setBusy(false); setTopicOpen(false); setPickLib(null)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || '처리하지 못했습니다.')
      return
    }
    setPicked(new Set())
    router.refresh()
  }

  /**
   * 고른 짧은 글을 묶어 긴 글 초안 한 편을 만든다.
   * 원본 짧은 글은 그대로 남는다. 새 초안은 비공개로 들어가고, 바로 손볼 수 있게 글쓰기 화면으로 간다.
   */
  async function compose() {
    const picks = Array.from(picked)
    const onlyNotes = picks.filter(id => rows.find(r => r.id === id)?.kind === 'note')
    if (onlyNotes.length === 0) { alert('짧은 글을 하나 이상 골라주세요.'); return }

    setBusy(true)
    const res = await fetch('/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: onlyNotes, templateId: templateId || undefined }),
    })
    setBusy(false)

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || '초안을 만들지 못했습니다.')
      return
    }
    const d = await res.json()
    setPicked(new Set())
    router.push(`/write/${d.id}`)
  }

  /**
   * X 글쓰기 창을 연다. X API 는 쓰지 않고 인텐트 주소로 새 창만 연다.
   * 창은 클릭 처리 안에서 바로 열어야 팝업 차단에 걸리지 않으므로,
   * 공개 전환은 창을 연 뒤에 보낸다.
   */
  function shareToX() {
    if (picked.size !== 1) { alert('짧은 글 하나만 골라주세요.'); return }
    const id = Array.from(picked)[0]
    const row = rows.find(r => r.id === id)
    if (!row) return
    if (row.kind !== 'note') { alert('짧은 글만 X에 공유할 수 있습니다.'); return }
    if (!confirm('X에 공유하면 이 짧은 글은 사이트에서도 공개로 바뀝니다. 계속할까요?')) return

    // 창은 클릭 안에서 바로 열고, 공개 전환은 그 뒤에 보낸다
    openXWindow(xShareUrl(id, row.content))
    run({ action: 'publish' })
  }

  const views: { key: string; label: string; value: Filter }[] = [
    { key: 'all', label: '모두', value: { type: 'all' } },
    { key: 'untagged', label: '분류 전', value: { type: 'untagged' } },
    { key: 'published', label: '공개한 것', value: { type: 'published' } },
    { key: 'private', label: '나만 보기', value: { type: 'private' } },
  ]
  const activeKey = filter.type === 'topic' ? `t:${filter.name}` : filter.type
  const pick = (v: Filter) => { setFilter(v); setPicked(new Set()) }
  function changeTab(next: Tab) {
    if (next === tab) return
    setTab(next); setFilter({ type: 'all' }); setPicked(new Set()); setTopicOpen(false)
  }

  const noun = tab === 'short' ? '짧은 글' : '긴 글'

  const actions = (
    <>
      <button onClick={() => run({ action: 'publish' })} disabled={busy} className="btn">
        선택한 것 공개하기
      </button>
      <button onClick={() => run({ action: 'unpublish' })} disabled={busy} className="btn">
        나만 보기로
      </button>
      <div style={{ position: 'relative' }}>
        <button onClick={() => { setTopicOpen(v => !v); setPickLib(null) }} disabled={busy}
          className="btn" style={{ width: '100%' }}>서재 바꾸기</button>
        {topicOpen && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, zIndex: 50,
            minWidth: '12rem', maxHeight: '60vh', overflowY: 'auto', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {pickLib === null ? (
              <>
                {/* 1단계: 서재를 고른다 */}
                <button onClick={() => run({ action: 'topic', topic: '' })} style={menuItem(false)}>
                  분류 전으로
                </button>
                {libraries(topics).map(lib => (
                  <button key={lib.id} style={{ ...menuItem(true), display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => childTopics(topics, lib.id).length > 0
                      ? setPickLib(lib)
                      : run({ action: 'topic', topic: lib.name })}>
                    <span>{lib.name}</span>
                    {childTopics(topics, lib.id).length > 0 && (
                      <span aria-hidden style={{ color: 'var(--text-faint)' }}>›</span>
                    )}
                  </button>
                ))}
              </>
            ) : (
              <>
                {/* 2단계: 그 서재의 시리즈를 고른다 (관리자 화면이라 빈 시리즈도 보인다) */}
                <button onClick={() => setPickLib(null)} style={{ ...menuItem(false), fontWeight: 700 }}>
                  ‹ {pickLib.name}
                </button>
                <button onClick={() => run({ action: 'topic', topic: pickLib.name })} style={menuItem(true)}>
                  서재에만 두기
                </button>
                {childTopics(topics, pickLib.id).map(t => (
                  <button key={t.id} onClick={() => run({ action: 'topic', topic: t.name })}
                    style={{ ...menuItem(true), paddingLeft: '30px', fontSize: '14px' }}>
                    {t.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
      {tab === 'short' && (
        <button onClick={shareToX} disabled={busy} className="btn">X에 공유</button>
      )}
      <button onClick={() => { if (confirm(`${picked.size}개를 지울까요? 되돌릴 수 없습니다.`)) run({}, 'DELETE') }}
        disabled={busy} className="btn" style={{ color: '#a33' }}>삭제</button>
    </>
  )

  return (
    <div className="wh-page">
      {/* 글관리 머리글 — 오른쪽 위 톱니바퀴가 설정으로 가는 길이다 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '12px', padding: '10px var(--gutter)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', minWidth: 0 }}>
          <Link href="/" className="wordmark">적바림</Link>
          <span className="meta-sub" style={{ fontWeight: 700 }}>글관리</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '14px', padding: '12px 0' }}>사이트</Link>
          <Link href="/write" className="btn btn-accent" style={{ padding: '0 16px' }}>글쓰기</Link>
          <Link href="/admin/settings" aria-label="설정" className="icon-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* 맨 위 탭 */}
      <nav aria-label="글 종류" className="tabs">
        <button className={`tab${tab === 'short' ? ' tab-on' : ''}`} onClick={() => changeTab('short')}>
          짧은 글 {counts.short}
        </button>
        <button className={`tab${tab === 'long' ? ' tab-on' : ''}`} onClick={() => changeTab('long')}>
          긴 글 {counts.long}
        </button>
      </nav>

      <div className="wh-grid">
        {/* PC: 왼쪽 보기 목록 */}
        <nav className="wh-nav">
          <div className="label" style={{ margin: '0 0 8px 12px' }}>보기</div>
          {views.map(v => (
            <button key={v.key} onClick={() => pick(v.value)}
              className={activeKey === v.key ? 'on' : undefined}>{v.label}</button>
          ))}
          <div className="label" style={{ margin: '24px 0 8px 12px' }}>서재</div>
          {orderedTopics(topics).map(({ topic: t, depth }) => (
            <button key={t.id} onClick={() => pick({ type: 'topic', name: t.name })}
              className={activeKey === `t:${t.name}` ? 'on' : undefined}
              style={depth === 1 ? { paddingLeft: '28px', fontSize: '14px' } : undefined}>
              {t.name}
            </button>
          ))}
        </nav>

        <main className="wh-main" style={{ padding: '20px var(--gutter) 96px' }}>
          {/* 모바일: 가로 칩 */}
          <div className="wh-chips chip-row bleed no-scrollbar" style={{ marginBottom: '12px' }}>
            {views.map(v => (
              <button key={v.key} onClick={() => pick(v.value)}
                className={`chip${activeKey === v.key ? ' chip-on' : ''}`}>{v.label}</button>
            ))}
            {orderedTopics(topics).map(({ topic: t, depth }) => (
              <button key={t.id} onClick={() => pick({ type: 'topic', name: t.name })}
                className={`chip${activeKey === `t:${t.name}` ? ' chip-on' : ''}${depth === 1 ? ' chip-sub' : ''}`}>
                {t.short}
              </button>
            ))}
          </div>

          {byDay.length === 0 ? (
            <p className="meta-sub" style={{ padding: '32px 0' }}>여기에 해당하는 {noun}이 없습니다.</p>
          ) : byDay.map(([day, items]) => (
            <section key={day}>
              <div className="wh-day">{day}</div>
              {items.map(r => {
                const on = picked.has(r.id)
                const meta = (
                  <span className="meta">
                    {formatTime(r.created_at)} · {r.topic || '분류 전'} ·{' '}
                    {r.published ? '공개됨' : '나만 보기'}
                    {grownSet.has(r.id) && ' · 긴 글 초안으로 자람'}
                  </span>
                )
                return (
                  <div key={r.id} className="wh-row">
                    <input type="checkbox" id={`n-${r.id}`} checked={on} onChange={() => toggle(r.id)}
                      aria-label="고르기" />
                    {r.kind === 'article' ? (
                      // 긴 글은 누르면 고치는 화면으로 간다. 고르기는 왼쪽 체크칸으로.
                      <Link href={`/write/${r.id}`} className="wh-open">
                        <span className="wh-text" style={{ fontWeight: 700 }}>
                          {r.title || '(제목 없음)'}
                        </span>
                        {meta}
                      </Link>
                    ) : (
                      <label htmlFor={`n-${r.id}`}>
                        <span className="wh-text">{toPlainText(r.content)}</span>
                        {meta}
                      </label>
                    )}
                    {r.kind === 'note' && (
                      <Link href={`/write/${r.id}`} className="wh-edit">고치기</Link>
                    )}
                  </div>
                )
              })}
            </section>
          ))}
        </main>

        {/* PC: 오른쪽 처리 패널 */}
        <aside className="wh-aside">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="label">선택한 {noun} {picked.size}개</div>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--quote)' }}>
              {tab === 'short'
                ? '같은 흐름의 짧은 글을 골라 긴 글 한 편으로 키웁니다.'
                : '긴 글을 누르면 고치는 화면으로 갑니다. 여기서는 여러 편을 골라 공개와 서재를 바꿉니다.'}
            </p>
          </div>

          {tab === 'short' && (
            <>
              {templates.length > 0 && (
                <label style={{ display: 'block' }}>
                  <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>템플릿 (선택)</span>
                  <select value={templateId} onChange={e => setTemplateId(e.target.value)}
                    style={{ width: '100%', minHeight: '44px', padding: '0 10px', fontSize: '15px',
                      border: '1px solid var(--border)', borderRadius: '10px',
                      background: 'var(--bg)', color: 'var(--text-main)', fontFamily: 'inherit' }}>
                    <option value="">뼈대 없이</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
              )}
              <button onClick={compose} className="btn btn-ink" disabled={busy || picked.size === 0}>
                {busy ? '엮는 중…' : '묶어서 긴 글 초안 만들기'}
              </button>
            </>
          )}
          {actions}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px',
            paddingTop: '20px', borderTop: '1px solid var(--border-soft)' }}>
            <div className="label">규칙</div>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: 'var(--quote)' }}>
              새로 쓴 짧은 글은 나만 보기로 저장됩니다. 공개는 여기서 직접 고를 때만 일어납니다.
              X에 공유하면 그 짧은 글은 사이트에서도 공개로 바뀝니다.
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
            {tab === 'short' && (
              <button onClick={compose} disabled={busy} className="btn"
                style={{ background: 'var(--text-main)', borderColor: 'var(--text-main)',
                  color: 'var(--on-ink)' }}>
                {busy ? '엮는 중…' : '묶어서 초안'}
              </button>
            )}
            {actions}
            <button onClick={() => setPicked(new Set())} disabled={busy} className="btn"
              style={{ border: 'none' }}>해제</button>
          </div>
        </div>
      )}
    </div>
  )
}
