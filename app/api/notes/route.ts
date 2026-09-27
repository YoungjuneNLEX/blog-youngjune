import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePublicPages } from '@/lib/revalidate'
import { NextResponse } from 'next/server'

// 쓰는 공간은 관리자만. 세션에서 프로필 id 까지 확인한다.
async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== 'admin' || !session.user.email) return null
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', session.user.email)
    .maybeSingle()
  return profile?.id ? { authorId: profile.id as string } : null
}

/** 빠른 메모 저장 — 제목 없이 본문만. 항상 비공개로 들어간다. */
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { content, topic } = await req.json()
  const body = String(content || '').trim()
  if (!body) return NextResponse.json({ error: '내용이 비어 있습니다.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      title: '',              // 메모는 제목이 없다
      content: body,
      kind: 'note',
      topic: topic || null,   // 나중에 분류해도 된다
      published: false,       // 기록이 먼저, 공개는 나중에 고르는 것
      visibility: 'public',
      author_id: admin.authorId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * 노트 창고에서 여러 개를 한 번에 처리한다.
 *   action='publish'   공개하기
 *   action='unpublish' 다시 비공개로
 *   action='topic'     주제 바꾸기 (topic 이 빈 값이면 '분류 전'으로 되돌림)
 */
export async function PATCH(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids, action, topic } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: '고른 글이 없습니다.' }, { status: 400 })
  }

  let patch: Record<string, unknown>
  if (action === 'publish') patch = { published: true }
  else if (action === 'unpublish') patch = { published: false }
  else if (action === 'topic') patch = { topic: topic || null }
  else return NextResponse.json({ error: '알 수 없는 동작입니다.' }, { status: 400 })

  const { error } = await supabaseAdmin.from('posts').update(patch).in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePublicPages()
  return NextResponse.json({ ok: true, count: ids.length })
}

/** 메모 삭제 (노트 창고에서 여러 개 선택) */
export async function DELETE(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: '고른 글이 없습니다.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('posts').delete().in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePublicPages()
  return NextResponse.json({ ok: true, count: ids.length })
}
