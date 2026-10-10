'use client'

import { useState } from 'react'
import { libraries, childTopics, selectionOf, Topic, topicNameOf } from '@/lib/site-config'
import { fetchWithTimeout, networkErrorMessage } from '@/lib/http'

/**
 * 서재 + 시리즈 두 칸으로 고르는 부품. 짧은 글·긴 글·고치기 화면이 같이 쓴다.
 *
 * - 서재는 필수가 아니다. 비우면 분류 전.
 * - 시리즈는 고른 서재의 것만 보이고, 이름 옆에 편수가 붙는다.
 * - 시리즈 칸에 새 이름을 쓰면 그 자리에서 그 서재 아래 시리즈로 만들어 설정에 저장한다.
 *   같은 서재에 같은 이름이 이미 있으면 새로 만들지 않고 그것을 고른다.
 * - 저장되는 값(posts.topic)은 이름 하나: 시리즈가 있으면 시리즈 이름, 없으면 서재 이름.
 *
 * value / onChange 는 그 이름 하나로 주고받는다.
 */
export default function LibrarySeriesPicker({
  topics, value, onChange, counts = {}, onCreated, canCreate = true, collapseSeries = false,
}: {
  topics: Topic[]
  value: string
  onChange: (name: string) => void
  counts?: Record<string, number>          // 이름별 편수 (공개하지 않은 글 포함)
  onCreated?: (topic: Topic) => void       // 새로 만든 시리즈를 바깥 목록에도 넣는다
  canCreate?: boolean                      // 시리즈 만들기는 관리자만
  collapseSeries?: boolean                 // 짧은 글: 시리즈 칸을 접어 두고 '+ 시리즈 추가'로 편다
}) {
  const { library, series } = selectionOf(topics, value)
  const seriesList = library ? childTopics(topics, library.id) : []

  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // 접어 두는 화면이라도 이미 시리즈가 골라져 있으면 펼쳐서 보여 준다
  const showSeries = !collapseSeries || expanded || Boolean(series)

  const typed = draft.trim().replace(/\s+/g, ' ')
  const sameHere = typed
    ? seriesList.find(t => t.name.toLowerCase() === typed.toLowerCase())
    : undefined

  function pickLibrary(t: Topic) {
    setError(''); setDraft('')
    // 같은 서재를 다시 누르면 해제. 서재가 바뀌면 시리즈는 비운다(자연히 서재 이름만 남는다).
    onChange(library?.id === t.id ? '' : topicNameOf(t, null))
  }

  function pickSeries(t: Topic) {
    setError('')
    onChange(series?.id === t.id ? topicNameOf(library, null) : t.name)
  }

  async function addSeries() {
    if (!library || !typed || busy) return
    setError('')
    if (sameHere) { onChange(sameHere.name); setDraft(''); return }

    // 서버에 가기 전에 눈에 보이는 충돌은 바로 알려 준다
    const clash = topics.find(t => t.name.toLowerCase() === typed.toLowerCase())
    if (clash) {
      const owner = clash.parentId ? topics.find(t => t.id === clash.parentId)?.name : null
      setError(owner
        ? `'${clash.name}' 은(는) 이미 '${owner}' 서재의 시리즈로 있습니다.`
        : `'${clash.name}' 은(는) 이미 서재 이름으로 있습니다.`)
      return
    }

    setBusy(true)
    try {
      const res = await fetchWithTimeout('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryId: library.id, name: typed }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setError(d.error || '시리즈를 만들지 못했습니다.'); return }
      const made: Topic = d.topic
      if (!d.existing) onCreated?.(made)
      onChange(made.name)
      setDraft('')
    } catch (e) {
      setError(networkErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lsp">
      <div className="lsp-group">
        <span className="meta lsp-label">서재</span>
        <div className="lsp-chips">
          {libraries(topics).map(t => (
            <button key={t.id} type="button" onClick={() => pickLibrary(t)}
              className={`chip${library?.id === t.id ? ' chip-on' : ''}`}>
              {t.short || t.name}
            </button>
          ))}
          {libraries(topics).length === 0 && (
            <span className="meta">아직 서재가 없습니다. 설정에서 서재를 먼저 만들어 주세요.</span>
          )}
        </div>
      </div>

      {collapseSeries && !showSeries && library && canCreate && (
        <button type="button" className="lsp-more" onClick={() => setExpanded(true)}>+ 시리즈 추가</button>
      )}
      {collapseSeries && !showSeries && library && !canCreate && seriesList.length > 0 && (
        <button type="button" className="lsp-more" onClick={() => setExpanded(true)}>+ 시리즈 고르기</button>
      )}

      {showSeries && (
        <div className="lsp-group">
          <span className="meta lsp-label">시리즈 (선택)</span>
          {!library ? (
            <span className="meta">서재를 먼저 고르세요.</span>
          ) : (
            <>
              <div className="lsp-chips">
                {seriesList.map(t => (
                  <button key={t.id} type="button" onClick={() => pickSeries(t)}
                    className={`chip chip-sub${series?.id === t.id ? ' chip-on' : ''}`}>
                    {t.short || t.name}
                    <span className="lsp-count">{counts[t.name] ?? 0}편</span>
                  </button>
                ))}
                {seriesList.length === 0 && (
                  <span className="meta">이 서재에는 아직 시리즈가 없습니다.</span>
                )}
              </div>

              {canCreate && (
                <div className="lsp-add">
                  <input value={draft} maxLength={30} placeholder="새 시리즈 이름"
                    onChange={e => { setDraft(e.target.value); setError('') }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSeries() } }} />
                  <button type="button" className="btn" onClick={addSeries}
                    disabled={busy || !typed}>
                    {busy ? '만드는 중…' : sameHere ? '고르기' : '시리즈 만들기'}
                  </button>
                </div>
              )}
              {error && <p className="lsp-error">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
