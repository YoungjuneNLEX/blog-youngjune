import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { parseTemplates } from '@/lib/templates'
import { toPlainText } from '@/lib/cover'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 한 번에 묶을 수 있는 양. 관리자만 쓰지만 호출마다 요금이 나간다.
const MAX_NOTES = 20
const MAX_CHARS = 20000

/**
 * 묶어서 글 초안 만들기.
 *
 * 고른 메모들을 Claude 에게 넘겨 긴 글 초안 한 편을 만든다.
 * - 원본 메모는 건드리지 않는다. 지우지도, 고치지도, 공개로 바꾸지도 않는다.
 * - 새 글은 비공개(published=false)로만 들어간다. 발행은 글쓰기 화면에서 사람이 한다.
 * - source_note_ids 에 밑이 된 메모를 적어 둔다. 요약 창의 "이 글이 나온 메모"가 이것을 읽는다.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin' || !session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { ids, templateId } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: '메모를 하나 이상 골라주세요.' }, { status: 400 })
  }
  if (ids.length > MAX_NOTES) {
    return NextResponse.json(
      { error: `한 번에 ${MAX_NOTES}개까지 묶을 수 있습니다.` }, { status: 400 })
  }

  // 메모만 묶는다. 긴 글이 섞여 들어오면 거른다.
  const { data: notes, error } = await supabaseAdmin
    .from('posts')
    .select('id, content, topic, created_at')
    .in('id', ids).eq('kind', 'note')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!notes?.length) {
    return NextResponse.json({ error: '묶을 메모를 찾지 못했습니다.' }, { status: 400 })
  }

  const pieces = notes.map(n => toPlainText(n.content)).filter(Boolean)
  const joined = pieces.join('\n\n---\n\n')
  if (joined.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `묶을 글이 너무 깁니다. ${MAX_CHARS}자 이내로 골라주세요.` }, { status: 400 })
  }

  // 고른 템플릿이 있으면 그 뼈대를 채우게 한다
  let template = ''
  if (templateId) {
    const { data: row } = await supabaseAdmin
      .from('site_settings').select('value').eq('key', 'templates').maybeSingle()
    template = parseTemplates(row?.value).find(t => t.id === templateId)?.body || ''
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `아래는 한 사람이 따로따로 적어 둔 메모들입니다.
이것들을 이어서 한 편의 글 초안으로 엮어주세요.

${template ? `[따를 뼈대 — 이 구조의 칸을 메모 내용으로 채우세요]
${template}

` : ''}[메모]
${joined}

규칙:
- 메모에 있는 내용만 쓰세요. 없는 사실이나 인용을 지어내지 마세요.
- 글쓴이의 말투를 살리되, 흩어진 메모가 한 흐름으로 읽히게 이어주세요.
- 완성본이 아니라 손볼 초안입니다. 애매한 곳은 그대로 두세요.
- 본문은 간단한 HTML 로 (<p>, <h2>, <blockquote>, <ul>, <li> 정도만).

아래 JSON 만 응답하세요. 설명은 붙이지 마세요.
{
  "title": "글 제목",
  "body": "<p>본문 HTML</p>"
}`,
      },
    ],
  })

  const block = message.content[0]
  const raw = block.type === 'text' ? block.text : ''
  let draft: { title?: string; body?: string }
  try {
    draft = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw)
  } catch {
    return NextResponse.json({ error: '초안을 만들지 못했습니다. 다시 시도해주세요.' }, { status: 500 })
  }
  if (!draft.body?.trim()) {
    return NextResponse.json({ error: '초안 본문이 비어 있습니다.' }, { status: 500 })
  }

  // 주제는 고른 메모에서 가장 많이 나온 것을 따른다
  const tally = new Map<string, number>()
  for (const n of notes) {
    if (!n.topic) continue
    tally.set(n.topic, (tally.get(n.topic) || 0) + 1)
  }
  const topic = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id').eq('email', session.user.email).maybeSingle()

  const { data: created, error: insertError } = await supabaseAdmin
    .from('posts')
    .insert({
      title: draft.title?.trim() || '제목 없는 초안',
      content: draft.body,
      kind: 'article',
      topic,
      published: false,      // 초안은 비공개로만 들어간다
      visibility: 'public',
      source_note_ids: notes.map(n => n.id),
      author_id: profile?.id,
    })
    .select('id')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // 원본 메모는 그대로 둔다. 여기서 아무것도 바꾸지 않는다.
  return NextResponse.json({ id: created.id, count: notes.length })
}
