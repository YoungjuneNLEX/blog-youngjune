import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PostActions from '@/components/PostActions'

// 홈과 같은 규칙. 캐시해 두고 5분마다, 글이 바뀌면 즉시 다시 만든다.
export const revalidate = 300

/**
 * 공개된 글을 빌드 때 미리 만들어 둔다.
 * 이래야 각 글 페이지도 캐시에 남아, DB 가 잠시 멈춰도 계속 읽을 수 있다.
 * 목록에 없는 새 글은 첫 요청 때 만들어져 캐시된다. (dynamicParams 기본값)
 * 빌드 환경에 DB 자격증명이 없으면 빈 목록으로 두고 넘어간다.
 */
export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from('posts')
    .select('id')
    .eq('published', true)
    .eq('visibility', 'public')

  return (data || []).map(p => ({ id: p.id as string }))
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 캐시되는 페이지라 로그인 여부를 알 수 없다. 공개된 글만 싣는다.
  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .select('*, author:profiles(name)')
    .eq('id', id)
    .eq('published', true)
    .eq('visibility', 'public')
    .maybeSingle()

  assertDbOk(error, '글 상세')
  if (!post) notFound()

  // 같은 책(첫 태그) 내 이전글/다음글
  const bookTag = post.tags?.[0]
  let prev = null, next = null

  if (bookTag) {
    const { data: siblings, error: siblingError } = await supabaseAdmin
      .from('posts')
      .select('id, title, created_at')
      .eq('published', true)
      .eq('visibility', 'public')
      .contains('tags', [bookTag])
      .order('created_at', { ascending: true })
    assertDbOk(siblingError, '글 상세/앞뒤글')

    if (siblings) {
      const idx = siblings.findIndex(p => p.id === id)
      if (idx > 0) prev = siblings[idx - 1]
      if (idx < siblings.length - 1) next = siblings[idx + 1]
    }
  }

  return (
    <div className="article-page">

      {/* 상단: 뒤로가기 + 액션(공유·수정·삭제) */}
      <div className="flex items-center justify-between gap-3 mb-10 flex-wrap">
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}
          className="hover:opacity-70 transition inline-flex items-center gap-1">
          ← 책방으로
        </Link>
        <PostActions postId={post.id} title={post.title} authorId={post.author_id} />
      </div>

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
