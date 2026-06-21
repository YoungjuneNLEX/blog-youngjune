'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'

interface ManagePost {
  id: string
  title: string
  category: string | null
  visibility: 'public' | 'members'
  published: boolean
  created_at: string
  tags: string[] | null
  author?: { name: string | null } | null
}

const UNFILED = '미분류'

export default function ManageClient({ posts, isAdmin }: { posts: ManagePost[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('전체')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // 존재하는 카테고리 목록
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of posts) if (p.category) set.add(p.category)
    return ['전체', ...Array.from(set)]
  }, [posts])

  // 검색 + 카테고리 필터
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return posts.filter(p => {
      if (category !== '전체' && p.category !== category) return false
      if (!q) return true
      const haystack = [
        p.title,
        p.category || '',
        ...(p.tags || []),
        p.author?.name || '',
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [posts, search, category])

  // 책 제목(tags[0]) 기준 폴더 그룹핑
  const groups = useMemo(() => {
    const map = new Map<string, ManagePost[]>()
    for (const p of filtered) {
      const book = p.tags?.[0] || UNFILED
      if (!map.has(book)) map.set(book, [])
      map.get(book)!.push(p)
    }
    // 각 폴더 내 최신순 정렬
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
    // 폴더는 가장 최근 글이 있는 순서대로
    return Array.from(map.entries()).sort((a, b) => {
      const la = Math.max(...a[1].map(p => new Date(p.created_at).getTime()))
      const lb = Math.max(...b[1].map(p => new Date(p.created_at).getTime()))
      return lb - la
    })
  }, [filtered])

  function toggle(book: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(book)) next.delete(book)
      else next.add(book)
      return next
    })
  }

  return (
    <div>
      {/* 검색 + 카테고리 필터 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="제목·책·태그·작성자 검색"
            style={{ width: '100%', padding: '10px 12px 10px 36px', fontSize: '0.9rem',
              border: '1px solid var(--border)', borderRadius: '10px',
              background: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }} />
        </div>

        <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {categories.map(c => {
            const active = c === category
            return (
              <button key={c} onClick={() => setCategory(c)}
                style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 600,
                  padding: '6px 14px', borderRadius: '999px', cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: active ? 'var(--accent)' : 'var(--bg-card)',
                  color: active ? '#fff' : 'var(--text-sub)' }}>
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* 결과 수 */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        총 {filtered.length}편 · {groups.length}개 책
      </p>

      {/* 폴더(책)별 목록 */}
      {groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)',
          background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)' }}>
          {posts.length === 0 ? '글이 없습니다.' : '검색 결과가 없습니다.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {groups.map(([book, items]) => {
            const isCollapsed = collapsed.has(book)
            return (
              <div key={book} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '14px', overflow: 'hidden' }}>
                {/* 폴더 헤더 */}
                <button onClick={() => toggle(book)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 16px', background: 'var(--bg)', cursor: 'pointer',
                    border: 'none', borderBottom: isCollapsed ? 'none' : '1px solid var(--border-soft)',
                    textAlign: 'left' }}>
                  <span style={{ fontSize: '1.1rem' }}>{isCollapsed ? '📁' : '📂'}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)',
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {book}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{items.length}편</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
                </button>

                {/* 폴더 내 글 목록 */}
                {!isCollapsed && (
                  <div>
                    {items.map(post => (
                      <div key={post.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                          padding: '12px 16px', borderTop: '1px solid var(--border-soft)' }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <Link href={`/posts/${post.id}`}
                            style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}
                            className="hover:underline">
                            {post.title}
                          </Link>
                          {isAdmin && post.author?.name && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                              by {post.author.name}
                            </span>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px',
                            flexWrap: 'wrap', marginTop: '5px' }}>
                            {post.category && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--accent)',
                                background: 'var(--border-soft)', padding: '1px 8px', borderRadius: '999px' }}>
                                {post.category}
                              </span>
                            )}
                            <span style={{ fontSize: '0.68rem', padding: '1px 8px', borderRadius: '999px',
                              background: post.visibility === 'public' ? '#e6f4ea' : '#fdf0d5',
                              color: post.visibility === 'public' ? '#3f7d54' : '#9a6a1a' }}>
                              {post.visibility === 'public' ? '모두' : '회원'}
                            </span>
                            <span style={{ fontSize: '0.68rem', padding: '1px 8px', borderRadius: '999px',
                              background: post.published ? '#e3edf7' : 'var(--border-soft)',
                              color: post.published ? '#3a6a9a' : 'var(--text-muted)' }}>
                              {post.published ? '발행' : '초안'}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {new Date(post.created_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Link href={`/write/${post.id}`}
                            style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}
                            className="hover:opacity-70 transition">수정</Link>
                          <DeleteButton postId={post.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
