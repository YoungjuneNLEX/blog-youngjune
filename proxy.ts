import { auth, isAdminSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * 전체 로그인 잠금 — 관리자(ADMIN_EMAIL)만 통과한다.
 * 쿠키의 세션만 읽는다(DB 를 부르지 않는다). 실제 검사는 lib/dal.ts 가 데이터 가까이에서 다시 한다.
 *
 * 예외(아래 matcher): 로그인 화면, 로그인 처리(/api/auth), keep-alive(자체 비밀값 검사),
 * 정적 파일, 검색 차단(robots), 앱 설치용 파일(매니페스트·아이콘·서비스 워커).
 */
export default auth(req => {
  if (isAdminSession(req.auth)) return NextResponse.next()

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.redirect(new URL('/login', req.url))
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico$|robots.txt$|manifest.json$|memo-manifest.json$|sw.js$|icons/|login$|api/auth/|api/keep-alive$).*)',
  ],
}
