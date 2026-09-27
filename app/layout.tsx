import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { SessionProvider } from 'next-auth/react'
import { getSiteConfig, themeToCssVars } from '@/lib/settings'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  return {
    title: config.siteName,
    description: `${config.siteName} — ${config.heroTitle}`,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: config.siteName,
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const config = await getSiteConfig()
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: config.theme.accent,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 여기서 auth() 를 부르면 쿠키를 읽게 되어 모든 페이지가 매 요청 동적 렌더링된다.
  // 로그인 상태는 SessionProvider 가 브라우저에서 /api/auth/session 으로 받아온다.
  // (헤더가 아주 잠깐 로그아웃 상태로 보였다가 채워진다)
  const config = await getSiteConfig()
  const themeVars = themeToCssVars(config.theme)

  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* 제목·본문 인용은 명조, UI 는 고딕. 한글 웹폰트는 글자 수가 많아
            self-host 하면 무거우므로 필요한 구간만 내려받게 link 로 부른다. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
            })
          }
        ` }} />
      </head>
      <body className="min-h-screen"
        style={{ background: 'var(--bg)', ...themeVars } as React.CSSProperties}>
        <SessionProvider>
          <Header siteName={config.siteName} topics={config.topics} />
          <main>{children}</main>
          <Footer
            siteName={config.footerName}
            note={config.footerNote}
            authorName={config.profile.name}
          />
        </SessionProvider>
      </body>
    </html>
  )
}
