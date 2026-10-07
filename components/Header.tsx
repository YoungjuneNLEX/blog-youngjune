'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import CategoryPanel from '@/components/CategoryPanel'
import { SEAL_RED, Topic } from '@/lib/site-config'
import { topicFromSlug } from '@/lib/cover'

/**
 * 사이트 머리글. 제호가 홈 링크다.
 *   PC     : 방문자 주제 ▾ · 소개 / 관리자는 거기에 글쓰기 · 글관리
 *   모바일 : 제호만. 갈 곳은 아래 고정 메뉴에 모두 있다. (햄버거 메뉴는 없다)
 */
export default function Header({ siteName, topics }: { siteName: string; topics: Topic[] }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = session?.user?.role === 'admin'
  const [cats, setCats] = useState(false)

  // 쓰는 공간은 자체 머리글을 쓴다
  if (pathname?.startsWith('/notes') || pathname?.startsWith('/write')) return null

  const current = pathname?.startsWith('/topics/')
    ? topicFromSlug(pathname.split('/')[2] || '')
    : pathname === '/' ? null : ''

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-header)' }}>
      <div className="wrap"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          minHeight: '56px', paddingTop: '6px', paddingBottom: '6px' }}>
        <Link href="/" className="wordmark">
          {siteName}
          {/* 인주색 점 — 시안에서 색을 쓰는 유일한 자리 */}
          <span aria-hidden className="seal" style={{ background: SEAL_RED }} />
        </Link>

        {/* PC 만. 주제는 카테고리 화면을 연다. */}
        <nav className="only-pc" style={{ gap: '24px', fontSize: '15px', alignItems: 'center' }}>
          <button onClick={() => setCats(true)} aria-haspopup="dialog"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none',
              border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px',
              color: current ? 'var(--accent)' : 'var(--text-main)' }}>
            {current || '주제'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <Link href="/about"
            style={pathname?.startsWith('/about') ? { color: 'var(--accent)' } : { color: 'var(--text-sub)' }}>
            소개
          </Link>
          {isAdmin && (
            <>
              <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
              <Link href="/write" style={{ color: 'var(--text-sub)' }}>글쓰기</Link>
              <Link href="/notes" style={{ color: 'var(--text-sub)' }}>글관리</Link>
            </>
          )}
        </nav>
      </div>

      {cats && (
        <CategoryPanel topics={topics} current={current} onClose={() => setCats(false)} />
      )}
    </header>
  )
}
