'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false })
import BookTitleInput from '@/components/BookTitleInput'

const CATEGORIES = ['에세이', '소설', '인문교양', '일상', '여행', '기타']

export default function EditPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [loaded, setLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [bookTitle, setBookTitle] = useState('')
  const [tags, setTags] = useState('')
  const [category, setCategory] = useState('에세이')
  const [visibility, setVisibility] = useState<'public' | 'members'>('public')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [isBookCover, setIsBookCover] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
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

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => r.json())
      .then(post => {
        setTitle(post.title || '')
        setCategory(post.category || '에세이')
        setVisibility(post.visibility || 'public')
        setThumbnailUrl(post.thumbnail_url || '')
        setThumbnailPreview(post.thumbnail_url || '')
        setExcerpt(post.excerpt || '')
        setContent(post.content || '')
        if (post.scheduled_at) setScheduledAt(post.scheduled_at.slice(0, 16))
        const allTags: string[] = post.tags || []
        setBookTitle(allTags[0] || '')
        setTags(allTags.slice(1).join(', '))
        setLoaded(true)
      })
  }, [id])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setThumbnailPreview(URL.createObjectURL(file))
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (res.ok) {
      const { url } = await res.json()
      setThumbnailUrl(url)
    } else {
      alert('이미지 업로드에 실패했습니다.')
      setThumbnailPreview(thumbnailUrl)
    }
    setUploading(false)
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

  async function handleSave(publish: boolean) {
    if (!title.trim()) { alert('제목을 입력해주세요.'); return }
    if (!bookTitle.trim()) { alert('책 제목을 입력해주세요.'); return }
    setSaving(true); setStatus('')

    const extraTags = tags.split(',').map(t => t.trim()).filter(Boolean)
    const allTags = [bookTitle, ...extraTags]

    const body: any = {
      title, content, category, visibility, excerpt,
      tags: allTags,
      thumbnail_url: thumbnailUrl || null,
      published: publish,
    }
    if (scheduledAt) body.scheduled_at = scheduledAt

    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      if (isBookCover && thumbnailUrl) {
        await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: bookTitle, cover_url: thumbnailUrl, genre: category }),
        })
      }
      setStatus(publish ? '발행 완료!' : '저장 완료!')
      setTimeout(() => router.push('/manage'), 800)
    } else {
      setStatus('오류가 발생했습니다.')
    }
    setSaving(false)
  }

  const previewHtml = `
    <div style="padding:1rem;font-size:14px;line-height:2;color:#2c1a0e;font-family:'Apple SD Gothic Neo',sans-serif;">
      ${thumbnailPreview ? `<img src="${thumbnailPreview}" style="width:100%;border-radius:8px;margin-bottom:1rem;object-fit:cover;max-height:160px;" />` : ''}
      ${category ? `<span style="font-size:11px;background:#f5ebe0;color:#8b5e3c;padding:2px 8px;border-radius:999px;font-weight:600;">${category}</span>` : ''}
      <h1 style="font-size:18px;font-weight:800;margin:0.75rem 0 0.25rem;line-height:1.3;">${title || '제목을 입력하세요'}</h1>
      ${bookTitle ? `<p style="font-size:11px;color:#b09880;margin-bottom:1rem;">${bookTitle}</p>` : ''}
      <div style="font-size:14px;line-height:2;color:#2c1a0e;">${content || '<p style="color:#b09880;">본문이 여기에 표시됩니다...</p>'}</div>
    </div>
  `

  if (!loaded) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 'calc(100vh - 64px)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
      글을 불러오는 중...
    </div>
  )

  return (
    <div className="write-shell">

      {/* 상단 툴바 */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}
            className="hover:opacity-70 transition">← 뒤로</button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <button onClick={() => setShowMeta(v => !v)}
            style={{ color: 'var(--text-sub)', fontSize: '0.82rem',
              border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px',
              background: showMeta ? 'var(--bg)' : 'transparent' }}
            className="hover:opacity-80 transition">
            글 설정 {showMeta ? '▲' : '▼'}
          </button>
          <button onClick={handleReview}
            style={{ color: '#7c5c9a', fontSize: '0.82rem',
              border: '1px solid #c4a8e0', borderRadius: '6px', padding: '4px 10px',
              background: showReview ? '#f5effe' : 'transparent' }}
            className="hover:opacity-80 transition">
            📖 사서 제안
          </button>
          {status && <span style={{ color: status.includes('오류') ? '#e04040' : '#4a7c59', fontSize: '0.82rem' }}>{status}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave(false)} disabled={saving}
            style={{ fontSize: '0.82rem', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '7px 14px', background: 'var(--bg)',
              color: 'var(--text-sub)', cursor: 'pointer' }}
            className="hover:opacity-80 disabled:opacity-50 transition">임시저장</button>
          <button onClick={() => handleSave(true)} disabled={saving}
            style={{ fontSize: '0.82rem', background: 'var(--accent)', color: '#fff',
              borderRadius: '8px', padding: '7px 18px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            className="hover:opacity-80 disabled:opacity-50 transition">
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>

      {/* 글 설정 패널 */}
      {showMeta && (
        <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)',
          padding: '14px 20px', flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: '16px',
          alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>책 제목 *</label>
            <BookTitleInput value={bookTitle} onChange={setBookTitle} />
          </div>
          <div>
            <label style={labelStyle}>카테고리</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>태그 (쉼표 구분)</label>
            <input value={tags} onChange={e => setTags(e.target.value)}
              placeholder="예: 커피, 일상, 카페" style={{ ...inputStyle, width: '260px' }} />
          </div>
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
          <div>
            <label style={labelStyle}>썸네일</label>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
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
            {thumbnailPreview && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px',
                fontSize: '0.78rem', color: 'var(--text-sub)', cursor: 'pointer' }}>
                <input type="checkbox" checked={isBookCover} onChange={e => setIsBookCover(e.target.checked)} />
                책 대표 이미지(표지)로 설정
              </label>
            )}
          </div>
          <div>
            <label style={labelStyle}>책 소개 문구</label>
            <input value={excerpt} onChange={e => setExcerpt(e.target.value)}
              placeholder="책 소개 문구..." style={{ ...inputStyle, width: '220px' }} />
          </div>
          <div>
            <label style={labelStyle}>예약 발행 (선택)</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
              style={inputStyle} />
          </div>
        </div>
      )}

      {/* 분할 화면 */}
      <div className="write-split">
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

        <div className="write-main">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="소제목 (포스팅 제목)"
            style={{ fontSize: '1.5rem', fontWeight: 800, border: 'none', outline: 'none',
              background: 'transparent', color: 'var(--text-main)', letterSpacing: '-0.02em',
              marginBottom: '16px', width: '100%',
              borderBottom: '2px solid var(--border-soft)', paddingBottom: '12px' }} />
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
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c5c9a',
                      marginBottom: '10px', letterSpacing: '0.05em' }}>맞춤법 교정</h4>
                    {reviewData.spelling.length === 0 ? (
                      <div style={{ background: '#f0faf0', border: '1px solid #b8e0c0',
                        borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#4a7c59' }}>
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
                            onClick={() => setTitle(t)}
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

                  {/* 태그 추천 */}
                  {reviewData.tagSuggestions?.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c5c9a',
                        marginBottom: '10px', letterSpacing: '0.05em' }}>태그 추천</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {reviewData.tagSuggestions.map((tag, i) => (
                          <button key={i}
                            onClick={() => setTags(prev => {
                              const existing = prev.split(',').map(t => t.trim()).filter(Boolean)
                              if (existing.includes(tag)) return prev
                              return [...existing, tag].join(', ')
                            })}
                            style={{ fontSize: '0.75rem', padding: '4px 10px',
                              borderRadius: '999px', border: '1px solid #c4a8e0',
                              background: '#fff', color: '#7c5c9a', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f5effe')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                            + {tag}
                          </button>
                        ))}
                      </div>
                      <p style={{ color: '#c4a8e0', fontSize: '0.68rem', marginTop: '6px' }}>클릭하면 태그에 추가돼요</p>
                    </div>
                  )}

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
