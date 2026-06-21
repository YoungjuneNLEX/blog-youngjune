import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import PostSlider from '@/components/PostSlider'
import BookShelf from '@/components/BookShelf'
import SNSSection from '@/components/SNSSection'
import { getSiteConfig, SectionId } from '@/lib/settings'

export default async function HomePage() {
  const session = await auth()
  const isLoggedIn = !!session
  const config = await getSiteConfig()

  // 최신 글 5개 (슬라이더)
  let sliderQuery = supabaseAdmin
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!isLoggedIn) sliderQuery = sliderQuery.eq('visibility', 'public')
  const { data: latestPosts } = await sliderQuery

  // 책장용: 전체 발행 글
  let allQuery = supabaseAdmin
    .from('posts')
    .select('id, title, tags, category, thumbnail_url, excerpt, content, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (!isLoggedIn) allQuery = allQuery.eq('visibility', 'public')
  const { data: allPosts } = await allQuery

  // books 테이블
  const { data: booksData } = await supabaseAdmin.from('books').select('*')

  // 태그[0] 기준으로 책 그룹핑
  const postsByBook: Record<string, any[]> = {}
  for (const post of allPosts || []) {
    const bookTitle = post.tags?.[0]
    if (!bookTitle) continue
    if (!postsByBook[bookTitle]) postsByBook[bookTitle] = []
    postsByBook[bookTitle].push(post)
  }

  // 책 목록 생성 (books 테이블 + 글에서 자동 추출)
  const bookMap: Record<string, any> = {}
  for (const b of booksData || []) bookMap[b.title] = b

  const books = Object.keys(postsByBook).map(title => ({
    title,
    cover_url: bookMap[title]?.cover_url || postsByBook[title][0]?.thumbnail_url || null,
    genre: bookMap[title]?.genre || postsByBook[title][0]?.category || null,
    description: bookMap[title]?.description || null,
    postCount: postsByBook[title].length,
  }))

  // 관리자 설정에 따라 섹션을 순서대로 렌더링 (숨긴 섹션 제외)
  const sectionNodes: Record<SectionId, React.ReactNode> = {
    latest: (
      <div className="home-section" key="latest">
        <PostSlider posts={latestPosts || []} title={config.latestTitle} />
      </div>
    ),
    bookshelf: (
      <div className="home-section" key="bookshelf">
        <BookShelf books={books} postsByBook={postsByBook} title={config.bookshelfTitle} />
      </div>
    ),
    sns: <SNSSection key="sns" />,
  }

  const visibleSections = config.sectionOrder.filter(s => !config.hiddenSections.includes(s))

  return (
    <div>
      {/* 히어로 */}
      <div className="relative overflow-hidden"
        style={{ height: '340px' }}>
        <img src={config.heroImage} alt={config.heroTitle}
          className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--bg) 0%, transparent) 30%, color-mix(in srgb, var(--bg) 70%, transparent) 70%, var(--bg) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 px-10 pb-6">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.15em' }}
            className="uppercase mb-1">{config.siteEyebrow}</p>
          <h1 style={{ color: 'var(--text-main)', fontSize: '2rem', fontWeight: 800,
            letterSpacing: '-0.03em', lineHeight: 1.2 }}>{config.heroTitle}</h1>
        </div>
      </div>

      {/* 콘텐츠 (관리자 설정 순서대로) */}
      {visibleSections.map(s => sectionNodes[s])}
    </div>
  )
}
