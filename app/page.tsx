import { supabaseAdmin, assertDbOk } from '@/lib/supabase'
import { getSiteConfig } from '@/lib/settings'
import { toFeed } from '@/lib/feed'
import { loadSourceNotes } from '@/lib/source-notes'
import HomeCover from '@/components/HomeCover'
import PostBrowser from '@/components/PostBrowser'

// 공개 페이지는 캐시해 두고 5분마다 다시 만든다.
// 글·설정을 바꾸면 API 가 revalidatePath 로 즉시 새로 만든다.
// DB 가 잠시 멈추면 재검증이 실패하고 마지막으로 성공한 페이지가 계속 보인다.
export const revalidate = 300

const PUBLIC = { published: true, visibility: 'public' }

// 한 번에 받아 두고 브라우저에서 탭·주제로 거른다
const LIMIT = 60

export default async function HomePage() {
  const config = await getSiteConfig()

  const { data: rows, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, kind, topic, content, thumbnail_url, excerpt, summary, created_at, source_note_ids')
    .match(PUBLIC)
    .order('created_at', { ascending: false })
    .limit(LIMIT)
  assertDbOk(error, '홈/글 목록')

  // 커버에 적는 편 수는 목록 개수가 아니라 전체 개수다
  const { count: articleCount, error: aErr } = await supabaseAdmin
    .from('posts').select('id', { count: 'exact', head: true })
    .match(PUBLIC).eq('kind', 'article')
  assertDbOk(aErr, '홈/글 수')

  const { count: noteCount, error: nErr } = await supabaseAdmin
    .from('posts').select('id', { count: 'exact', head: true })
    .match(PUBLIC).eq('kind', 'note')
  assertDbOk(nErr, '홈/메모 수')

  // 요약 창의 "이 글이 나온 메모" — 공개한 메모만 읽어 온다
  const sourceNotes = await loadSourceNotes(rows || [], '홈/나온 메모')
  const entries = toFeed(rows || [], config.topics, sourceNotes)

  return (
    <div>
      {/* 커버 + 서재 주인 (설정의 '서재 주인'을 그대로 쓴다) */}
      <HomeCover siteName={config.siteName} profile={config.profile}
        articleCount={articleCount ?? 0} noteCount={noteCount ?? 0} />

      <PostBrowser entries={entries} topics={config.topics}
        showTabs={config.showShortNotes} notePreview={2} />
    </div>
  )
}
