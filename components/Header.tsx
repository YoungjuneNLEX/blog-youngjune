'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import CategoryPanel from '@/components/CategoryPanel'
import { SEAL_RED, Topic } from '@/lib/site-config'
import { topicFromSlug } from '@/lib/cover'

/** 관리자에게만 보이는 네 곳 */
const ADMIN_LINKS = [
  { href: '/memo', label: '적바림' },
  { href: '/notes', label: '노트 창고' },
  { href: '/write', label: '글쓰기' },
  { href: '/admin/settings', label: '설정' },
]

export default function Header({
  siteName, topics, showBookshelf,
}: { siteName: string; topics: Topic[]; showBookshelf: boolean }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = session?.user?.role === 'admin'
  const [open, setOpen] = useState(false)
  const [cats, setCats] = useState(false)

  // 쓰는 공간은 자체 머리글을 쓴다
  if (pathname?.startsWith('/memo') || pathname?.startsWith('/notes')) return null

  const onArchive = pathname === '/archive'
  const current = pathname?.startsWith('/topics/')
    ? topicFromSlug(pathname.split('/')[2] || '')
    : null

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

        {/* PC: 전체 / 주제 ▾ / 책장 / 소개 (주제는 카테고리 화면을 연다) */}
        <nav className="only-pc" style={{ gap: '24px', fontSize: '15px', alignItems: 'center' }}>
          <Link href="/archive" style={onArchive ? { color: 'var(--accent)' } : undefined}>전체</Link>
          <button onClick={() => setCats(true)} aria-haspopup="dialog"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none',
              border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '15px',
              color: current ? 'var(--accent)' : 'var(--text-main)' }}>
            {current || '주제'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {showBookshelf && (
            <Link href="/bookshelf"
              style={pathname?.startsWith('/bookshelf') ? { color: 'var(--accent)' } : undefined}>책장</Link>
          )}
          <Link href="/about" style={{ color: 'var(--text-sub)' }}>소개</Link>
          {isAdmin && (
            <>
              <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
              {ADMIN_LINKS.map(l => (
                <Link key={l.href} href={l.href} style={{ color: 'var(--text-sub)' }}>{l.label}</Link>
              ))}
              <button onClick={() => signOut()} className="meta-sub"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>로그아웃</button>
            </>
          )}
        </nav>

        {/* 모바일: 메뉴 하나. 주제·책장은 아래 고정 메뉴로도 간다. */}
        <div className="only-mobile" style={{ position: 'relative', alignItems: 'center' }}>
          <button onClick={() => setOpen(v => !v)} aria-label="메뉴" aria-expanded={open}
            className="icon-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          {open && (
            <>
              <div className="fixed inset-0" style={{ zIndex: 40 }} onClick={() => setOpen(false)} />
              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, minWidth: '12rem',
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
                overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <MenuLink href="/archive" onClick={() => setOpen(false)}>전체</MenuLink>
                {showBookshelf && <MenuLink href="/bookshelf" onClick={() => setOpen(false)}>책장</MenuLink>}
                <MenuLink href="/about" onClick={() => setOpen(false)}>소개</MenuLink>
                {isAdmin && ADMIN_LINKS.map(l => (
                  <MenuLink key={l.href} href={l.href} onClick={() => setOpen(false)} sub>{l.label}</MenuLink>
                ))}
                {isAdmin && (
                  <button onClick={() => { setOpen(false); signOut() }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px',
                      fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-sub)', fontFamily: 'inherit' }}>로그아웃</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {cats && (
        <CategoryPanel topics={topics} current={current} onClose={() => setCats(false)} />
      )}
    </header>
  )
}

function MenuLink({
  href, onClick, children, sub = false,
}: { href: string; onClick: () => void; children: React.ReactNode; sub?: boolean }) {
  return (
    <Link href={href} onClick={onClick}
      style={{ display: 'block', padding: '12px 16px', fontSize: '15px',
        borderBottom: '1px solid var(--border-soft)',
        color: sub ? 'var(--text-sub)' : 'var(--text-main)' }}>
      {children}
    </Link>
  )
}
