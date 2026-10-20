'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * 하단 고정 메뉴 — 콘티 · 질문 · (+ 새 콘티) · 메모 · 설정.
 * 가운데 + 버튼이 가장 크다. 엄지가 닿는 아래쪽에 두고 터치 영역은 48px 이상.
 */
const ICON = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

export default function BottomNav() {
  const pathname = usePathname()
  const on = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <nav className="bottom-nav" aria-label="주 메뉴">
      <Link href="/" className={`nav-item${on('/') ? ' on' : ''}`} aria-current={on('/') ? 'page' : undefined}>
        <svg {...ICON}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M9 9v11" /></svg>
        <span>콘티</span>
      </Link>
      <Link href="/questions" className={`nav-item${on('/questions') ? ' on' : ''}`}
        aria-current={on('/questions') ? 'page' : undefined}>
        <svg {...ICON}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></svg>
        <span>질문</span>
      </Link>
      <Link href="/new" className="nav-plus" aria-label="새 콘티">
        <svg {...ICON} width={28} height={28} strokeWidth={2.2}><path d="M12 5v14M5 12h14" /></svg>
      </Link>
      <Link href="/memo" className={`nav-item${on('/memo') ? ' on' : ''}`}
        aria-current={on('/memo') ? 'page' : undefined}>
        <svg {...ICON}><path d="M5 20l1-4L17 5l3 3L9 19l-4 1z" /></svg>
        <span>메모</span>
      </Link>
      <Link href="/settings" className={`nav-item${on('/settings') ? ' on' : ''}`}
        aria-current={on('/settings') ? 'page' : undefined}>
        <svg {...ICON}><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>
        <span>설정</span>
      </Link>
    </nav>
  )
}
