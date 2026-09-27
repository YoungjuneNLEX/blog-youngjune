import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * 주제별로 글이 몇 편 있는지.
 * 설정 화면이 "이름을 바꾸면 글 8편이 함께 바뀝니다" 라고 미리 알려줄 때 쓴다.
 */
export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin.from('posts').select('topic')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const usage: Record<string, number> = {}
  for (const row of data || []) {
    const key = (row.topic as string | null) || ''
    if (!key) continue
    usage[key] = (usage[key] || 0) + 1
  }
  return NextResponse.json({ usage })
}
