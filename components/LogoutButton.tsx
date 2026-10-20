'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { clearAppCaches } from '@/lib/clear-caches'

export default function LogoutButton() {
  const [busy, setBusy] = useState(false)

  async function logout() {
    if (busy) return
    setBusy(true)
    await clearAppCaches()   // 이 기기에 남은 캐시도 함께 비운다
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <button type="button" className="btn btn-block" onClick={logout} disabled={busy}
      style={{ marginTop: '16px' }}>
      {busy ? '로그아웃 중…' : '로그아웃'}
    </button>
  )
}
