// 클라이언트/서버 양쪽에서 안전하게 쓸 수 있는 순수 설정 (supabase 의존성 없음)

// 적바림 주제 — 글과 메모를 묶는 분류.
// 표지 이미지가 없는 글은 이 색 위에 제목을 찍어 표지를 만든다.
export interface Topic {
  id: string     // 이름이 바뀌어도 같은 주제임을 알아보는 열쇠
  name: string   // 저장되는 이름. 노트 창고와 posts.topic 이 쓴다.
  short: string  // 홈 상단 칩처럼 좁은 자리에 쓰는 짧은 이름
  color: string  // 표지 배경색
}

// 색은 시안(docs/design) 기준. 일·독서·상상은 시안에 있던 값 그대로.
export const DEFAULT_TOPICS: Topic[] = [
  { id: '생각',           name: '생각',           short: '생각', color: '#4a3728' },
  { id: '일하며 배운 것', name: '일하며 배운 것', short: '일',   color: '#3d2a1c' },
  { id: '오늘의 배움',    name: '오늘의 배움',    short: '배움', color: '#8b6f4e' },
  { id: '말씀 묵상',      name: '말씀 묵상',      short: '묵상', color: '#6b5b7a' },
  { id: '독서',           name: '독서',           short: '독서', color: '#e9dcc8' },
  { id: '상상',           name: '상상',           short: '상상', color: '#5a6b55' },
]

/** 서재 주인 */
export interface Profile {
  name: string      // 닉네임
  bio: string       // 한 줄 소개
  avatarUrl: string // 사진 (비우면 안 보임)
}

// 테마(스킨) 색상 — globals.css 의 CSS 변수와 1:1 대응
export interface ThemeColors {
  bg: string
  bgCard: string
  bgHeader: string
  textMain: string
  textSub: string
  textMuted: string
  accent: string
  accentLight: string
  border: string
  borderSoft: string
}

// 테마 색상 항목의 한글 라벨 (관리자 UI 용)
export const THEME_FIELD_LABELS: Record<keyof ThemeColors, string> = {
  bg: '배경',
  bgCard: '카드 배경',
  bgHeader: '머리글 배경',
  textMain: '본문 글자',
  textSub: '보조 글자',
  textMuted: '흐린 글자',
  accent: '강조색',
  accentLight: '강조색(밝게)',
  border: '괘선',
  borderSoft: '괘선(연하게)',
}

export interface SiteConfig {
  siteName: string       // 제호
  heroTitle: string      // 한 줄 소개 (브라우저 설명문에 쓰인다)
  latestTitle: string    // 최근 글 섹션 제목
  bookshelfTitle: string // 책장 섹션 제목
  footerName: string     // 푸터에 표시되는 이름
  footerNote: string     // 푸터 한 줄
  profile: Profile
  topics: Topic[]
  showShortNotes: boolean // 홈에 짧은 노트 보이기
  showBookshelf: boolean  // 홈에 책장 보이기
  theme: ThemeColors
}

// 시안 README 의 색 정의와 1:1
export const DEFAULT_THEME: ThemeColors = {
  bg: '#faf6f0',
  bgCard: '#fffdf9',
  bgHeader: '#fffdf9',
  textMain: '#2c1a0e',
  textSub: '#6b4f3a',     // 보조
  textMuted: '#8a6f58',   // 흐린 글자
  accent: '#8b5e3c',
  accentLight: '#c4956a',
  border: '#e8ddd0',
  borderSoft: '#f0e8de',
}

export const DEFAULT_PROFILE: Profile = {
  name: '박영준',
  bio: '법과 일상 사이에서 보고 들은 것을 적어 둡니다.',
  avatarUrl: '',
}

export const DEFAULT_CONFIG: SiteConfig = {
  siteName: '적바림',
  heroTitle: '적어 두면 남는다',
  latestTitle: '최근 글',
  bookshelfTitle: '책장',
  footerName: '적바림',
  footerNote: '나중에 참고하려고 간단히 글로 적어 둠.',
  profile: DEFAULT_PROFILE,
  topics: DEFAULT_TOPICS,
  showShortNotes: true,
  showBookshelf: true,
  theme: DEFAULT_THEME,
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * 부분 저장이나 옛 설정이 와도 안전하게 채운다.
 * 옛 항목(siteEyebrow·heroImage·sectionOrder 등)은 여기서 조용히 걸러진다.
 */
export function mergeConfig(partial: Partial<SiteConfig> | null | undefined): SiteConfig {
  const p = (partial || {}) as Record<string, unknown>

  // 이름이 있는 주제만 남긴다. 하나도 없으면 기본 목록으로 되돌린다.
  const rawTopics = Array.isArray(p.topics) ? (p.topics as Partial<Topic>[]) : []
  const topics: Topic[] = rawTopics
    .filter(t => !!t && typeof t.name === 'string' && t.name.trim() !== '')
    .map(t => ({
      // 옛 설정에는 id 가 없다. 그때는 이름을 열쇠로 삼는다.
      id: text(t.id, t.name!.trim()),
      name: t.name!.trim(),
      short: text(t.short, t.name!.trim()),
      color: text(t.color, '#8b5e3c'),
    }))

  const rawProfile = (p.profile || {}) as Partial<Profile>

  return {
    siteName: text(p.siteName, DEFAULT_CONFIG.siteName),
    heroTitle: text(p.heroTitle, DEFAULT_CONFIG.heroTitle),
    latestTitle: text(p.latestTitle, DEFAULT_CONFIG.latestTitle),
    bookshelfTitle: text(p.bookshelfTitle, DEFAULT_CONFIG.bookshelfTitle),
    footerName: text(p.footerName, DEFAULT_CONFIG.footerName),
    footerNote: text(p.footerNote, DEFAULT_CONFIG.footerNote),
    profile: {
      name: text(rawProfile.name, DEFAULT_PROFILE.name),
      bio: text(rawProfile.bio, DEFAULT_PROFILE.bio),
      // 사진은 비워 둘 수 있다
      avatarUrl: typeof rawProfile.avatarUrl === 'string' ? rawProfile.avatarUrl : '',
    },
    topics: topics.length > 0 ? topics : DEFAULT_TOPICS,
    showShortNotes: bool(p.showShortNotes, true),
    showBookshelf: bool(p.showBookshelf, true),
    theme: { ...DEFAULT_THEME, ...((p.theme || {}) as Partial<ThemeColors>) },
  }
}

// 테마 색상을 CSS 변수 객체로 변환 (body inline style 주입용)
export function themeToCssVars(theme: ThemeColors): Record<string, string> {
  return {
    '--bg': theme.bg,
    '--bg-card': theme.bgCard,
    '--bg-header': theme.bgHeader,
    '--text-main': theme.textMain,
    '--text-sub': theme.textSub,
    '--text-muted': theme.textMuted,
    '--accent': theme.accent,
    '--accent-light': theme.accentLight,
    '--border': theme.border,
    '--border-soft': theme.borderSoft,
  }
}
