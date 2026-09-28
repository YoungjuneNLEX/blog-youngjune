'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import TopicPicker from '@/components/TopicPicker'
import { Topic } from '@/lib/site-config'
import { topicSlug } from '@/lib/cover'

/** 쓰는 공간에는 두지 않는다 (자체 머리글을 쓴다) */
const WRITING = ['/memo', '/notes', '/write', '/admin']

/**
 * 하단 고정 메뉴 (모바일) — 홈 · 주제 · 적바림 · 책장 · 소개
 * '적바림'은 관리자에게만 보인다. 방문자에게는 네 칸.
 * 로그인 여부는 브라우저에서 판단하므로 페이지 캐시가 깨지지 않는다.
 */
export default function BottomNav({
  topics, showBookshelf,
}: { topics: Topic[]; showBookshelf: boolean }) {
  const pathname = usePathname() || '/'
  const router = useRouter()
  const { data: session } = useSession()
  const [pick, setPick] = useState(false)

  if (WRITING.some(p => pathname.startsWith(p))) return null

  const isAdmin = session?.user?.role === 'admin'
  const onTopics = pathname.startsWith('/topics') || pathname === '/archive'
  const cols = 3 + (isAdmin ? 1 : 0) + (showBookshelf ? 1 : 0)

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
          <Link href="/memo" className="write">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden>
              <rect x="4" y="4" width="16" height="16" rx="4" /><path d="M12 8v8M8 12h8" />
            </svg>
            적바림
          </Link>
        )}

        {showBookshelf && (
          <Link href="/bookshelf" className={pathname.startsWith('/bookshelf') ? 'on' : ''}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
              <path d="M5 4h5v16H5zM10 4h4v16h-4zM15 5l4 1-3 14-4-1z" />
            </svg>
            책장
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
        <TopicPicker topics={topics} current={null} onClose={() => setPick(false)}
          onPick={t => {
            setPick(false)
            router.push(t ? `/topics/${topicSlug(t)}` : '/archive')
          }} />
      )}
    </>
  )
}
