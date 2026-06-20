'use client'

const channels = [
  {
    label: '네이버 블로그',
    href: 'https://blog.naver.com/lawyer_youngjune',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <rect width="24" height="24" rx="6" fill="#03C75A"/>
        <path d="M6 18V6h4.2l3.6 6V6H18v12h-4.2l-3.6-6v6H6z" fill="white"/>
      </svg>
    ),
    color: '#03C75A',
    desc: '현직 사무장의 법무사사무소 이야기',
    cta: '블로그에서 보기',
  },
  {
    label: '유튜브',
    href: 'https://www.youtube.com/@사무장박영준',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22">
        <rect width="24" height="24" rx="6" fill="#FF0000"/>
        <path d="M20.5 7.5s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C15.2 4.5 12 4.5 12 4.5s-3.2 0-5.6.1c-.4.1-1.3.1-2.1.9-.6.6-.8 2-.8 2S3.3 9.1 3.3 10.7v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.8C8 18.4 12 18.4 12 18.4s3.2 0 5.6-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5c0-1.6-.2-3.2-.2-3.2zM10.2 14.2V9.5l5.1 2.4-5.1 2.3z" fill="white"/>
      </svg>
    ),
    color: '#FF0000',
    desc: '공부하는 법학도 채널',
    cta: '채널에서 보기',
  },
  {
    label: 'X',
    href: 'https://x.com/youngjune0529',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22">
        <rect width="24" height="24" rx="6" fill="#000"/>
        <path d="M17.5 4h2.6l-5.6 6.4L21 20h-5.1l-4-5.3L7.3 20H4.7l6-6.8L4 4h5.3l3.6 4.8L17.5 4zm-.9 14.5h1.4L7.5 5.5H6l10.6 13z" fill="white"/>
      </svg>
    ),
    color: '#000000',
    desc: '법률 관련 이슈 스크랩',
    cta: 'X에서 보기',
  },
  {
    label: '카카오채널',
    href: 'https://pf.kakao.com/_ExjlsX/chat',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22">
        <rect width="24" height="24" rx="6" fill="#FEE500"/>
        <path d="M12 5C7.6 5 4 7.9 4 11.5c0 2.3 1.5 4.3 3.8 5.5l-.9 3.4 3.8-2.5c.4.1.8.1 1.3.1 4.4 0 8-2.9 8-6.5S16.4 5 12 5z" fill="#3A1D1D"/>
      </svg>
    ),
    color: '#FEE500',
    desc: '궁금한 점이 있으신가요?\n카카오로 바로 채팅하세요.',
    cta: '채팅하기',
  },
]

export default function SNSSection() {
  return (
    <section className="sns-section" style={{ borderTop: '1px solid var(--border)' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: '4px', height: '1.4rem', background: 'var(--accent)', borderRadius: '2px' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>SNS 더보기</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingLeft: '14px' }}>
          블로그·유튜브 최신 소식과 X·카카오 바로가기
        </p>
      </div>

      <div className="sns-grid">
        {channels.map(ch => (
          <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer"
            className="sns-card"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '16px', textDecoration: 'none',
              display: 'flex', flexDirection: 'column', gap: '10px',
              transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(44,26,14,0.1)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = 'none'
              ;(e.currentTarget as HTMLElement).style.transform = 'none'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {ch.icon}
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{ch.label}</span>
            </div>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.82rem', lineHeight: 1.6,
              flex: 1, whiteSpace: 'pre-line' }}>{ch.desc}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '0.8rem', fontWeight: 600,
              color: ch.color === '#FEE500' ? '#3A1D1D' : ch.color === '#000000' ? '#555' : ch.color }}>
              {ch.cta} →
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
