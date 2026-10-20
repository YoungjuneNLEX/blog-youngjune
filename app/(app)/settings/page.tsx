import LogoutButton from '@/components/LogoutButton'
import { requirePageAdmin } from '@/lib/dal'

/** 설정 — 지금은 계정과 로그아웃만. (인사말·닫는 말·템플릿은 3단계에서 들어온다) */
export default async function SettingsPage() {
  const session = await requirePageAdmin()
  return (
    <>
      <h1 className="page-title">설정</h1>
      <section className="card">
        <p className="label">로그인한 계정</p>
        <p style={{ margin: '4px 0 0', wordBreak: 'break-all' }}>{session.user.email}</p>
      </section>
      <LogoutButton />
    </>
  )
}
