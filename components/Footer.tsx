'use client'

import { usePathname } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'

export default function Footer({
  siteName = '적바림', note = '', authorName = '',
}: { siteName?: string; note?: string; authorName?: string }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  // 쓰는 공간에는 푸터를 두지 않는다 (시안 Write·Archive 에 없다)
  if (pathname?.startsWith('/memo') || pathname?.startsWith('/notes')) return null

  return (
    <footer className="wrap"
      style={{ marginTop: 'auto', paddingTop: '32px', paddingBottom: '28px',
        display: 'flex', flexDirection: 'column', gap: '6px',
        fontSize: '13px', color: 'var(--text-sub)' }}>
      <span className="serif" style={{ fontSize: '15px', color: 'var(--text-main)' }}>{siteName}</span>
      {note && <span>{note}</span>}
      {authorName && <span>{authorName}</span>}
      {!session && (
        <button onClick={() => signIn('google')}
          style={{ alignSelf: 'flex-start', marginTop: '6px', background: 'none', border: 'none',
            padding: 0, cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)',
            fontFamily: 'inherit' }}>
          로그인
        </button>
      )}
    </footer>
  )
}
