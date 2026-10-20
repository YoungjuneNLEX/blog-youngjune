import BottomNav from '@/components/BottomNav'
import { requirePageAdmin } from '@/lib/dal'

// 로그인 뒤의 모든 화면은 캐시하지 않는다. 항상 지금 DB 상태를 본다.
export const dynamic = 'force-dynamic'

/**
 * 로그인 뒤의 화면 틀. Proxy 가 1차로 막고, 여기서 한 번 더 관리자인지 확인한다.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requirePageAdmin()
  return (
    <>
      <main className="app-main">{children}</main>
      <BottomNav />
    </>
  )
}
