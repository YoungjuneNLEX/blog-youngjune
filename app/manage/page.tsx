import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ManageClient from '@/components/ManageClient'

export default async function ManagePage() {
  const session = await auth()
  if (!session) redirect('/')

  const role = session.user?.role
  const isAdmin = role === 'admin'

  let query = supabaseAdmin
    .from('posts')
    .select('*, author:profiles(name)')
    .order('created_at', { ascending: false })

  // 작가는 자신의 글만, 관리자는 전체
  if (!isAdmin) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', session.user?.email!)
      .single()

    if (profile) query = query.eq('author_id', profile.id)
  }

  const { data: posts } = await query

  return (
    <div className="article-page">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          서재관리
        </h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin"
              style={{ fontSize: '0.85rem', border: '1px solid var(--border)', borderRadius: '8px',
                padding: '8px 14px', background: 'var(--bg-card)', color: 'var(--text-sub)' }}
              className="hover:opacity-80 transition">회원 관리</Link>
          )}
          <Link href="/write"
            style={{ fontSize: '0.85rem', fontWeight: 600, background: 'var(--accent)', color: '#fff',
              borderRadius: '8px', padding: '8px 16px' }}
            className="hover:opacity-80 transition">+ 새 글</Link>
        </div>
      </div>

      <ManageClient posts={posts || []} isAdmin={isAdmin} />
    </div>
  )
}
