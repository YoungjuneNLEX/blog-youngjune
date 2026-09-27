import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { coverImage, excerptOf, toPlainText, topicSlug } from '@/lib/cover'
import { readingMinutes, shortDate, summaryLines } from '@/lib/public'
import PostActions from '@/components/PostActions'

export const revalidate = 300

type Props = { params: Promise<{ id: string }> }

async function getPost(id: string) {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*, author:profiles(name)')
    .eq('id', id).eq('published', true).eq('visibility', 'public')
    .maybeSingle()
  assertDbOk(error, '글 상세')
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)
  if (!post) return { title: '찾을 수 없는 글' }
  return {
    title: post.title || '적바림',
    description: summaryLines(post.summary)[0] || excerptOf(post, 140),
  }
}

/**
 * 공개한 글을 미리 만들어 둔다.
 * 캐시에 남아 있어야 DB 가 잠시 멈춰도 계속 읽을 수 있다.
 * 목록에 없는 새 글은 첫 요청 때 만들어져 캐시된다.
 */
export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from('posts').select('id').eq('published', true).eq('visibility', 'public')
  return (data || []).map(p => ({ id: p.id as string }))
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()

  const config = await getSiteConfig()
  const isNote = post.kind === 'note'
  const label = config.topics.find(t => t.name === post.topic)?.short || post.topic || '적바림'
  const image = coverImage(post)

  // 같은 주제의 앞뒤 글
  const { data: siblings } = post.topic
    ? await supabaseAdmin
        .from('posts').select('id, title, kind')
        .eq('published', true).eq('visibility', 'public').eq('topic', post.topic)
        .order('created_at', { ascending: true })
    : { data: null }

  const idx = siblings?.findIndex(s => s.id === id) ?? -1
  const prev = idx > 0 ? siblings![idx - 1] : null
  const next = idx >= 0 && siblings && idx < siblings.length - 1 ? siblings[idx + 1] : null

  return (
    <div className="article-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <Link href={post.topic ? `/topics/${topicSlug(post.topic)}` : '/'} className="meta-sub">
          ← {post.topic || '적바림'}
        </Link>
        <PostActions postId={post.id} title={post.title || '적바림'} authorId={post.author_id} />
      </div>

      <article>
        {isNote ? (
          /* 메모 — 제목도 표지도 없다. 본문만 그대로. */
          <>
            <p className="meta" style={{ marginBottom: '16px' }}>
              {shortDate(post.created_at)} · {label}
            </p>
            <div className="tiptap-view" style={{ whiteSpace: 'pre-wrap' }}>
              {toPlainText(post.content)}
            </div>
          </>
        ) : (
          <>
            <p className="label" style={{ color: 'var(--text-sub)', marginBottom: '10px' }}>{label}</p>
            <h1 className="serif"
              style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.4, margin: '0 0 12px' }}>
              {post.title}
            </h1>
            <p className="meta-sub" style={{ marginBottom: '24px' }}>
              {post.author?.name || '적바림'} · {readingMinutes(post.content)}분 · {shortDate(post.created_at)}
            </p>

            {/* 저장된 세 줄 요약이 있으면 본문 앞에 얹는다 */}
            {summaryLines(post.summary).length > 0 && (
              <div className="summary-box" style={{ marginBottom: '28px' }}>
                <span className="label" style={{ color: 'var(--text-sub)' }}>세 줄 요약 · AI 작성</span>
                <ol>{summaryLines(post.summary).map((l, i) => <li key={i}>{l}</li>)}</ol>
              </div>
            )}

            {image && (
              <img src={image} alt="" style={{ width: '100%', borderRadius: '8px', marginBottom: '28px' }} />
            )}

            <div className="tiptap-view" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
          </>
        )}
      </article>

      {(prev || next) && (
        <nav style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '48px' }}>
          {prev ? (
            <Link href={`/posts/${prev.id}`}
              style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
              <span className="meta">← 이전</span>
              <p className="serif" style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0 0' }}>
                {prev.title || '메모'}
              </p>
            </Link>
          ) : <span />}
          {next && (
            <Link href={`/posts/${next.id}`}
              style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', textAlign: 'right' }}>
              <span className="meta">다음 →</span>
              <p className="serif" style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0 0' }}>
                {next.title || '메모'}
              </p>
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
