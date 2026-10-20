import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/lib/auth'
import { requireApiAdmin } from '@/lib/dal'
import { NextResponse } from 'next/server'

/**
 * 빠른 메모 — 제목 없이 본문만. 이 작업실의 글은 전부 비공개다.
 * 메모는 기존 posts 테이블(kind='note')에 그대로 쌓는다. 공개 여부는 늘 false.
 */
export async function POST(req: Request) {
  const denied = await requireApiAdmin()
  if (denied) return denied

  const { content } = await req.json()
  const body = String(content || '').trim()
  if (!body) return NextResponse.json({ error: '내용이 비어 있습니다.' }, { status: 400 })

  // 작성자 표시용 프로필 id (로그인할 때 만들어 둔다)
  const session = await auth()
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id').eq('email', session!.user.email!.toLowerCase()).maybeSingle()
  if (!profile?.id) {
    return NextResponse.json({ error: '프로필을 찾지 못했습니다. 다시 로그인해 주세요.' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      title: '',              // 메모는 제목이 없다
      content: body,
      kind: 'note',
      topic: null,
      published: false,       // 공개 화면이 없다. 늘 비공개.
      visibility: 'public',
      author_id: profile.id,
    })
    .select('id, content, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** 메모 지우기 — 메모 종류(kind='note')만 지운다. */
export async function DELETE(req: Request) {
  const denied = await requireApiAdmin()
  if (denied) return denied

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: '고른 메모가 없습니다.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('posts').delete().in('id', ids).eq('kind', 'note')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, count: ids.length })
}
