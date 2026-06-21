import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'
import { getSiteConfig, themeToCssVars } from '@/lib/settings'

const geist = Geist({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  return {
    title: config.siteName,
    description: `${config.siteName} — 법, 일상, 그리고 책 이야기`,
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
  const session = await auth()
  const config = await getSiteConfig()
  const themeVars = themeToCssVars(config.theme)

  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
            })
          }
        ` }} />
      </head>
      <body className={`${geist.className} min-h-screen`}
        style={{ background: 'var(--bg)', ...themeVars } as React.CSSProperties}>
        <SessionProvider session={session}>
          <Header siteName={config.siteName} siteEyebrow={config.siteEyebrow} />
          <main>{children}</main>
          <Footer siteName={config.footerName} />
        </SessionProvider>
      </body>
    </html>
  )
}
