import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { revalidatePublicPages } from '@/lib/revalidate'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user?.role
  if (role !== 'admin' && role !== 'writer') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, content, category, visibility, published, tags, thumbnail_url, excerpt, topic, summary } = await req.json()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', session.user?.email!)
    .single()

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      title, content, category, visibility, published, tags, thumbnail_url, excerpt,
      topic: topic || null,
      summary: summary || null,
      kind: 'article',   // 긴 글. 메모는 /api/notes 로 들어온다
      author_id: profile?.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePublicPages()
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const role = session.user?.role

  if (role === 'admin') {
    await supabaseAdmin.from('posts').delete().eq('id', id)
  } else {
    // 작가는 자신의 글만 삭제
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('id').eq('email', session.user?.email!).single()
    await supabaseAdmin.from('posts').delete().eq('id', id).eq('author_id', profile?.id)
  }

  revalidatePublicPages()
  return NextResponse.json({ ok: true })
}
