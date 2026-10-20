'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDay, formatTime } from '@/lib/date'
import { fetchWithTimeout, networkErrorMessage } from '@/lib/http'

export interface MemoRow {
  id: string
  content: string | null
  created_at: string
}

// 쓰던 메모를 이 기기에 임시로 남겨 둔다. (예전 짧은 글 임시 저장과 같은 이름이라 남은 글이 이어진다)
const DRAFT_KEY = 'jeokbarim:short-draft'

/**
 * 빠른 메모 — 제목 없이 바로 적는다.
 * 열자마자 커서가 입력칸에 있고, 쓰던 글은 이 기기에 임시 저장된다.
 * 메모는 나중에 콘티의 카드로 옮겨 쓴다. (그 기능은 마지막 단계에서)
 */
export default function MemoScreen({
  initial, loadFailed,
}: { initial: MemoRow[]; loadFailed: boolean }) {
  const [text, setText] = useState('')
  const [list, setList] = useState<MemoRow[]>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const boxRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { boxRef.current?.focus() }, [])

  // 남아 있던 임시 저장을 불러온다 (처음 한 번)
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) setText(draft)
    } catch { /* 저장소를 못 쓰는 브라우저면 넘어간다 */ }
  }, [])

  useEffect(() => {
    try {
      if (text.trim()) localStorage.setItem(DRAFT_KEY, text)
      else localStorage.removeItem(DRAFT_KEY)
    } catch { /* 무시 */ }
  }, [text])

  async function save() {
    const body = text.trim()
    if (!body || saving) return
    setSaving(true); setError('')

    let res: Response
    try {
      res = await fetchWithTimeout('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body }),
      })
    } catch (e) {
      setSaving(false)
      setError(networkErrorMessage(e))   // 쓴 글은 지우지 않는다
      return
    }
    setSaving(false)

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(
        res.status === 401 || res.status === 403
          ? '로그인이 풀렸습니다. 쓴 글은 그대로 있으니 다시 로그인한 뒤 눌러 주세요.'
          : d.error || '저장하지 못했습니다. 다시 시도해 주세요.',
      )
      return
    }

    const saved: MemoRow = await res.json()
    setList(prev => [saved, ...prev])
    setText('')
    boxRef.current?.focus()
  }

  async function remove(id: string) {
    if (!confirm('이 메모를 지울까요? 되돌릴 수 없습니다.')) return
    try {
      const res = await fetchWithTimeout('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      if (!res.ok) throw new Error()
      setList(prev => prev.filter(m => m.id !== id))
    } catch {
      alert('지우지 못했습니다. 잠시 뒤 다시 눌러 주세요.')
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); save() }
  }

  // 날짜별로 묶는다
  const byDay = useMemo(() => {
    const map = new Map<string, MemoRow[]>()
    for (const m of list) {
      const k = formatDay(m.created_at)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(m)
    }
    return Array.from(map.entries())
  }, [list])

  return (
    <>
      <h1 className="page-title">메모</h1>

      <div className="card">
        <label htmlFor="memo-body" className="label">지금 떠오른 것</label>
        <textarea id="memo-body" ref={boxRef} className="memo-box"
          value={text} onChange={e => setText(e.target.value)} onKeyDown={onKeyDown}
          placeholder="제목 없이, 한 줄이어도 괜찮아요" />
        <p className="hint">개인정보·사건 식별 정보는 적지 않습니다.</p>
        {error && <p role="alert" className="error">{error}</p>}
        <button type="button" className="btn btn-accent btn-block" onClick={save}
          disabled={saving || !text.trim()}>
          {saving ? '저장 중…' : '적기'}
        </button>
      </div>

      <section style={{ marginTop: '28px' }}>
        <h2 className="label">지난 메모</h2>
        {loadFailed && <p className="error">메모를 불러오지 못했습니다. 새로고침해 보세요.</p>}
        {!loadFailed && list.length === 0 && (
          <p className="empty-sub" style={{ padding: '16px 0' }}>아직 적은 메모가 없습니다.</p>
        )}
        {byDay.map(([day, items]) => (
          <div key={day}>
            <div className="day">{day}</div>
            {items.map(m => (
              <div key={m.id} className="memo-row">
                <p className="memo-text">{m.content}</p>
                <div className="memo-meta">
                  <span>{formatTime(m.created_at)}</span>
                  <button type="button" className="link-btn" onClick={() => remove(m.id)}>지우기</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>
    </>
  )
}
