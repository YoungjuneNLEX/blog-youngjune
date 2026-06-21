'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Book {
  title: string
  cover_url: string | null
  genre: string | null
  description: string | null
  postCount: number
}

interface Post {
  id: string
  title: string
  created_at: string
  thumbnail_url: string | null
  excerpt: string | null
  content: string | null
}

export default function BookShelf({ books, postsByBook, title = '책장' }: {
  books: Book[]
  postsByBook: Record<string, Post[]>
  title?: string
}) {
  const [selected, setSelected] = useState<Book | null>(null)
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')

  const modalPosts = selected
    ? [...(postsByBook[selected.title] || [])].sort((a, b) =>
        order === 'desc'
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    : []

  return (
    <section>
      <h2 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700,
        letterSpacing: '-0.01em', marginBottom: '1.25rem' }}>
        {title}
      </h2>

      {books.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>아직 책이 없습니다.</p>
      ) : (
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {books.map(book => (
            <button key={book.title} onClick={() => setSelected(book)}
              className="text-left group">
              {/* 책 표지 */}
              <div className="book-card" style={{ aspectRatio: '3/4', borderRadius: '8px',
                overflow: 'hidden', background: 'var(--border-soft)',
                border: '1px solid var(--border)', position: 'relative',
                boxShadow: '2px 6px 16px rgba(44,26,14,0.12)', marginBottom: '12px' }}>
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3"
                    style={{ background: 'linear-gradient(135deg, #e8d5bc, #d4b896)' }}>
                    <span style={{ fontSize: '1.8rem' }}>📚</span>
                    <span style={{ color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700,
                      textAlign: 'center', lineHeight: 1.3 }}>{book.title}</span>
                  </div>
                )}
                {/* 광택 효과 */}
                <div className="book-shine absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)' }} />
              </div>
              <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem',
                lineHeight: 1.3 }} className="line-clamp-2">{book.title}</p>
              {book.genre && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                  {book.genre}
                </p>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>글 {book.postCount}편</p>
            </button>
          ))}
        </div>
      )}

      {/* 책 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(44,26,14,0.5)' }}
          onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', borderRadius: '20px', width: '100%',
              maxWidth: '640px', maxHeight: '85vh', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(44,26,14,0.25)' }}>

            {/* 책 정보 */}
            <div className="flex gap-5 p-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '90px', flexShrink: 0, aspectRatio: '3/4', borderRadius: '8px',
                overflow: 'hidden', background: 'var(--border-soft)',
                boxShadow: '2px 4px 10px rgba(44,26,14,0.15)' }}>
                {selected.cover_url ? (
                  <img src={selected.cover_url} alt={selected.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #e8d5bc, #d4b896)', fontSize: '1.5rem' }}>
                    📚
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '1.1rem',
                  lineHeight: 1.3, marginBottom: '6px' }}>{selected.title}</h3>
                {selected.genre && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent)', background: '#f5ebe0',
                    padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                    {selected.genre}
                  </span>
                )}
                {selected.description && (
                  <p style={{ color: 'var(--text-sub)', fontSize: '0.83rem', lineHeight: 1.6,
                    marginTop: '10px' }}>{selected.description}</p>
                )}
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>
                  글 {selected.postCount}편
                </p>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ color: 'var(--text-muted)', fontSize: '1.2rem', flexShrink: 0,
                  lineHeight: 1, alignSelf: 'flex-start' }}
                className="hover:opacity-60 transition">✕</button>
            </div>

            {/* 글 목록 */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              <div className="flex items-center justify-between px-6 py-3"
                style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>글 목록</span>
                <button onClick={() => setOrder(o => o === 'desc' ? 'asc' : 'desc')}
                  style={{ color: 'var(--text-sub)', fontSize: '0.75rem',
                    border: '1px solid var(--border)', borderRadius: '6px',
                    padding: '3px 10px', background: 'var(--bg)' }}
                  className="hover:opacity-70 transition">
                  {order === 'desc' ? '최신순' : '오래된순'}
                </button>
              </div>

              <div className="p-4 flex flex-col gap-3">
                {modalPosts.map(post => (
                  <Link key={post.id} href={`/posts/${post.id}`}
                    onClick={() => setSelected(null)}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border-soft)',
                      borderRadius: '10px', overflow: 'hidden' }}
                    className="flex gap-3 hover:shadow-sm transition-shadow">
                    {post.thumbnail_url && (
                      <div style={{ width: '72px', flexShrink: 0, height: '72px' }}>
                        <img src={post.thumbnail_url} alt={post.title}
                          className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-3 flex-1 min-w-0">
                      <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.875rem',
                        lineHeight: 1.3 }} className="line-clamp-2">{post.title}</p>
                      {(post.excerpt || post.content) && (
                        <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem', marginTop: '4px',
                          lineHeight: 1.5 }} className="line-clamp-2">
                          {post.excerpt || post.content?.slice(0, 60)}
                        </p>
                      )}
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '6px' }}>
                        {new Date(post.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
