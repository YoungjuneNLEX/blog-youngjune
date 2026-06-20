'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'

export default function Header() {
  const { data: session } = useSession()
  const role = session?.user?.role

  return (
    <header style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}
      className="sticky top-0 z-50 shadow-sm">
      <div className="px-4 sm:px-10 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex flex-col leading-tight shrink-0">
          <span style={{ color: 'var(--accent)', fontSize: '0.65rem', letterSpacing: '0.15em' }}
            className="uppercase font-semibold">Young June&apos;s</span>
          <span style={{ color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            1인 서점
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 min-w-0 overflow-x-auto no-scrollbar">
          <Link href="/" style={{ color: 'var(--text-sub)', fontSize: '0.875rem' }}
            className="shrink-0 whitespace-nowrap hover:opacity-70 transition">홈</Link>
          <Link href="/about" style={{ color: 'var(--text-sub)', fontSize: '0.875rem' }}
            className="shrink-0 whitespace-nowrap hover:opacity-70 transition">소개</Link>

          {(role === 'admin' || role === 'writer') && (
            <>
              <Link href="/write" style={{ color: 'var(--text-sub)', fontSize: '0.875rem' }}
                className="shrink-0 whitespace-nowrap hover:opacity-70 transition">글쓰기</Link>
              <Link href="/manage" style={{ color: 'var(--text-sub)', fontSize: '0.875rem' }}
                className="shrink-0 whitespace-nowrap hover:opacity-70 transition">서재관리</Link>
            </>
          )}

          {session ? (
            <div className="flex items-center gap-3 shrink-0">
              {session.user?.image && (
                <Image src={session.user.image} alt="프로필"
                  width={30} height={30} className="rounded-full shrink-0" />
              )}
              <button onClick={() => signOut()}
                style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
                className="shrink-0 whitespace-nowrap hover:opacity-70 transition">로그아웃</button>
            </div>
          ) : (
            <button onClick={() => signIn('google')}
              style={{ background: 'var(--accent)', color: '#fff', fontSize: '0.8rem' }}
              className="shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full hover:opacity-80 transition font-medium">
              로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
