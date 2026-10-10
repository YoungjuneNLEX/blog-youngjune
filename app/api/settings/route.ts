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

  const body = await req.json()
  const before = await getSiteConfig()
  let config = mergeConfig(body)

  // 안전장치 — 오래 열어 둔 설정 화면이 그 사이 생긴 시리즈를 지우지 않게 한다.
  // 글쓰기 화면에서 시리즈를 새로 만들 수 있으므로, 설정 화면이 불러올 때 몰랐던 항목
  // (knownTopicIds 에 없는 것)은 "지운 것"이 아니라 "새로 생긴 것"으로 보고 그대로 남긴다.
  // 지운 것으로 읽으면 그 글들이 분류 전으로 돌아가 버린다.
  const known: Set<string> | null = Array.isArray(body.knownTopicIds)
    ? new Set((body.knownTopicIds as unknown[]).filter((x): x is string => typeof x === 'string'))
    : null
  if (known) {
    const fresh = before.topics.filter(
      t => !known.has(t.id) && !config.topics.some(x => x.id === t.id))
    if (fresh.length > 0) {
      config = mergeConfig({ ...config, topics: [...config.topics, ...fresh] })
    }
  }

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ key: 'site_config', value: JSON.stringify(config) }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 서재·시리즈 이름은 posts.topic 에 글자 그대로 들어 있다.
  // 이름을 바꾸거나 지우면 기존 글도 같이 옮겨야 서재에서 사라지지 않는다.
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
    // 지운 서재·시리즈의 글은 '분류 전'으로 되돌린다
    const { count } = await supabaseAdmin
      .from('posts')
      .update({ topic: null }, { count: 'exact' })
      .eq('topic', old.name)
    moved += count || 0
  }

  revalidatePublicPages()
  return NextResponse.json({ ok: true, config, moved })
}
