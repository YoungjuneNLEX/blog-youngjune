'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false })

export default function AboutPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [reviewData, setReviewData] = useState<{
    spelling: {original:string,suggestion:string,reason:string}[]
    titleSuggestions: string[]
    tagSuggestions: string[]
    review: string
  } | null>(null)
  const [highlightWord, setHighlightWord] = useState<string | undefined>(undefined)

  async function handleReview() {
    if (!content.trim()) { alert('본문을 먼저 작성해주세요.'); return }
    setReviewing(true)
    setShowReview(true)
    setReviewData(null)
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '소개', content }),
    })
    const data = await res.json()
    setReviewData(data)
    setReviewing(false)
  }

  useEffect(() => {
    fetch('/api/about')
      .then(r => r.json())
      .then(d => { setContent(d.content || ''); setLoaded(true) })
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/about', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const previewHtml = `
    <div style="padding:1rem;font-size:14px;line-height:2;color:#2c1a0e;font-family:'Apple SD Gothic Neo',sans-serif;">
      <h2 style="font-size:16px;font-weight:800;margin-bottom:1rem;">소개</h2>
      <div style="font-size:13px;line-height:2;color:#2c1a0e;">${content || '<p style="color:#b09880;">본문이 여기에 표시됩니다...</p>'}</div>
    </div>
  `

  // 수정 모드 — 글쓰기와 동일한 분할 UI
  if (editing) {
    return (
      <div className="write-shell">

        {/* 상단 툴바 */}
        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
          padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0 }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(false)}
              style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}
              className="hover:opacity-70 transition">← 뒤로</button>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ color: 'var(--text-sub)', fontSize: '0.82rem', fontWeight: 600 }}>소개 페이지 수정</span>
            <button onClick={handleReview}
              style={{ color: '#7c5c9a', fontSize: '0.82rem',
                border: '1px solid #c4a8e0', borderRadius: '6px', padding: '4px 10px',
                background: showReview ? '#f5effe' : 'transparent' }}
              className="hover:opacity-80 transition">
              📖 사서 제안
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)}
              style={{ fontSize: '0.82rem', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '7px 14px', background: 'var(--bg)',
                color: 'var(--text-sub)', cursor: 'pointer' }}
              className="hover:opacity-80 transition">취소</button>
            <button onClick={handleSave} disabled={saving}
              style={{ fontSize: '0.82rem', background: 'var(--accent)', color: '#fff',
                borderRadius: '8px', padding: '7px 18px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              className="hover:opacity-80 disabled:opacity-50 transition">
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>

        {/* 분할 화면 */}
        <div className="write-split">

          {/* 모바일 미리보기 */}
          <div className="hidden md:flex"
            style={{ width: '260px', flexShrink: 0, background: 'var(--bg)',
              borderRight: '1px solid var(--border)', padding: '16px 12px',
              flexDirection: 'column', alignItems: 'center', gap: '10px', overflowY: 'auto' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase' }}>모바일 미리보기</p>
            <div style={{ width: '210px', border: '8px solid #2c1a0e', borderRadius: '28px',
              overflow: 'hidden', boxShadow: '0 8px 32px rgba(44,26,14,0.2)', background: '#fff' }}>
              <div style={{ height: '22px', background: '#2c1a0e', display: 'flex',
                justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '7px', background: '#1a0e06', borderRadius: '4px' }} />
              </div>
              <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid #f0e8de', background: '#fffdf9' }}>
                <div style={{ fontWeight: 800, fontSize: '11px', color: '#2c1a0e' }}>1인 서점</div>
              </div>
              <div style={{ height: '460px', overflowY: 'auto', background: '#faf6f0' }}
                dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          </div>

          {/* 에디터 */}
          <div className="write-main">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)',
              letterSpacing: '-0.02em', marginBottom: '16px',
              borderBottom: '2px solid var(--border-soft)', paddingBottom: '12px' }}>
              소개
            </h2>
            <div className="write-editor">
              <RichEditor content={content} onChange={setContent} highlightWord={highlightWord} />
            </div>
          </div>

          {/* 사서 제안 패널 */}
          {showReview && (
            <div className="write-review">
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#7c5c9a' }}>📖 사서 제안</span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>맞춤법 교정 + 사서의 총평</p>
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
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c5c9a', marginBottom: '10px' }}>맞춤법 교정</h4>
                      {reviewData.spelling.length === 0 ? (
                        <div style={{ background: '#f0faf0', border: '1px solid #b8e0c0', borderRadius: '8px',
                          padding: '10px 14px', fontSize: '0.82rem', color: '#4a7c59' }}>
                          ✓ 맞춤법 오류가 없습니다!
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {reviewData.spelling.map((item, i) => (
                            <div key={i} onClick={() => setHighlightWord(item.original)}
                              style={{ background: '#fff', border: '1px solid #e8d5f0', borderRadius: '8px',
                                padding: '10px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
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
                    <div>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c5c9a', marginBottom: '10px' }}>사서의 총평</h4>
                      <div style={{ background: '#fff', border: '1px solid #e8d5f0', borderRadius: '10px',
                        padding: '14px 16px', fontSize: '0.83rem', color: 'var(--text-main)',
                        lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
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

  // 보기 모드
  return (
    <div className="article-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
          소개
        </h1>
        {isAdmin && (
          <button onClick={() => setEditing(true)}
            style={{ fontSize: '0.82rem', border: '1px solid var(--border)', borderRadius: '8px',
              padding: '7px 16px', background: 'var(--bg-card)', color: 'var(--text-sub)', cursor: 'pointer' }}
            className="hover:opacity-80 transition">
            ✏️ 수정
          </button>
        )}
      </div>

      {saved && (
        <div style={{ background: '#f0faf0', border: '1px solid #b8e0c0', borderRadius: '8px',
          padding: '10px 16px', marginBottom: '1.5rem', color: '#4a7c59', fontSize: '0.85rem' }}>
          ✓ 저장되었습니다.
        </div>
      )}

      {!loaded ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>불러오는 중...</p>
      ) : content ? (
        <div className="tiptap-view"
          style={{ color: 'var(--text-main)', lineHeight: 2.0, fontSize: '1.05rem' }}
          dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📖</p>
          <p style={{ fontSize: '0.9rem' }}>아직 소개글이 없습니다.</p>
          {isAdmin && (
            <button onClick={() => setEditing(true)}
              style={{ marginTop: '1rem', fontSize: '0.82rem', background: 'var(--accent)', color: '#fff',
                borderRadius: '8px', padding: '8px 20px', border: 'none', cursor: 'pointer' }}>
              소개글 작성하기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
