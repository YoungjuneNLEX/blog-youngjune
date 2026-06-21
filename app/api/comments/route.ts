import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// 글의 댓글 목록 (누구나 조회 가능)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('post_id')
  if (!postId) return NextResponse.json({ comments: [] })

  const { data, error } = await supabaseAdmin
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  // 테이블이 아직 없거나 조회 실패 시 빈 목록으로 안전하게 처리
  if (error) return NextResponse.json({ comments: [], error: error.message })
  return NextResponse.json({ comments: data || [] })
}

// 댓글 작성 (로그인한 사용자 누구나)
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { post_id, content } = await req.json()
  const trimmed = (content || '').trim()
  if (!post_id || !trimmed) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
  }
  if (trimmed.length > 2000) {
    return NextResponse.json({ error: '댓글이 너무 깁니다.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({
      post_id,
      author_id: session.user.id,
      author_name: session.user.name,
      author_avatar: session.user.image,
      content: trimmed,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 댓글 삭제 (본인 댓글 또는 관리자)
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  let query = supabaseAdmin.from('comments').delete().eq('id', id)
  // 관리자가 아니면 본인 댓글만 삭제 가능
  if (session.user.role !== 'admin') {
    query = query.eq('author_id', session.user.id)
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
