import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { revalidatePublicPages } from '@/lib/revalidate'
import { mergeConfig, Topic } from '@/lib/site-config'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * 서재·시리즈별로 글이 몇 편 있는지.
 * 설정 화면이 "이름을 바꾸면 글 8편이 함께 바뀝니다" 라고 미리 알려줄 때,
 * 글쓰기 화면이 시리즈 옆에 편수를 보여 줄 때 쓴다. (공개하지 않은 글도 센다)
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

const MAX_NAME = 30

/**
 * 글쓰기 화면에서 새 시리즈를 그 자리에서 만든다. (설정 화면에 가지 않아도 된다)
 *
 * - 서재(libraryId) 아래 시리즈로 설정에 저장한다. 연재로 보기는 기본 켬, 색은 비워 서재 색을 따른다.
 * - 글의 topic 에는 이름만 저장되므로 이름은 서재·시리즈를 통틀어 하나뿐이어야 한다.
 *   같은 서재 안에 같은 이름이 이미 있으면 새로 만들지 않고 그것을 돌려준다(existing: true).
 *   다른 서재의 시리즈나 서재 이름과 같으면 409 로 막는다.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const name = String(body.name || '').trim().replace(/\s+/g, ' ')
  if (!name) return NextResponse.json({ error: '시리즈 이름을 써 주세요.' }, { status: 400 })
  if (name.length > MAX_NAME) {
    return NextResponse.json({ error: `시리즈 이름은 ${MAX_NAME}자까지 쓸 수 있습니다.` }, { status: 400 })
  }

  const config = await getSiteConfig()
  const library = config.topics.find(t => t.id === body.libraryId && !t.parentId)
  if (!library) {
    return NextResponse.json({ error: '서재를 찾지 못했습니다. 화면을 새로 고친 뒤 다시 골라 주세요.' }, { status: 404 })
  }

  const same = config.topics.find(t => t.name.toLowerCase() === name.toLowerCase())
  if (same) {
    if (same.parentId === library.id) return NextResponse.json({ topic: same, existing: true })
    const owner = same.parentId ? config.topics.find(t => t.id === same.parentId)?.name : null
    return NextResponse.json({
      error: owner
        ? `'${same.name}' 은(는) 이미 '${owner}' 서재의 시리즈로 있습니다. 다른 이름을 써 주세요.`
        : `'${same.name}' 은(는) 이미 서재 이름으로 있습니다. 다른 이름을 써 주세요.`,
    }, { status: 409 })
  }

  const topic: Topic = {
    id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name, short: name, color: '', ink: '',
    parentId: library.id,
    series: true,    // 새 시리즈는 연재로 보기가 기본 켬
  }
  const next = mergeConfig({ ...config, topics: [...config.topics, topic] })

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ key: 'site_config', value: JSON.stringify(next) }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePublicPages()
  return NextResponse.json({ topic: next.topics.find(t => t.id === topic.id) || topic, existing: false })
}
