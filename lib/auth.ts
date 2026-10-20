import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { supabaseAdmin } from './supabase'
import type { Role } from './types'

/**
 * 로그인을 허용하는 단 하나의 이메일.
 * 서버 전용 ADMIN_EMAIL 을 먼저 보고, 없으면 예전 이름(NEXT_PUBLIC_ADMIN_EMAIL)을 쓴다.
 * 둘 다 비어 있으면 아무도 들어올 수 없다. (잠그는 쪽으로 실패한다)
 */
export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase()
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = adminEmail()
  return Boolean(admin) && Boolean(email) && email!.trim().toLowerCase() === admin
}

/** 세션이 관리자 것인지. 역할 표시와 이메일을 둘 다 다시 본다. */
export function isAdminSession(
  session: { user?: { email?: string | null; role?: string } } | null | undefined,
): boolean {
  return session?.user?.role === 'admin' && isAdminEmail(session.user.email)
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    // 관리자 이메일이 아니면 로그인 자체를 거절한다. 낯선 계정은 DB 에도 남지 않는다.
    async signIn({ user, profile }) {
      if (!isAdminEmail(user.email)) return false
      if (profile && 'email_verified' in profile && profile.email_verified === false) return false

      // 글 작성자 표시용 프로필 한 줄. 실패해도 로그인은 막지 않는다.
      try {
        await supabaseAdmin.from('profiles').upsert({
          email: user.email!.trim().toLowerCase(),
          name: user.name,
          avatar_url: user.image,
          role: 'admin',
        }, { onConflict: 'email', ignoreDuplicates: false })
      } catch { /* 무시 */ }
      return true
    },
    // 역할은 DB 를 부르지 않고 토큰의 이메일로 매번 정한다. (Proxy 가 쿠키만 읽어도 되게)
    async jwt({ token }) {
      token.role = isAdminEmail(token.email) ? 'admin' : undefined
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role as Role
      return session
    },
  },
})
