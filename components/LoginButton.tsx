'use client'

import { signIn } from 'next-auth/react'

export default function LoginButton() {
  return (
    <button type="button" className="btn btn-accent btn-block"
      onClick={() => signIn('google', { callbackUrl: '/' })}>
      Google 로 로그인
    </button>
  )
}
