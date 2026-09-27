'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Topic } from '@/lib/site-config'
import { topicSlug } from '@/lib/cover'

/** 관리자에게만 보이는 네 곳 */
const ADMIN_LINKS = [
  { href: '/memo', label: '적바림' },
  { href: '/notes', label: '노트 창고' },
  { href: '/write', label: '글쓰기' },
  { href: '/admin/settings', label: '설정' },
]

export default function Header({ siteName, topics }: { siteName: string; topics: Topic[] }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = session?.user?.role === 'admin'
  const [open, setOpen] = useState(false)

  // 쓰는 공간은 자체 머리글을 쓴다
  if (pathname?.startsWith('/memo') || pathname?.startsWith('/notes')) return null

  const onArchive = pathname === '/archive'
  const current = pathname?.startsWith('/topics/')
    ? decodeURIComponent(pathname.split('/')[2] || '')
    : null

  return (
    <header style={{ borderBottom: '1px solid var(--border)' }}>
      {/* 제호 + 메뉴 */}
      <div className="wrap"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '16px', paddingBottom: '12px' }}>
        <Link href="/" className="wordmark">{siteName}</Link>

        {/* PC: 주제를 그대로 펼친다 */}
        <nav className="only-pc" style={{ gap: '28px', fontSize: '15px', alignItems: 'center' }}>
          <Link href="/archive" style={onArchive ? { color: 'var(--accent)' } : undefined}>전체</Link>
          {topics.map(t => (
            <Link key={t.name} href={`/topics/${topicSlug(t.name)}`}
              style={current === t.name ? { color: 'var(--accent)' } : undefined}>
              {t.short}
            </Link>
          ))}
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

        {/* 모바일: 소개(사람 아이콘) + 관리자면 쓰기 메뉴 */}
        <div className="only-mobile" style={{ position: 'relative', alignItems: 'center' }}>
          {isAdmin && (
            <button onClick={() => setOpen(v => !v)} aria-label="쓰는 공간" aria-expanded={open}
              className="icon-btn">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M4 20h4l10-10-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" />
              </svg>
            </button>
          )}
          <Link href="/about" aria-label="소개" className="icon-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
            </svg>
          </Link>

          {open && isAdmin && (
            <>
              <div className="fixed inset-0" style={{ zIndex: 40 }} onClick={() => setOpen(false)} />
              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, minWidth: '11rem',
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px',
                overflow: 'hidden', boxShadow: '0 8px 24px rgba(44,26,14,0.15)' }}>
                {ADMIN_LINKS.map(l => (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                    style={{ display: 'block', padding: '12px 16px', fontSize: '15px',
                      borderBottom: '1px solid var(--border-soft)' }}>{l.label}</Link>
                ))}
                <button onClick={() => { setOpen(false); signOut() }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px',
                    fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-sub)', fontFamily: 'inherit' }}>로그아웃</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 모바일: 주제 칩 */}
      <nav aria-label="주제" className="only-mobile wrap bleed no-scrollbar chip-row"
        style={{ paddingBottom: '12px' }}>
        <Link href="/archive" className={`chip${onArchive ? ' chip-on' : ''}`}>전체</Link>
        {topics.map(t => (
          <Link key={t.name} href={`/topics/${topicSlug(t.name)}`}
            className={`chip${current === t.name ? ' chip-on' : ''}`}>
            {t.short}
          </Link>
        ))}
      </nav>
    </header>
  )
}
