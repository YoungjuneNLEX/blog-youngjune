import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getSiteConfig, mergeConfig } from '@/lib/settings'
import { revalidatePublicPages } from '@/lib/revalidate'
import { NextResponse } from 'next/server'

export async function GET() {
  const config = await getSiteConfig()
  return NextResponse.json(config)
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const before = await getSiteConfig()
  const config = mergeConfig(await req.json())

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ key: 'site_config', value: JSON.stringify(config) }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 주제 이름은 posts.topic 에 글자 그대로 들어 있다.
  // 이름을 바꾸거나 주제를 지우면 기존 글도 같이 옮겨야 주제에서 사라지지 않는다.
  // (설정 화면이 저장 전에 몇 편이 바뀌는지 보여주고 확인을 받는다)
  let moved = 0

  for (const topic of config.topics) {
    const old = before.topics.find(o => o.id === topic.id)
    if (!old || old.name === topic.name) continue
    const { count } = await supabaseAdmin
      .from('posts')
      .update({ topic: topic.name }, { count: 'exact' })
      .eq('topic', old.name)
    moved += count || 0
  }

  for (const old of before.topics) {
    if (config.topics.some(t => t.id === old.id)) continue
    // 지운 주제의 글은 '분류 전'으로 되돌린다
    const { count } = await supabaseAdmin
      .from('posts')
      .update({ topic: null }, { count: 'exact' })
      .eq('topic', old.name)
    moved += count || 0
  }

  revalidatePublicPages()
  return NextResponse.json({ ok: true, config, moved })
}
