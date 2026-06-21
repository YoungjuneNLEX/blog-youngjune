import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getSiteConfig, mergeConfig } from '@/lib/settings'
import { NextResponse } from 'next/server'

export async function GET() {
  const config = await getSiteConfig()
  return NextResponse.json(config)
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const config = mergeConfig(body)

  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert({ key: 'site_config', value: JSON.stringify(config) }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, config })
}
