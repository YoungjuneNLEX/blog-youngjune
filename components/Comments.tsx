'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Image from 'next/image'

interface Comment {
  id: string
  post_id: string
  author_id: string | null
  author_name: string | null
  author_avatar: string | null
  content: string
  created_at: string
}

export default function Comments({ postId }: { postId: string }) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const myId = session?.user?.id
  const isAdmin = session?.user?.role === 'admin'

  async function load() {
    const res = await fetch(`/api/comments?post_id=${postId}`)
    const data = await res.json()
    setComments(data.comments || [])
    setLoaded(true)
  }

  useEffect(() => { load() }, [postId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setSubmitting(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, content }),
    })
    setSubmitting(false)
    if (res.ok) {
      const newComment = await res.json()
      setComments(c => [...c, newComment])
      setText('')
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.error || '댓글 등록에 실패했습니다.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('댓글을 삭제할까요?')) return
    const res = await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setComments(c => c.filter(x => x.id !== id))
  }

  return (
    <section style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
      <h2 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700,
        marginBottom: '1.25rem' }}>
        댓글 {loaded && comments.length > 0 && (
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{comments.length}</span>
        )}
      </h2>

      {/* 작성 폼 */}
      {session ? (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            {session.user?.image && (
              <Image src={session.user.image} alt="" width={36} height={36}
                className="rounded-full" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="따뜻한 댓글을 남겨주세요."
                rows={3}
                style={{ width: '100%', resize: 'vertical', padding: '10px 12px',
                  fontSize: '0.9rem', lineHeight: 1.6, borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'var(--bg-card)',
                  color: 'var(--text-main)', outline: 'none', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" disabled={submitting || !text.trim()}
                  style={{ fontSize: '0.85rem', fontWeight: 600, background: 'var(--accent)',
                    color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px',
                    cursor: submitting || !text.trim() ? 'not-allowed' : 'pointer',
                    opacity: submitting || !text.trim() ? 0.5 : 1 }}>
                  {submitting ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div style={{ marginBottom: '2rem', padding: '1.25rem', borderRadius: '12px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-sub)', fontSize: '0.88rem' }}>
            로그인하고 댓글을 남겨보세요.
          </span>
          <button onClick={() => signIn('google')}
            style={{ fontSize: '0.83rem', fontWeight: 600, background: 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: '999px', padding: '8px 18px', cursor: 'pointer' }}>
            로그인
          </button>
        </div>
      )}

      {/* 목록 */}
      {!loaded ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>댓글을 불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem 0' }}>
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
        </p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', listStyle: 'none', padding: 0 }}>
          {comments.map(c => (
            <li key={c.id} style={{ display: 'flex', gap: '10px' }}>
              {c.author_avatar ? (
                <Image src={c.author_avatar} alt="" width={36} height={36}
                  className="rounded-full" style={{ flexShrink: 0, height: '36px' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--border-soft)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {(c.author_name || '?').charAt(0)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {c.author_name || '익명'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(c.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {(isAdmin || (myId && myId === c.author_id)) && (
                    <button onClick={() => handleDelete(c.id)}
                      style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'none',
                        border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                      className="hover:opacity-70 transition">삭제</button>
                  )}
                </div>
                <p style={{ marginTop: '4px', fontSize: '0.9rem', lineHeight: 1.7,
                  color: 'var(--text-sub)', whiteSpace: 'pre-wrap' }}>{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
