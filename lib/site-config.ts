// 클라이언트/서버 양쪽에서 안전하게 쓸 수 있는 순수 설정 (supabase 의존성 없음)

// 적바림 주제 — 글과 메모를 묶는 분류.
// 표지 이미지가 없는 글은 이 색 위에 제목을 찍어 표지를 만든다.
export interface Topic {
  id: string     // 이름이 바뀌어도 같은 주제임을 알아보는 열쇠
  name: string   // 저장되는 이름. 노트 창고와 posts.topic 이 쓴다.
  short: string  // 홈 상단 칩처럼 좁은 자리에 쓰는 짧은 이름
  color: string  // 표지 바탕색 (파스텔)
  ink: string    // 그 바탕 위에 얹는 글자색
}

// 색은 C안 시안(docs/design/README.md)의 바탕/글자 짝 그대로.
export const DEFAULT_TOPICS: Topic[] = [
  { id: '생각',           name: '생각',           short: '생각', color: '#ebe6f5', ink: '#3e3458' },
  { id: '일하며 배운 것', name: '일하며 배운 것', short: '일',   color: '#dfeaf5', ink: '#22364d' },
  { id: '오늘의 배움',    name: '오늘의 배움',    short: '배움', color: '#e2f0e5', ink: '#24402c' },
  { id: '말씀 묵상',      name: '말씀 묵상',      short: '묵상', color: '#f5ecdc', ink: '#4d3b1d' },
  { id: '독서',           name: '독서',           short: '독서', color: '#f6e2dc', ink: '#55302a' },
  { id: '상상',           name: '상상',           short: '상상', color: '#f3e3ee', ink: '#4a2c40' },
]

// 설정에 없는 주제·분류 전 글에 쓰는 무채색 짝
export const NEUTRAL_TOPIC = { color: '#e9e7e2', ink: '#3f3f3d' }

/** 서재 주인 */
export interface Profile {
  name: string      // 닉네임
  bio: string       // 한 줄 소개
  avatarUrl: string // 사진 (비우면 이름 첫 글자를 대신 보여준다)
  coverUrl: string  // 홈 맨 위 커버 이미지 (비우면 옅은 단색)
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
  accentLight: '강조색(옅은 면)',
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

// C안 시안 README 의 색 정의와 1:1
export const DEFAULT_THEME: ThemeColors = {
  bg: '#ffffff',
  bgCard: '#ffffff',
  bgHeader: '#ffffff',
  textMain: '#1f1f1f',
  textSub: '#5f5f5f',     // 보조
  textMuted: '#767676',   // 흐린 글자
  accent: '#4f7a62',      // 버튼 강조
  accentLight: '#e6efe9', // 강조색 옅은 면 (커버 기본 바탕)
  border: '#ececea',
  borderSoft: '#f6f6f4',
}

/**
 * "C안 색으로 되돌리기" — 색만 되돌린다.
 * 주제의 이름·짧은 이름·순서와 문구·프로필·템플릿은 건드리지 않는다.
 * 기본 목록에 없는 주제는 무채색 짝으로 둔다.
 */
export function resetColors(config: SiteConfig): SiteConfig {
  return {
    ...config,
    theme: DEFAULT_THEME,
    topics: config.topics.map(t => {
      const base = DEFAULT_TOPICS.find(d => d.id === t.id || d.name === t.name)
      return { ...t, color: base?.color || NEUTRAL_TOPIC.color, ink: base?.ink || NEUTRAL_TOPIC.ink }
    }),
  }
}

export const DEFAULT_PROFILE: Profile = {
  name: '박영준',
  bio: '생각을 적고, 적은 것을 열어 둡니다',
  avatarUrl: '',
  coverUrl: '',
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

/** 바탕색이 밝으면 짙은 글자, 어두우면 밝은 글자. 옛 설정을 옮길 때만 쓴다. */
function readableInk(bg: string): string {
  const h = bg.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (full.length !== 6) return NEUTRAL_TOPIC.ink
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.45 ? '#1f1f1f' : '#ffffff'
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
      color: text(t.color, NEUTRAL_TOPIC.color),
      // 옛 설정에는 글자색이 없다. 그때는 바탕 밝기로 읽히는 색을 고른다.
      ink: text(t.ink, readableInk(text(t.color, NEUTRAL_TOPIC.color))),
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
      // 사진·커버는 비워 둘 수 있다
      avatarUrl: typeof rawProfile.avatarUrl === 'string' ? rawProfile.avatarUrl : '',
      coverUrl: typeof rawProfile.coverUrl === 'string' ? rawProfile.coverUrl : '',
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
