'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchWithTimeout, networkErrorMessage } from '@/lib/http'
import dynamic from 'next/dynamic'
import { childTopics, Topic } from '@/lib/site-config'

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false })

/**
 * 고칠 때 불러온 값 중 이 화면에서 직접 고치지 않는 것.
 * 보이지 않는 칸이라도 저장할 때 그대로 되돌려 보내야 옛 값이 지워지지 않는다.
 */
export interface LongInitial {
  category?: string
  tags?: string[]
  excerpt?: string
  visibility?: 'public' | 'members'
  summary?: string
  thumbnailUrl?: string
}

const esc = (s: string) => s.replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

/**
 * 긴 글 쓰기·고치기. 제목·본문·주제는 바깥(글쓰기 화면)이 쥐고 있어서,
 * 짧은 글 ↔ 긴 글을 바꿔도 쓰던 것이 그대로 따라온다.
 * postId 가 있으면 그 글을 고치는 것이고, 없으면 새 글이다.
 */
export default function LongWriter({
  postId, topics, title, onTitle, content, onContent, topic, onTopic, initial,
}: {
  postId?: string
  topics: Topic[]
  title: string
  onTitle: (v: string) => void
  content: string
  onContent: (v: string) => void
  topic: string
  onTopic: (v: string) => void
  initial?: LongInitial
}) {
  const router = useRouter()

  const [visibility, setVisibility] = useState<'public' | 'members'>(initial?.visibility ?? 'public')
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? '')
  const [thumbnailPreview, setThumbnailPreview] = useState(initial?.thumbnailUrl ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [summarizing, setSummarizing] = useState(false)
  const [templates, setTemplates] = useState<{ id: string; name: string; body: string }[]>([])
  // 템플릿을 넣으면 에디터를 새로 만들어 본문을 갈아끼운다
  const [editorKey, setEditorKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [showMeta, setShowMeta] = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [reviewData, setReviewData] = useState<{
    spelling: {original:string,suggestion:string,reason:string}[]
    titleSuggestions: string[]
    tagSuggestions: string[]
    review: string
  } | null>(null)
  const [highlightWord, setHighlightWord] = useState<string | undefined>(undefined)

  const fileRef = useRef<HTMLInputElement>(null)

  // 템플릿은 관리자 설정에서 가져온다. 주제 목록은 바깥에서 받는다.
  useEffect(() => {
    fetch('/api/templates').then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(() => {})
  }, [])

  // 템플릿 불러오기 — 이미 쓴 것이 있으면 덮어쓸지 묻는다
  function applyTemplate(id: string) {
    const t = templates.find(x => x.id === id)
    if (!t) return
    const written = content.replace(/<[^>]*>/g, '').trim()
    if (written && !confirm('지금 쓴 본문을 템플릿으로 덮어쓸까요?')) return
    onContent(t.body)
    setEditorKey(k => k + 1)
  }

  // 세 줄 요약 만들기 — 만들어 주기만 하고, 저장은 글을 저장할 때 함께 된다
  async function makeSummary() {
    if (!content.trim()) { alert('본문을 먼저 작성해주세요.'); return }
    setSummarizing(true)
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    setSummarizing(false)
    if (!res.ok) { alert('요약을 만들지 못했습니다.'); return }
    const d = await res.json()
    setSummary(d.summary || '')
  }

  async function handleReview() {
    if (!content.trim()) { alert('본문을 먼저 작성해주세요.'); return }
    setReviewing(true)
    setShowReview(true)
    setReviewData(null)
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
    const data = await res.json()
    setReviewData(data)
    setReviewing(false)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const previous = thumbnailPreview

    // 미리보기
    setThumbnailPreview(URL.createObjectURL(file))

    // 업로드
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (res.ok) {
      const { url } = await res.json()
      setThumbnailUrl(url)
    } else {
      alert('이미지 업로드에 실패했습니다.')
      setThumbnailPreview(previous)
    }
    setUploading(false)
  }

  async function handleSave(publish: boolean) {
    if (!title.trim()) { alert('제목을 입력해주세요.'); return }
    setSaving(true); setStatus('')

    const body = {
      title, content, visibility, topic, summary,
      // 화면에 없는 칸은 불러온 값을 그대로 돌려 보낸다. 새 글이면 비워 둔다.
      category: initial?.category ?? '에세이',
      tags: initial?.tags ?? [],
      excerpt: initial?.excerpt ?? '',
      thumbnail_url: thumbnailUrl || null,
      published: publish,
    }

    try {
      const res = await fetchWithTimeout(postId ? `/api/posts/${postId}` : '/api/posts', {
        method: postId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const post = await res.json()
        setStatus(publish ? '발행 완료!' : postId ? '저장 완료!' : '초안 저장 완료!')
        setTimeout(() => router.push(publish && !postId ? `/posts/${post.id}` : '/notes?tab=long'), 800)
      } else if (res.status === 401 || res.status === 403) {
        setStatus('로그인이 풀렸습니다. 쓴 글은 그대로 있으니 다시 로그인한 뒤 저장해 주세요.')
      } else {
        setStatus('오류가 발생했습니다.')
      }
    } catch (e) {
      // 통신이 끊겨도 "저장 중…"에 매달리지 않는다. 쓴 글은 화면에 그대로 남는다.
      setStatus(networkErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const badge = topic
    ? `<span style="font-size:11px;background:#e4eaf3;color:#33517e;padding:2px 8px;border-radius:999px;font-weight:600;">${esc(topic)}</span>`
    : ''
  const previewHtml = `
    <div style="padding:1rem;font-size:14px;line-height:2;color:#1f1f1f;font-family:'Apple SD Gothic Neo',sans-serif;">
      ${thumbnailPreview ? `<img src="${thumbnailPreview}" style="width:100%;border-radius:8px;margin-bottom:1rem;object-fit:cover;max-height:160px;" />` : ''}
      ${badge}
      <h1 style="font-size:18px;font-weight:800;margin:0.75rem 0 0.25rem;line-height:1.3;">${esc(title) || '제목을 입력하세요'}</h1>
      <div style="font-size:14px;line-height:2;color:#1f1f1f;">${content || '<p style="color:#767676;">본문이 여기에 표시됩니다...</p>'}</div>
    </div>
  `

  return (
    <div className="write-shell">

      {/* 상단 툴바 */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', rowGap: '8px', columnGap: '12px', flexShrink: 0 }}>
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap', rowGap: '8px' }}>
          <button onClick={() => setShowMeta(v => !v)}
            style={{ color: 'var(--text-sub)', fontSize: '0.82rem', whiteSpace: 'nowrap', minHeight: '44px',
              border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px',
              background: showMeta ? 'var(--bg)' : 'transparent' }}
            className="hover:opacity-80 transition">
            글 설정 {showMeta ? '▲' : '▼'}
          </button>
          <button onClick={handleReview}
            style={{ color: '#7c5c9a', fontSize: '0.82rem', whiteSpace: 'nowrap', minHeight: '44px',
              border: '1px solid #c4a8e0', borderRadius: '6px', padding: '4px 10px',
              background: showReview ? '#f5effe' : 'transparent' }}
            className="hover:opacity-80 transition">
            📖 사서 제안
          </button>
          {status && <span style={{ color: status.includes('오류') ? '#e04040' : '#4a7c59', fontSize: '0.82rem' }}>{status}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave(false)} disabled={saving}
            style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', minHeight: '44px', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '7px 14px', background: 'var(--bg)',
              color: 'var(--text-sub)', cursor: 'pointer' }}
            className="hover:opacity-80 disabled:opacity-50 transition">임시저장</button>
          <button onClick={() => handleSave(true)} disabled={saving}
            style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', minHeight: '44px', background: 'var(--accent)', color: '#fff',
              borderRadius: '8px', padding: '7px 18px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            className="hover:opacity-80 disabled:opacity-50 transition">
            {saving ? '저장 중...' : postId ? '저장하기' : '발행하기'}
          </button>
        </div>
      </div>

      {/* 글 설정 패널 */}
      {showMeta && (
        <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          padding: '14px 20px', flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: '16px',
          alignItems: 'flex-end' }}>

          {/* 템플릿 불러오기 */}
          {templates.length > 0 && (
            <div>
              <label style={labelStyle}>템플릿</label>
              <select value="" style={inputStyle}
                onChange={e => { applyTemplate(e.target.value); e.target.value = '' }}>
                <option value="">불러오기…</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {/* 주제 — 대분류 > 중분류. 표지 색과 주제 페이지가 이 값을 쓴다. */}
          <div>
            <label style={labelStyle}>주제</label>
            <select value={topic} onChange={e => onTopic(e.target.value)} style={inputStyle}>
              <option value="">분류 전</option>
              {topics.filter(t => !t.parentId).map(parent => {
                const kids = childTopics(topics, parent.id)
                return kids.length === 0
                  ? <option key={parent.id} value={parent.name}>{parent.name}</option>
                  : (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.name}>{parent.name} (대분류)</option>
                      {kids.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                    </optgroup>
                  )
              })}
            </select>
          </div>

          {/* 세 줄 요약 — 발행할 때 한 번 만들어 저장한다. 고칠 수 있다. */}
          <div style={{ flexBasis: '100%' }}>
            <label style={labelStyle}>
              세 줄 요약 (발행하면 요약 창에 보입니다)
              <button type="button" onClick={makeSummary} disabled={summarizing}
                style={{ marginLeft: '8px', fontSize: '0.75rem', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '2px 8px', background: 'var(--bg-card)',
                  color: 'var(--accent)', cursor: 'pointer' }}>
                {summarizing ? '만드는 중…' : '요약 만들기'}
              </button>
            </label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3}
              placeholder="한 줄에 하나씩. 비워 두면 요약 없이 발행됩니다."
              style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.7,
                fontFamily: 'inherit' }} />
          </div>

          {/* 공개 범위 */}
          <div>
            <label style={labelStyle}>공개 범위</label>
            <div className="flex gap-3 mt-1">
              {(['public', 'members'] as const).map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.82rem', color: 'var(--text-sub)', cursor: 'pointer' }}>
                  <input type="radio" name="vis" value={v} checked={visibility === v} onChange={() => setVisibility(v)} />
                  {v === 'public' ? '모두 공개' : '회원 공개'}
                </label>
              ))}
            </div>
          </div>

          {/* 썸네일 업로드 */}
          <div>
            <label style={labelStyle}>표지 (비우면 본문 첫 이미지)</label>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange}
                style={{ display: 'none' }} />
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ ...inputStyle, cursor: 'pointer', background: 'var(--bg-card)',
                  padding: '6px 12px', whiteSpace: 'nowrap',
                  color: uploading ? 'var(--text-muted)' : 'var(--text-sub)' }}>
                {uploading ? '업로드 중...' : thumbnailPreview ? '이미지 변경' : '이미지 선택'}
              </button>
              {thumbnailPreview && (
                <img src={thumbnailPreview} alt="썸네일"
                  style={{ width: '40px', height: '40px', objectFit: 'cover',
                    borderRadius: '6px', border: '1px solid var(--border)' }} />
              )}
            </div>
          </div>

        </div>
      )}

      {/* 분할 화면 */}
      <div className="write-split">

        {/* 모바일 미리보기 */}
        <div className="hidden md:flex"
          style={{ width: '260px', flexShrink: 0, background: 'var(--bg)',
            borderRight: '1px solid var(--border)', padding: '16px 12px',
            flexDirection: 'column', alignItems: 'center', gap: '10px', overflowY: 'auto' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase' }}>모바일 미리보기</p>
          <div style={{ width: '210px', border: '8px solid #1f1f1f', borderRadius: '28px',
            overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', background: '#fff' }}>
            <div style={{ height: '22px', background: '#1f1f1f', display: 'flex',
              justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '7px', background: '#111111', borderRadius: '4px' }} />
            </div>
            <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid #ececea', background: '#ffffff' }}>
              <div style={{ fontWeight: 800, fontSize: '11px', color: '#1f1f1f' }}>적바림</div>
            </div>
            <div style={{ height: '460px', overflowY: 'auto', background: '#ffffff' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>

        {/* 에디터 */}
        <div className="write-main">
          <input value={title} onChange={e => onTitle(e.target.value)}
            placeholder="제목"
            style={{ fontSize: '1.5rem', fontWeight: 800, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--text-main)', letterSpacing: '-0.02em',
              marginBottom: '16px', width: '100%',
              borderBottom: '2px solid var(--border-soft)', paddingBottom: '12px' }} />
          <div className="write-editor">
            <RichEditor key={editorKey} content={content} onChange={onContent} highlightWord={highlightWord} />
          </div>
        </div>

        {/* 사서 제안 패널 */}
        {showReview && (
          <div className="write-review">
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#7c5c9a' }}>📖 사서 제안</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  맞춤법 교정 + 사서의 총평
                </p>
              </div>
              <button onClick={() => setShowReview(false)}
                style={{ color: 'var(--text-muted)', fontSize: '1rem' }}
                className="hover:opacity-60 transition">✕</button>
            </div>

            <div style={{ padding: '16px 18px', flex: 1 }}>
              {reviewing && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '12px', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '1.8rem' }}>📚</span>
                  <p style={{ fontSize: '0.82rem' }}>사서가 글을 읽고 있어요...</p>
                </div>
              )}

              {!reviewing && reviewData && (
                <>
                  {/* 맞춤법 */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c5c9a',
                      marginBottom: '10px', letterSpacing: '0.05em' }}>맞춤법 교정</h4>
                    {reviewData.spelling.length === 0 ? (
                      <div style={{ background: '#f0faf0', border: '1px solid #b8e0c0',
                        borderRadius: '8px', padding: '10px 14px',
                        fontSize: '0.82rem', color: '#4a7c59' }}>
                        ✓ 맞춤법 오류가 없습니다!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {reviewData.spelling.map((item, i) => (
                          <div key={i}
                            onClick={() => setHighlightWord(item.original)}
                            style={{ background: '#fff', border: '1px solid #e8d5f0',
                              borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem',
                              cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(124,92,154,0.18)')}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span style={{ color: '#e04040', textDecoration: 'line-through' }}>{item.original}</span>
                              <span style={{ color: 'var(--text-muted)' }}>→</span>
                              <span style={{ color: '#4a7c59', fontWeight: 600 }}>{item.suggestion}</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{item.reason}</p>
                            <p style={{ color: '#c4a8e0', fontSize: '0.68rem', marginTop: '4px' }}>클릭하면 에디터에서 위치 이동 →</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 제목 추천 */}
                  {reviewData.titleSuggestions?.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c5c9a',
                        marginBottom: '10px', letterSpacing: '0.05em' }}>제목 추천</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {reviewData.titleSuggestions.map((t, i) => (
                          <div key={i}
                            onClick={() => onTitle(t)}
                            style={{ background: '#fff', border: '1px solid #e8d5f0',
                              borderRadius: '8px', padding: '9px 12px', fontSize: '0.82rem',
                              color: 'var(--text-main)', cursor: 'pointer', display: 'flex',
                              alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f5effe')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                            <span>{t}</span>
                            <span style={{ fontSize: '0.68rem', color: '#c4a8e0', whiteSpace: 'nowrap' }}>클릭해서 적용</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 사서의 총평 */}
                  <div>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c5c9a',
                      marginBottom: '10px', letterSpacing: '0.05em' }}>사서의 총평</h4>
                    <div style={{ background: '#fff', border: '1px solid #e8d5f0',
                      borderRadius: '10px', padding: '14px 16px',
                      fontSize: '0.83rem', color: 'var(--text-main)', lineHeight: 1.8,
                      whiteSpace: 'pre-wrap' }}>
                      {reviewData.review}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)',
  fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
}

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: '7px', padding: '6px 10px',
  fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--bg-card)', outline: 'none',
}
