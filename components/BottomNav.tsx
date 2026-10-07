'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import CategoryPanel from '@/components/CategoryPanel'
import { Topic } from '@/lib/site-config'
import { topicFromSlug } from '@/lib/cover'

/** 쓰는 공간에는 두지 않는다 (자체 머리글을 쓴다) */
const WRITING = ['/notes', '/write', '/admin']

/**
 * 하단 고정 메뉴 (모바일)
 *   방문자 : 홈 · 주제 · 소개
 *   관리자 : 홈 · 주제 · 글쓰기 · 글관리 · 소개
 * 로그인 여부는 브라우저에서 판단하므로 페이지 캐시가 깨지지 않는다.
 */
export default function BottomNav({ topics }: { topics: Topic[] }) {
  const pathname = usePathname() || '/'
  const { data: session } = useSession()
  const [pick, setPick] = useState(false)

  if (WRITING.some(p => pathname.startsWith(p))) return null

  const isAdmin = session?.user?.role === 'admin'
  const onTopics = pathname.startsWith('/topics')
  // 지금 보고 있는 분류. 홈이면 '전체 글', 그 밖의 화면이면 아무것도 표시하지 않는다.
  const currentTopic = pathname.startsWith('/topics/')
    ? topicFromSlug(pathname.split('/')[2] || '')
    : pathname === '/' ? null : ''
  const cols = isAdmin ? 5 : 3

  return (
    <>
      <div className="bottom-nav-space only-mobile" />
      <nav aria-label="아래 메뉴" className="bottom-nav only-mobile"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        <Link href="/" className={pathname === '/' ? 'on' : ''}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinejoin="round" aria-hidden><path d="M4 11l8-7 8 7v9H4z" /></svg>
          홈
        </Link>

        <button type="button" onClick={() => setPick(true)} className={onTopics ? 'on' : ''}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M5 6h14M5 12h14M5 18h9" /></svg>
          주제
        </button>

        {isAdmin && (
          <Link href="/write" className="write">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden>
              <rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" />
            </svg>
            글쓰기
          </Link>
        )}

        {isAdmin && (
          <Link href="/notes">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="4" y="4" width="16" height="16" rx="2.5" />
              <path d="M8 9h8M8 13h8M8 17h5" />
            </svg>
            글관리
          </Link>
        )}

        <Link href="/about" className={pathname.startsWith('/about') ? 'on' : ''}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </svg>
          소개
        </Link>
      </nav>

      {pick && (
        <CategoryPanel topics={topics} current={currentTopic} onClose={() => setPick(false)} />
      )}
    </>
  )
}
