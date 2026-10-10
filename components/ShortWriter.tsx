'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import LibrarySeriesPicker from '@/components/LibrarySeriesPicker'
import { Topic } from '@/lib/site-config'
import { formatTime } from '@/lib/date'
import { fetchWithTimeout, networkErrorMessage } from '@/lib/http'

export const DRAFT_KEY = 'jeokbarim:short-draft'

export interface MemoRow {
  id: string
  content: string | null
  topic: string | null
  created_at: string
}

/**
 * 짧은 글 쓰기 — 들어오면 바로 쓸 수 있어야 한다.
 * 제목도 표지도 없고 서재는 안 골라도 된다. 새로 쓰면 곧장 "나만 보기"로 들어간다.
 * edit 이 있으면 이미 있는 짧은 글을 고치는 화면이 된다. (/write/[id])
 */
export default function ShortWriter({
  topics, text, onText, topic, onTopic, today = [], onSaved, edit,
  counts, onTopicCreated,
}: {
  topics: Topic[]
  text: string
  onText: (v: string) => void
  topic: string
  onTopic: (v: string) => void
  today?: MemoRow[]
  counts?: Record<string, number>        // 서재·시리즈별 편수 (시리즈 옆에 보인다)
  onTopicCreated?: (topic: Topic) => void // 글쓰기에서 새로 만든 시리즈를 바깥 목록에도 넣는다
  onSaved?: (row: MemoRow) => void   // 새로 쓴 것을 바깥에도 알린다 (모드를 바꿔도 목록이 남게)
  edit?: { postId: string; published: boolean }
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [list, setList] = useState<MemoRow[]>(today)
  const boxRef = useRef<HTMLTextAreaElement>(null)

  // 화면에 들어오면 곧바로 입력창에 커서를 둔다
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])

  // 쓰던 짧은 글을 이 기기에 임시로 남겨 둔다. 저장이 실패하거나 화면을 나가도 다시 돌아오면 이어 쓸 수 있게.
  // (새로 쓰는 경우만. 고치기 화면은 DB 에 원본이 있으니 남기지 않는다)
  useEffect(() => {
    if (edit || text) return
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) onText(draft)
    } catch { /* 저장소를 못 쓰는 브라우저면 넘어간다 */ }
    // 처음 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (edit) return
    try {
      if (text.trim()) localStorage.setItem(DRAFT_KEY, text)
      else localStorage.removeItem(DRAFT_KEY)
    } catch { /* 무시 */ }
  }, [text, edit])

  async function save() {
    const body = text.trim()
    if (!body || saving) return
    setSaving(true); setError('')

    let res: Response
    try {
      res = edit
        ? await fetchWithTimeout(`/api/posts/${edit.postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            // 공개 여부는 건드리지 않는다. 바꾸는 것은 본문과 서재·시리즈뿐.
            body: JSON.stringify({ content: body, topic: topic || null }),
          })
        : await fetchWithTimeout('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: body, topic: topic || null }),
          })
    } catch (e) {
      // 통신이 끊겨도 "저장 중…"에 매달리지 않는다. 쓴 글은 지우지 않는다.
      setSaving(false)
      setError(networkErrorMessage(e))
      return
    }
    setSaving(false)

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(
        res.status === 403
          ? '로그인이 풀렸습니다. 쓴 글은 그대로 있으니 다시 로그인한 뒤 눌러 주세요.'
          : d.error || '저장하지 못했습니다. 다시 시도해주세요.',
      )
      return
    }

    if (edit) {
      router.push('/notes')
      router.refresh()
      return
    }
    const saved: MemoRow = await res.json()
    setList(prev => [saved, ...prev])
    onSaved?.(saved)
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* 무시 */ }
    onText('')
    // 서재·시리즈는 남겨 둔다 — 같은 곳에 이어 적는 일이 많다
    boxRef.current?.focus()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); save() }
  }

  const label = (name: string | null) =>
    topics.find(t => t.name === name)?.short || name || '분류 전'

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', padding: '20px 20px 48px',
      display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div className="memo-card">
        <label htmlFor="short-body" className="meta-sub">
          {edit ? '짧은 글 고치기' : '지금 떠오른 것'}
        </label>
        <textarea id="short-body" ref={boxRef} className="memo-box"
          value={text} onChange={e => onText(e.target.value)} onKeyDown={onKeyDown}
          placeholder="제목 없이, 한 줄이어도 괜찮아요" />

        {/* 서재 + 시리즈. 서재를 안 고르면 '분류 전'으로 들어간다. 시리즈 칸은 접어 두고 '+ 시리즈 추가'로 편다. */}
        <LibrarySeriesPicker topics={topics} value={topic} onChange={onTopic}
          counts={counts} onCreated={onTopicCreated} canCreate collapseSeries />

        {error && <p style={{ margin: 0, color: '#a33', fontSize: '13px' }}>{error}</p>}

        <div className="memo-foot">
          <span className="meta-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {edit?.published ? (
              '공개 중 — 고친 내용이 바로 사이트에 반영됩니다'
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                나만 보기로 저장
              </>
            )}
          </span>
          <button type="button" onClick={save} disabled={saving || !text.trim()}
            className="btn btn-accent" style={{ padding: '0 22px' }}>
            {saving ? '저장 중…' : edit ? '저장하기' : '적기'}
          </button>
        </div>
      </div>

      {!edit && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="label" style={{ marginBottom: '6px' }}>오늘 쓴 짧은 글</div>
          {list.length === 0 ? (
            <p className="meta-sub" style={{ padding: '14px 0' }}>오늘은 아직 쓴 짧은 글이 없습니다.</p>
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
      )}
    </div>
  )
}
