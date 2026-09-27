import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { revalidatePublicPages } from '@/lib/revalidate'

export async function POST(req: Request) {
  // 책 정보 수정은 관리자만
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, cover_url, genre, description } = await req.json()

  const { error } = await supabaseAdmin
    .from('books')
    .upsert({ title, cover_url, genre, description }, { onConflict: 'title' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePublicPages()
  return NextResponse.json({ ok: true })
}
