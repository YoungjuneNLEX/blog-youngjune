import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '적바림',
  description: '영상 콘티를 짜는 나만의 작업실',
  // 방문자 화면이 없다. 검색엔진에 노출하지 않는다. (robots.txt·응답 헤더와 함께 세 겹)
  robots: { index: false, follow: false, noarchive: true },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '적바림' },
  other: { 'mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fdfcf9',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* 한글 웹폰트는 글자 수가 많아 self-host 하면 무거우므로 link 로 부른다. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
            })
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
