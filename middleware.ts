import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // /write, /admin 은 writer 이상만
  if (pathname.startsWith('/write') || pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    const role = session.user?.role
    if (role !== 'admin' && role !== 'writer') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // 쓰는 공간(적바림·노트 창고)은 관리자만
  if (pathname.startsWith('/memo') || pathname.startsWith('/notes')) {
    if (session?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/write/:path*', '/admin/:path*', '/memo/:path*', '/notes/:path*'],
}
