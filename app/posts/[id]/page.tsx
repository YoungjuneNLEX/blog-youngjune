import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  const { data: post } = await supabaseAdmin
    .from('posts')
    .select('*, author:profiles(name)')
    .eq('id', id)
    .eq('published', true)
    .single()

  if (!post) notFound()
  if (post.visibility === 'members' && !session) redirect('/')

  // 같은 책(첫 태그) 내 이전글/다음글
  const bookTag = post.tags?.[0]
  let prev = null, next = null

  if (bookTag) {
    const { data: siblings } = await supabaseAdmin
      .from('posts')
      .select('id, title, created_at')
      .eq('published', true)
      .contains('tags', [bookTag])
      .order('created_at', { ascending: true })

    if (siblings) {
      const idx = siblings.findIndex(p => p.id === id)
      if (idx > 0) prev = siblings[idx - 1]
      if (idx < siblings.length - 1) next = siblings[idx + 1]
    }
  }

  return (
    <div className="article-page">

      {/* 뒤로가기 */}
      <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}
        className="hover:opacity-70 transition inline-flex items-center gap-1 mb-10">
        ← 책방으로
      </Link>

      <article>
        {/* 태그/카테고리 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {post.category && (
            <span style={{ fontSize: '0.72rem', color: 'var(--accent)', background: '#f5ebe0',
              padding: '2px 10px', borderRadius: '999px', fontWeight: 600 }}>
              {post.category}
            </span>
          )}
          {post.tags?.[0] && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg)',
              padding: '2px 10px', borderRadius: '999px', border: '1px solid var(--border)' }}>
              {post.tags[0]}
            </span>
          )}
          {post.visibility === 'members' && (
            <span style={{ fontSize: '0.72rem', color: '#b45309', background: '#fef3c7',
              padding: '2px 10px', borderRadius: '999px', fontWeight: 600 }}>
              회원공개
            </span>
          )}
        </div>

        {/* 제목 */}
        <h1 style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: '2rem',
          lineHeight: 1.35, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
          {post.title}
        </h1>

        {/* 작성자·날짜 */}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '2.5rem',
          paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
          {post.author?.name} · {new Date(post.created_at).toLocaleDateString('ko-KR')}
        </p>

        {/* 썸네일 */}
        {post.thumbnail_url && (
          <img src={post.thumbnail_url} alt={post.title}
            style={{ width: '100%', borderRadius: '12px', marginBottom: '2.5rem', display: 'block' }} />
        )}

        {/* 본문 */}
        <div className="tiptap-view"
          style={{ color: 'var(--text-main)', lineHeight: 2.0, fontSize: '1.05rem' }}
          dangerouslySetInnerHTML={{ __html: post.content || '' }} />
      </article>

      {/* 이전글/다음글 */}
      {(prev || next) && (
        <div className="mt-8 grid grid-cols-2 gap-4">
          {prev ? (
            <Link href={`/posts/${prev.id}`}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '1rem' }}
              className="hover:shadow-sm transition-shadow">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '4px' }}>← 이전 글</p>
              <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}
                className="line-clamp-2">{prev.title}</p>
            </Link>
          ) : <div />}

          {next && (
            <Link href={`/posts/${next.id}`}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '1rem', textAlign: 'right' }}
              className="hover:shadow-sm transition-shadow">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '4px' }}>다음 글 →</p>
              <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}
                className="line-clamp-2">{next.title}</p>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
