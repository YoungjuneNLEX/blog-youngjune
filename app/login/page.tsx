import { redirect } from 'next/navigation'
import LoginButton from '@/components/LoginButton'
import { getAdminSession } from '@/lib/dal'

export const dynamic = 'force-dynamic'

const MESSAGES: Record<string, string> = {
  AccessDenied: '허용되지 않는 계정입니다. 이 작업실은 주인 한 명만 쓸 수 있습니다.',
  Configuration: '로그인 설정에 문제가 있습니다. 환경변수를 확인해 주세요.',
}

/** 로그인 — 유일한 공개 화면. 관리자 계정만 통과한다. */
export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminSession()) redirect('/')
  const { error } = await searchParams

  return (
    <div className="login">
      <h1 className="login-title">적바림</h1>
      <p className="login-sub">영상 콘티를 짜는 나만의 작업실</p>
      {error && (
        <p role="alert" className="login-error">
          {MESSAGES[error] || '로그인하지 못했습니다. 다시 시도해 주세요.'}
        </p>
      )}
      <LoginButton />
    </div>
  )
}
