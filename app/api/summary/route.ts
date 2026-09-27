import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * 세 줄 요약 만들기.
 *
 * 만들어 주기만 하고 저장은 하지 않는다. 관리자가 글쓰기 화면에서 고친 뒤
 * 글을 저장할 때 posts.summary 에 함께 들어간다.
 * 방문자 화면은 저장된 것만 읽는다. (누를 때 만들지 않는다)
 */
export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, content } = await req.json()
  const plainText = String(content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!plainText) {
    return NextResponse.json({ error: '본문이 비어 있습니다.' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `아래 글을 읽고 세 줄로 요약해주세요.

글 제목: ${title || '(제목 없음)'}

글 내용:
${plainText.slice(0, 20000)}

규칙:
- 정확히 세 줄. 한 줄에 한 문장.
- 각 줄은 40자 안팎으로 짧게.
- 번호나 기호를 붙이지 말고 문장만.
- 글쓴이가 실제로 쓴 내용만. 없는 말을 지어내지 마세요.
- 설명 없이 세 줄만 출력하세요.`,
      },
    ],
  })

  const block = message.content[0]
  const raw = block.type === 'text' ? block.text : ''
  const lines = raw
    .split('\n')
    .map(l => l.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3)

  return NextResponse.json({ summary: lines.join('\n'), lines })
}
