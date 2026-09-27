import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { parseTemplates } from '@/lib/templates'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KEY = 'templates'

/** 템플릿 목록. site_settings 한 줄에 JSON 배열로 담는다. */
export async function GET() {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data } = await supabaseAdmin
    .from('site_settings').select('value').eq('key', KEY).maybeSingle()

  return NextResponse.json({ templates: parseTemplates(data?.value) })
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const templates = parseTemplates(body.templates)

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ key: KEY, value: JSON.stringify(templates) }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, templates })
}
