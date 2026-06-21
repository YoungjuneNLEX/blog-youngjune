'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const canWrite = role === 'admin' || role === 'writer'
  const [open, setOpen] = useState(false)

  const linkStyle = { color: 'var(--text-sub)', fontSize: '0.875rem' }

  return (
    <header style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-50 shadow-sm">
      <div className="px-4 sm:px-10 h-16 flex items-center justify-between gap-3">
        <Link href="/" onClick={() => setOpen(false)} className="flex flex-col leading-tight shrink-0">
          <span style={{ color: 'var(--accent)', fontSize: '0.65rem', letterSpacing: '0.15em' }}
            className="uppercase font-semibold">Young June&apos;s</span>
          <span style={{ color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            1인 서점
          </span>
        </Link>

        {/* 데스크톱: 전체 메뉴 가로 나열 */}
        <nav className="hidden sm:flex items-center gap-5">
          <Link href="/" style={linkStyle} className="whitespace-nowrap hover:opacity-70 transition">홈</Link>
          <Link href="/about" style={linkStyle} className="whitespace-nowrap hover:opacity-70 transition">소개</Link>
          {canWrite && (
            <>
              <Link href="/write" style={linkStyle} className="whitespace-nowrap hover:opacity-70 transition">글쓰기</Link>
              <Link href="/manage" style={linkStyle} className="whitespace-nowrap hover:opacity-70 transition">서재관리</Link>
            </>
          )}
          {session ? (
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <Image src={session.user.image} alt="프로필" width={30} height={30} className="rounded-full" />
              )}
              <button onClick={() => signOut()} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
                className="whitespace-nowrap hover:opacity-70 transition">로그아웃</button>
            </div>
          ) : (
            <button onClick={() => signIn('google')}
              style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.8rem' }}
              className="whitespace-nowrap px-4 py-1.5 rounded-full hover:opacity-80 transition font-medium">
              로그인
            </button>
          )}
        </nav>

        {/* 모바일: 홈 + 메뉴 버튼(드롭다운) */}
        <div className="flex sm:hidden items-center gap-1 relative">
          <Link href="/" onClick={() => setOpen(false)} style={linkStyle}
            className="whitespace-nowrap px-2 py-1.5 hover:opacity-70 transition">홈</Link>
          <button onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="메뉴"
            style={{ color: 'var(--text-sub)', fontSize: '0.875rem' }}
            className="whitespace-nowrap px-2 py-1.5 flex items-center gap-1 hover:opacity-70 transition">
            메뉴
            <span style={{ fontSize: '0.7rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
          </button>

          {open && (
            <>
              {/* 바깥 클릭 시 닫기 */}
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 min-w-[150px] overflow-hidden"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: '12px', boxShadow: '0 8px 28px rgba(44,26,14,0.14)' }}>
                {session?.user?.image && (
                  <div className="flex items-center gap-2 px-4 py-3"
                    style={{ borderBottom: '1px solid var(--border-soft)' }}>
                    <Image src={session.user.image} alt="프로필" width={28} height={28} className="rounded-full" />
                    <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }} className="truncate">
                      {session.user?.name ?? ''}
                    </span>
                  </div>
                )}
                <Link href="/about" onClick={() => setOpen(false)} style={linkStyle}
                  className="block px-4 py-3 hover:opacity-70 transition">소개</Link>
                {canWrite && (
                  <>
                    <Link href="/write" onClick={() => setOpen(false)} style={linkStyle}
                      className="block px-4 py-3 hover:opacity-70 transition">글쓰기</Link>
                    <Link href="/manage" onClick={() => setOpen(false)} style={linkStyle}
                      className="block px-4 py-3 hover:opacity-70 transition">서재관리</Link>
                  </>
                )}
                {session ? (
                  <button onClick={() => { setOpen(false); signOut() }}
                    style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
                    className="block w-full text-left px-4 py-3 hover:opacity-70 transition"
                    >로그아웃</button>
                ) : (
                  <button onClick={() => { setOpen(false); signIn('google') }}
                    style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600 }}
                    className="block w-full text-left px-4 py-3 hover:opacity-70 transition"
                    >로그인</button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
