import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { auth, isAdminSession } from '@/lib/auth'

/**
 * 데이터 접근 층 — Proxy 가 1차로 막지만, 실제 검사는 데이터 가까이에서 한 번 더 한다.
 * (Proxy 설정이 잘못돼도 화면과 API 가 스스로 막히게)
 */

/** 이번 요청의 관리자 세션. 관리자가 아니면 null. */
export const getAdminSession = cache(async () => {
  const session = await auth()
  return isAdminSession(session) ? session : null
})

/** 서버 화면용 — 관리자가 아니면 로그인 화면으로 보낸다. */
export async function requirePageAdmin() {
  const session = await getAdminSession()
  if (!session) redirect('/login')
  return session
}

/**
 * API 용 — 관리자가 아니면 돌려줄 응답을 만든다. 통과하면 null.
 *   const denied = await requireApiAdmin(); if (denied) return denied
 */
export async function requireApiAdmin(): Promise<NextResponse | null> {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminSession(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null
}
