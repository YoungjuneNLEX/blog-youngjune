import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// 이 경로는 절대 캐시하지 않는다. 매번 실제로 DB 를 건드려야 의미가 있다.
export const dynamic = 'force-dynamic'

/**
 * Supabase 깨우기 (keep-alive)
 *
 * 무료 플랜은 일정 기간 활동이 없으면 프로젝트를 일시정지한다.
 * Vercel Cron 이 하루 한 번 이 경로를 불러 가벼운 조회를 한 번 날린다.
 *
 * Vercel 은 CRON_SECRET 환경변수가 설정되어 있으면 Cron 요청에
 * Authorization: Bearer <CRON_SECRET> 헤더를 붙여 보낸다.
 * 이 헤더가 맞지 않으면 거절해 아무나 부르지 못하게 한다.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin.from('posts').select('id').limit(1)

  if (error) {
    console.error('[keep-alive] 실패:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() })
}
