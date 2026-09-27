import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  // Claude 호출은 건당 요금이 나가므로 관리자만
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, content } = await req.json()
  const plainText = content?.replace(/<[^>]*>/g, '') || ''

  if (!plainText.trim()) {
    return NextResponse.json({ error: '본문이 비어있습니다.' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `당신은 "사서"입니다. 작가의 글을 따뜻하고 세심하게 읽어주는 작은책방의 사서예요.
아래 글을 읽고 네 가지를 JSON 형식으로 응답해주세요.

글 제목: ${title || '(제목 없음)'}

글 내용:
${plainText}

응답 형식 (반드시 이 JSON만 응답, 설명 없이):
{
  "spelling": [
    { "original": "틀린 표현", "suggestion": "올바른 표현", "reason": "이유" }
  ],
  "titleSuggestions": [
    "제목 후보 1",
    "제목 후보 2",
    "제목 후보 3"
  ],
  "tagSuggestions": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "review": "사서의 글 총평 (2~3문단, 따뜻하고 진심어린 톤으로. 글의 분위기, 인상적인 부분, 발전 방향 등을 자연스럽게 이야기해주세요)"
}

맞춤법/어법 오류가 없으면 spelling은 빈 배열로 주세요.
제목은 현재 제목과 다른 감각적인 후보 3개, 태그는 글의 주제/분위기/키워드를 담은 5개 이내로 추천해주세요.`,
      },
    ],
  })

  const raw = (message.content[0] as any).text
  try {
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw)
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: '응답 파싱 실패', raw }, { status: 500 })
  }
}
