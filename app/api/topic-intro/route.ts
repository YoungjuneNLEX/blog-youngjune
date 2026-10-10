import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { parentNameOf, topicNamesUnder } from '@/lib/site-config'
import { summaryLines } from '@/lib/public'
import { toPlainText } from '@/lib/cover'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 호출마다 요금이 나가므로 읽어 오는 양에 상한을 둔다
const MAX_POSTS = 20
const MAX_CHARS = 8000

/**
 * 'AI로 소개글 초안 만들기'.
 *
 * 설정에 저장된 서재·시리즈를 기준으로, 그 공개 긴 글(서재는 시리즈 글 포함)의
 * 제목과 세 줄 요약(없으면 앞부분)을 모아 2~3문장 소개글 초안을 만든다.
 * 만들어 주기만 하고 저장하지 않는다. 관리자가 고친 뒤 설정을 저장할 때 들어간다.
 * 방문자 화면에서는 이 API 를 부르지 않는다.
 */
export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { topicId } = await req.json()
  const config = await getSiteConfig()
  const topic = config.topics.find(t => t.id === topicId)
  if (!topic) {
    return NextResponse.json(
      { error: '저장된 서재·시리즈를 찾지 못했습니다. 새로 만들었다면 먼저 저장해 주세요.' }, { status: 404 })
  }

  const names = topicNamesUnder(config.topics, topic.name)
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('title, summary, content, excerpt, created_at')
    .eq('published', true).eq('visibility', 'public').eq('kind', 'article')
    .in('topic', names)
    .order('created_at', { ascending: false })
    .limit(MAX_POSTS)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) {
    return NextResponse.json(
      { error: '이 서재·시리즈에 공개한 긴 글이 아직 없습니다. 글을 공개한 뒤에 만들 수 있습니다.' }, { status: 400 })
  }

  // 글마다 제목 + 세 줄 요약, 요약이 없으면 본문 앞부분
  let used = 0
  const lines: string[] = []
  for (const p of data) {
    const gist = summaryLines(p.summary).join(' ') || p.excerpt?.trim() || toPlainText(p.content).slice(0, 160)
    const line = `- ${p.title}: ${gist}`
    if (used + line.length > MAX_CHARS) break
    used += line.length
    lines.push(line)
  }

  const parent = parentNameOf(config.topics, topic.name)
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `아래는 한 사람이 쓴 블로그의 "${parent ? `${parent} > ` : ''}${topic.name}" ${parent ? '시리즈' : '서재'}에 공개된 긴 글들입니다.
이 ${parent ? '시리즈' : '서재'}를 처음 보는 방문자에게 보여 줄 소개글을 써 주세요.

[글 목록 — 제목: 요약]
${lines.join('\n')}

규칙:
- 2~3문장. 합쳐서 150자 안팎.
- 이 글들이 실제로 다루는 것만 쓰세요. 목록에 없는 사실이나 약속은 지어내지 마세요.
- 글쓴이를 "저"나 "나"로 부르지 말고, 담담한 평서문으로.
- 글 제목을 그대로 나열하지 말고 공통된 결을 한마디로 잡아 주세요.
- 따옴표·머리말·설명 없이 소개글 본문만 출력하세요.`,
      },
    ],
  })

  const block = message.content[0]
  const raw = block.type === 'text' ? block.text : ''
  const description = raw.replace(/^["“”'\s]+|["“”'\s]+$/g, '').trim()
  if (!description) {
    return NextResponse.json({ error: '소개글을 만들지 못했습니다. 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ description, basedOn: lines.length })
}
