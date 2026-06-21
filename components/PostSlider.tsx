'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Post } from '@/lib/types'

export default function PostSlider({ posts, title = '최신 글' }: { posts: Post[]; title?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!ref.current) return
    const card = ref.current.querySelector<HTMLElement>('.slider-card')
    const amount = card ? card.offsetWidth + 16 : 320
    ref.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  if (!posts.length) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')}
            style={{ border: '1px solid var(--border)', color: 'var(--text-sub)', background: 'var(--bg-card)' }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition text-sm">
            ←
          </button>
          <button onClick={() => scroll('right')}
            style={{ border: '1px solid var(--border)', color: 'var(--text-sub)', background: 'var(--bg-card)' }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-70 transition text-sm">
            →
          </button>
        </div>
      </div>

      <div ref={ref}
        className="flex gap-4 overflow-x-auto pb-3 no-scrollbar"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
        {posts.map(post => (
          <div key={post.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: '14px',
              scrollSnapAlign: 'start', flexShrink: 0
            }}
            className="slider-card overflow-hidden hover:shadow-md transition-shadow">

            {/* 썸네일 */}
            <div style={{ height: '160px', background: 'var(--border-soft)', overflow: 'hidden' }}>
              {post.thumbnail_url ? (
                <img src={post.thumbnail_url} alt={post.title}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ color: 'var(--text-muted)', fontSize: '2rem' }}>📖</div>
              )}
            </div>

            <div className="p-4">
              {post.category && (
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', background: '#f5ebe0',
                  padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                  {post.category}
                </span>
              )}
              <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem',
                lineHeight: 1.4, margin: '8px 0 6px' }}
                className="line-clamp-2">{post.title}</h3>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', lineHeight: 1.6 }}
                className="line-clamp-2">
                {post.excerpt || post.content?.replace(/<[^>]*>/g, '').slice(0, 80) || ''}
              </p>
              <div className="flex items-center justify-between mt-4">
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  {new Date(post.created_at).toLocaleDateString('ko-KR')}
                </span>
                <Link href={`/posts/${post.id}`}
                  style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600 }}
                  className="hover:opacity-70 transition">
                  더보기 →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
