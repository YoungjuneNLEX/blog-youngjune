'use client'

export default function Footer({ siteName = '1인 서점' }: { siteName?: string }) {
  return (
    <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
      padding: '2rem 4rem', marginTop: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{siteName}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {[
            { label: '네이버 블로그', href: 'https://blog.naver.com/lawyer_youngjune', prefix: 'N' },
            { label: '유튜브', href: 'https://www.youtube.com/@사무장박영준', prefix: '▶' },
            { label: 'X', href: 'https://x.com/youngjune0529', prefix: 'X' },
            { label: '카카오채널', href: 'https://pf.kakao.com/_ExjlsX/chat', prefix: '💬' },
          ].map(link => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '5px' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
              <span>{link.prefix}</span>
              <span className="footer-sns-label">{link.label}</span>
            </a>
          ))}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          © 2026 사무장 박영준. 모든 글의 저작권은 저자에게 있습니다.
        </p>
      </div>
    </footer>
  )
}
