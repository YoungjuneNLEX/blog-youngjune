// 클라이언트/서버 양쪽에서 안전하게 쓸 수 있는 순수 설정 (supabase 의존성 없음)

// 홈페이지에서 위치를 바꿀 수 있는 섹션
export type SectionId = 'latest' | 'bookshelf' | 'sns'

export const SECTION_LABELS: Record<SectionId, string> = {
  latest: '최신 글',
  bookshelf: '책장',
  sns: 'SNS 더보기',
}

// 적바림 주제 — 글과 메모를 묶는 분류.
// 표지 이미지가 없는 글은 이 색 위에 제목을 찍어 표지를 만든다. (3단계)
export interface Topic {
  name: string
  color: string
}

export const DEFAULT_TOPICS: Topic[] = [
  { name: '생각', color: '#8b5e3c' },
  { name: '일하며 배운 것', color: '#6b7f5e' },
  { name: '오늘의 배움', color: '#a9784a' },
  { name: '말씀 묵상', color: '#7a6ba3' },
  { name: '독서', color: '#4f7a8c' },
  { name: '상상', color: '#b06a7a' },
]

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
  bgHeader: '헤더 배경',
  textMain: '본문 글자',
  textSub: '보조 글자',
  textMuted: '흐린 글자',
  accent: '강조색',
  accentLight: '강조색(밝게)',
  border: '테두리',
  borderSoft: '테두리(연하게)',
}

export interface SiteConfig {
  siteName: string       // 사이트 이름 (예: "1인 서점")
  siteEyebrow: string    // 이름 위 작은 영문 문구 (예: "Young June's")
  heroTitle: string      // 메인 히어로 큰 제목
  heroImage: string      // 히어로 배경 이미지 경로
  latestTitle: string    // 최신 글 섹션 제목
  bookshelfTitle: string // 책장 섹션 제목
  footerName: string     // 푸터에 표시되는 이름
  topics: Topic[]        // 주제 목록 (관리자 설정에서 편집 — 4단계)
  theme: ThemeColors
  sectionOrder: SectionId[]   // 섹션 표시 순서
  hiddenSections: SectionId[] // 숨길 섹션
}

export const DEFAULT_THEME: ThemeColors = {
  bg: '#faf6f0',
  bgCard: '#fffdf9',
  bgHeader: '#fffdf9',
  textMain: '#2c1a0e',
  textSub: '#7a5c44',
  textMuted: '#b09880',
  accent: '#8b5e3c',
  accentLight: '#c4956a',
  border: '#e8ddd0',
  borderSoft: '#f0e8de',
}

export const DEFAULT_CONFIG: SiteConfig = {
  siteName: '1인 서점',
  siteEyebrow: "Young June's",
  heroTitle: '1인 서점',
  heroImage: '/hero.png',
  latestTitle: '최신 글',
  bookshelfTitle: '책장',
  footerName: '1인 서점',
  topics: DEFAULT_TOPICS,
  theme: DEFAULT_THEME,
  sectionOrder: ['latest', 'bookshelf', 'sns'],
  hiddenSections: [],
}

// 관리자가 한 번에 고를 수 있는 테마(스킨) 프리셋
export const THEME_PRESETS: { id: string; label: string; theme: ThemeColors }[] = [
  { id: 'warm', label: '따뜻한 우드 (기본)', theme: DEFAULT_THEME },
  {
    id: 'forest',
    label: '포레스트',
    theme: {
      bg: '#f3f6f1', bgCard: '#fbfdf9', bgHeader: '#fbfdf9',
      textMain: '#1c2a18', textSub: '#4a6240', textMuted: '#93a888',
      accent: '#4b7c46', accentLight: '#82b07b', border: '#d7e3d0', borderSoft: '#e6eee0',
    },
  },
  {
    id: 'ocean',
    label: '오션',
    theme: {
      bg: '#f0f5f9', bgCard: '#f9fcff', bgHeader: '#f9fcff',
      textMain: '#122236', textSub: '#3a5876', textMuted: '#8aa0b8',
      accent: '#2f6f9e', accentLight: '#6fa6cc', border: '#d2e0ec', borderSoft: '#e3edf5',
    },
  },
  {
    id: 'rose',
    label: '로즈',
    theme: {
      bg: '#faf2f4', bgCard: '#fffafb', bgHeader: '#fffafb',
      textMain: '#2e1620', textSub: '#7a4456', textMuted: '#c098a6',
      accent: '#b04a6a', accentLight: '#d98aa1', border: '#ecd5dd', borderSoft: '#f5e6ec',
    },
  },
  {
    id: 'night',
    label: '나이트 (다크)',
    theme: {
      bg: '#1c1a18', bgCard: '#26231f', bgHeader: '#26231f',
      textMain: '#f0e8de', textSub: '#c4b6a6', textMuted: '#8a7d6e',
      accent: '#c4956a', accentLight: '#d9b48a', border: '#3a352f', borderSoft: '#332e28',
    },
  },
]

// 부분 저장/누락된 필드가 있어도 기본값으로 안전하게 채운다
export function mergeConfig(partial: Partial<SiteConfig> | null | undefined): SiteConfig {
  const p = partial || {}
  const order = Array.isArray(p.sectionOrder) ? p.sectionOrder : DEFAULT_CONFIG.sectionOrder
  // 누락된 섹션은 뒤에 붙이고, 알 수 없는 값은 제거
  const valid = order.filter((s): s is SectionId => s in SECTION_LABELS)
  for (const s of DEFAULT_CONFIG.sectionOrder) {
    if (!valid.includes(s)) valid.push(s)
  }
  // 주제는 이름이 있는 항목만 남긴다. 하나도 없으면 기본 목록으로 되돌린다.
  const topics = (Array.isArray(p.topics) ? p.topics : [])
    .filter((t): t is Topic => !!t && typeof t.name === 'string' && t.name.trim() !== '')
    .map(t => ({ name: t.name.trim(), color: t.color || '#8b5e3c' }))

  return {
    ...DEFAULT_CONFIG,
    ...p,
    topics: topics.length > 0 ? topics : DEFAULT_TOPICS,
    theme: { ...DEFAULT_THEME, ...(p.theme || {}) },
    sectionOrder: valid,
    hiddenSections: Array.isArray(p.hiddenSections)
      ? p.hiddenSections.filter((s): s is SectionId => s in SECTION_LABELS)
      : [],
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
