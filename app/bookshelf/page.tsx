import type { Metadata } from 'next'
import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { shortDate } from '@/lib/public'
import BookShelf, { ShelfBook } from '@/components/BookShelf'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  return { title: config.bookshelfTitle }
}

const PUBLIC = { published: true, visibility: 'public' }

/** 책장 — 독후감을 쓴 책의 표지. 예전에는 홈 아래에 있던 것을 한 쪽으로 옮겼다. */
export default async function BookshelfPage() {
  const config = await getSiteConfig()

  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, tags, created_at')
    .match(PUBLIC).eq('kind', 'article').eq('topic', '독서')
    .order('created_at', { ascending: false })
  assertDbOk(error, '책장/글')

  const { data: bookRows, error: bookError } = await supabaseAdmin
    .from('books').select('title, cover_url')
  assertDbOk(bookError, '책장/책')

  // 글의 첫 태그를 책 이름으로 보고 묶는다 (지금까지 쓰던 방식 그대로)
  const cover = new Map((bookRows || []).map(b => [b.title as string, b.cover_url as string | null]))
  const grouped = new Map<string, ShelfBook>()
  for (const p of posts || []) {
    const name = p.tags?.[0]
    if (!name) continue
    if (!grouped.has(name)) {
      grouped.set(name, { title: name, cover: cover.get(name) || null, items: [] })
    }
    grouped.get(name)!.items.push({ id: p.id, title: p.title, dateText: shortDate(p.created_at) })
  }
  const books = Array.from(grouped.values())

  return (
    <div className="wrap" style={{ paddingTop: '24px', paddingBottom: '48px' }}>
      {books.length === 0 ? (
        <>
          <h1 className="sec-title">{config.bookshelfTitle}</h1>
          <p className="meta-sub" style={{ marginTop: '12px' }}>아직 꽂힌 책이 없습니다.</p>
        </>
      ) : (
        <BookShelf title={config.bookshelfTitle} books={books} topics={config.topics} />
      )}
    </div>
  )
}
