import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 작성자 본인 또는 관리자만 수정 가능
  if (session.user?.role !== 'admin') {
    const { data: existing } = await supabaseAdmin
      .from('posts').select('author_id').eq('id', id).single()
    if (!existing || existing.author_id !== session.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('posts')
    .update({
      title: body.title,
      content: body.content,
      category: body.category,
      visibility: body.visibility,
      excerpt: body.excerpt,
      tags: body.tags,
      thumbnail_url: body.thumbnail_url,
      published: body.published,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[PATCH posts] error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
