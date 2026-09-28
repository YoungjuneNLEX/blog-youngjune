import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// 카테고리 화면이 쓰는 공개 숫자. 5분마다 새로 센다.
export const revalidate = 300

/**
 * 주제 이름별 공개 글 수.
 * 공개 글(published + visibility='public')만 센다. 비공개 글은 숫자에도 드러나지 않는다.
 * 대분류가 중분류 글까지 더하는 셈은 화면에서 한다. (설정의 계층을 아는 쪽이 화면이다)
 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('topic')
    .eq('published', true).eq('visibility', 'public')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts: Record<string, number> = {}
  let total = 0
  for (const row of data || []) {
    total++
    const key = (row.topic as string | null) || ''
    if (!key) continue
    counts[key] = (counts[key] || 0) + 1
  }
  return NextResponse.json({ total, counts })
}
