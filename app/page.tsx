import Link from 'next/link'
import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { coverImage, toPlainText } from '@/lib/cover'
import { shortDate, toStoryCard, StoryCard } from '@/lib/public'
import { loadSourceNotes } from '@/lib/source-notes'
import HomeStories from '@/components/HomeStories'
import BookShelf, { ShelfBook } from '@/components/BookShelf'

// 공개 페이지는 캐시해 두고 5분마다 다시 만든다.
// 글·설정을 바꾸면 API 가 revalidatePath 로 즉시 새로 만든다.
// DB 가 잠시 멈추면 재검증이 실패하고 마지막으로 성공한 페이지가 계속 보인다.
export const revalidate = 300

const PUBLIC = { published: true, visibility: 'public' }

export default async function HomePage() {
  const config = await getSiteConfig()

  // 긴 글 — 대표 글 1편 + 가로로 넘길 카드들
  const { data: articles, error: articleError } = await supabaseAdmin
    .from('posts')
    .select('id, title, topic, content, thumbnail_url, excerpt, summary, created_at, tags, source_note_ids')
    .match(PUBLIC).eq('kind', 'article')
    .order('created_at', { ascending: false })
    .limit(5)
  assertDbOk(articleError, '홈/긴 글')

  // 짧은 노트 — 공개한 메모를 본문 그대로
  const { data: notes, error: noteError } = await supabaseAdmin
    .from('posts')
    .select('id, content, topic, created_at')
    .match(PUBLIC).eq('kind', 'note')
    .order('created_at', { ascending: false })
    .limit(3)
  assertDbOk(noteError, '홈/짧은 노트')

  // 책장 — 독후감을 쓴 책. 표지·소개는 books 테이블에서 보탠다.
  const { data: bookRows, error: bookError } = await supabaseAdmin
    .from('books').select('title, cover_url')
  assertDbOk(bookError, '홈/책')

  // 요약 창의 "이 글이 나온 메모" — 공개한 메모만 읽어 온다
  const sourceNotes = await loadSourceNotes(articles || [], '홈/나온 메모')

  const cards: StoryCard[] = (articles || []).map(p => toStoryCard(p, coverImage(p), sourceNotes))

  const bookCover = new Map((bookRows || []).map(b => [b.title as string, b.cover_url as string | null]))
  const grouped = new Map<string, ShelfBook>()
  for (const p of articles || []) {
    if (p.topic !== '독서') continue
    const name = p.tags?.[0]
    if (!name) continue
    if (!grouped.has(name)) {
      grouped.set(name, { title: name, cover: bookCover.get(name) || null, items: [] })
    }
    grouped.get(name)!.items.push({
      id: p.id, title: p.title, dateText: shortDate(p.created_at),
    })
  }
  const books = Array.from(grouped.values())

  const shortLabel = (topic: string | null) =>
    config.topics.find(t => t.name === topic)?.short || topic || '분류 전'

  return (
    <div>
      <HomeStories title={config.latestTitle} cards={cards} topics={config.topics} />

      <div className="wrap home-below" style={{ paddingTop: '36px' }}>
        {/* 짧은 노트 — 표지 없이 본문 그대로. 설정에서 끌 수 있다. */}
        {config.showShortNotes && (
        <section>
          <h2 className="sec-title" style={{ marginBottom: '4px' }}>짧은 노트</h2>
          {(notes || []).length === 0 ? (
            <p className="meta-sub" style={{ padding: '20px 0' }}>아직 공개한 메모가 없습니다.</p>
          ) : (
            (notes || []).map(n => (
              <Link key={n.id} href={`/posts/${n.id}`} className="note-item">
                <span className="meta">{shortDate(n.created_at)} · {shortLabel(n.topic)}</span>
                <p className="note-text">{toPlainText(n.content)}</p>
              </Link>
            ))
          )}
        </section>
        )}

        {config.showBookshelf && (
          <BookShelf title={config.bookshelfTitle} books={books} topics={config.topics} />
        )}
      </div>
    </div>
  )
}
