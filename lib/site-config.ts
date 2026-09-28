// 클라이언트/서버 양쪽에서 안전하게 쓸 수 있는 순수 설정 (supabase 의존성 없음)

// 적바림 주제 — 글과 메모를 묶는 분류.
// 표지 이미지가 없는 글은 이 색 위에 제목을 찍어 표지를 만든다.
export interface Topic {
  id: string        // 이름이 바뀌어도 같은 주제임을 알아보는 열쇠
  name: string      // 저장되는 이름. 노트 창고와 posts.topic 이 쓴다.
  short: string     // 좁은 자리에 쓰는 짧은 이름
  color: string     // 표지 바탕색. 비우면 상위 분류 색을 물려받는다.
  ink: string       // 그 바탕 위에 얹는 글자색. 비우면 상위 분류 것을 물려받는다.
  parentId?: string // 상위 분류의 id. 없으면 대분류. 깊이는 2단계까지만.
}

// 쪽빛 시안(docs/design/Jjok.html)의 주제 바탕/글자 짝.
// 이름이 기본값에 없는 대분류에는 이 여섯 짝을 순서대로 돌려 쓴다.
export const PASTEL_PAIRS: { color: string; ink: string }[] = [
  { color: '#ebe6f5', ink: '#3e3458' },
  { color: '#e6efe9', ink: '#2f4a3b' },
  { color: '#f5f0d4', ink: '#4a431a' },
  { color: '#f5ecdc', ink: '#4d3b1d' },
  { color: '#f6e2dc', ink: '#55302a' },
  { color: '#f3e3ee', ink: '#4a2c40' },
]

export const DEFAULT_TOPICS: Topic[] = [
  { id: '생각',           name: '생각',           short: '생각', ...PASTEL_PAIRS[0] },
  { id: '일하며 배운 것', name: '일하며 배운 것', short: '일',   ...PASTEL_PAIRS[1] },
  { id: '오늘의 배움',    name: '오늘의 배움',    short: '배움', ...PASTEL_PAIRS[2] },
  { id: '말씀 묵상',      name: '말씀 묵상',      short: '묵상', ...PASTEL_PAIRS[3] },
  { id: '독서',           name: '독서',           short: '독서', ...PASTEL_PAIRS[4] },
  { id: '상상',           name: '상상',           short: '상상', ...PASTEL_PAIRS[5] },
]

// 설정에 없는 주제·분류 전 글에 쓰는 무채색 짝
export const NEUTRAL_TOPIC = { color: '#e9e7e2', ink: '#3f3f3d' }

/** 어떤 주제의 중분류들 (설정에 적힌 순서 그대로) */
export function childTopics(topics: Topic[], parentId: string): Topic[] {
  return topics.filter(t => t.parentId === parentId)
}

/** 대분류 → 그 중분류들 순서로 펼친 목록. 설정 화면과 카테고리 화면이 쓴다. */
export function orderedTopics(topics: Topic[]): { topic: Topic; depth: 0 | 1 }[] {
  const out: { topic: Topic; depth: 0 | 1 }[] = []
  for (const t of topics.filter(x => !x.parentId)) {
    out.push({ topic: t, depth: 0 })
    for (const c of childTopics(topics, t.id)) out.push({ topic: c, depth: 1 })
  }
  // 부모를 잃은 주제가 남아 있으면 끝에 붙인다 (설정이 깨져도 사라지지 않게)
  for (const t of topics) {
    if (!out.some(o => o.topic.id === t.id)) out.push({ topic: t, depth: 0 })
  }
  return out
}

/**
 * 이 주제의 글을 찾을 때 쓸 이름들.
 * 대분류면 자기 이름 + 모든 중분류 이름, 중분류면 자기 이름 하나.
 */
export function topicNamesUnder(topics: Topic[], name: string): string[] {
  const found = topics.find(t => t.name === name)
  if (!found) return [name]
  return [name, ...childTopics(topics, found.id).map(c => c.name)]
}

/** 상위 분류 이름 (중분류일 때만) */
export function parentNameOf(topics: Topic[], name: string): string | null {
  const found = topics.find(t => t.name === name)
  if (!found?.parentId) return null
  return topics.find(t => t.id === found.parentId)?.name || null
}

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

// 쪽빛 시안(docs/design/Jjok.html) 의 색 정의와 1:1
export const DEFAULT_THEME: ThemeColors = {
  bg: '#fbfaf6',          // 한지 바탕
  bgCard: '#fbfaf6',
  bgHeader: '#fbfaf6',
  textMain: '#1f1f1f',
  textSub: '#5f5f5f',     // 보조
  textMuted: '#767676',   // 흐린 글자
  accent: '#33517e',      // 쪽빛 — 버튼·활성 탭·지금 보는 분류
  accentLight: '#e4eaf3', // 연한 쪽빛 — 커버 기본 바탕, 고른 줄 배경
  border: '#e8e6df',
  borderSoft: '#f3f2ec',
}

// 인주색 — 제호 옆 점 하나에만 쓴다. 넓은 면·글자·버튼에는 쓰지 않는다.
export const SEAL_RED = '#b5483a'

/** 색 되돌리기 미리보기 한 줄 */
export interface ColorChange {
  name: string
  depth: 0 | 1
  before: { color: string; ink: string }
  after: { color: string; ink: string }
}

/**
 * "쪽빛 색으로 되돌리기" — 색만 되돌린다.
 * 주제 이름·짧은 이름·순서·상위 분류와 문구·서재 주인·템플릿은 건드리지 않는다.
 *
 * 대분류: 이름이 기본 주제와 같으면 그 짝을, 아니면 파스텔 여섯 짝을 순서대로 돌려 쓴다.
 *         (이미 다른 대분류가 가져간 짝은 되도록 피한다)
 * 중분류: 색을 비워 대분류 색을 물려받게 한다.
 */
export function planColorReset(config: SiteConfig): { config: SiteConfig; changes: ColorChange[] } {
  const parents = config.topics.filter(t => !t.parentId)
  const picked = new Map<string, { color: string; ink: string }>()
  const used = new Set<number>()

  // 1) 이름이 기본값과 같은 대분류부터 제 짝을 가져간다
  for (const t of parents) {
    const i = DEFAULT_TOPICS.findIndex(d => d.name === t.name)
    if (i < 0) continue
    picked.set(t.id, PASTEL_PAIRS[i])
    used.add(i)
  }
  // 2) 남은 대분류에 아직 안 쓴 짝부터 돌려 준다
  let next = 0
  for (const t of parents) {
    if (picked.has(t.id)) continue
    while (used.size < PASTEL_PAIRS.length && used.has(next % PASTEL_PAIRS.length)) next++
    const i = next % PASTEL_PAIRS.length
    picked.set(t.id, PASTEL_PAIRS[i])
    used.add(i)
    next++
  }

  const changes: ColorChange[] = []
  const topics = config.topics.map(t => {
    const after = t.parentId ? { color: '', ink: '' } : picked.get(t.id) || NEUTRAL_TOPIC
    if (t.color !== after.color || t.ink !== after.ink) {
      changes.push({
        name: t.name,
        depth: t.parentId ? 1 : 0,
        before: { color: t.color, ink: t.ink },
        after: { ...after },
      })
    }
    return { ...t, ...after }
  })

  return { config: { ...config, theme: DEFAULT_THEME, topics }, changes }
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

/** 바탕색이 밝으면 짙은 글자, 어두우면 밝은 글자. 글자색을 안 정했을 때 쓴다. */
export function readableInk(bg: string): string {
  const h = bg.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  if (full.length !== 6) return NEUTRAL_TOPIC.ink
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.45 ? '#1f1f1f' : '#ffffff'
}

/** 색 값은 비워 둘 수 있다. 문자열이 아니면 빈 값으로 본다. */
function hex(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * 분류 깊이를 2단계로 강제한다.
 *   - 자기 자신이나 없는 주제를 가리키면 대분류로 올린다.
 *   - 상위 분류가 또 상위 분류를 가지면(3단계) 대분류로 올린다.
 * 순환(A→B→A)도 이 두 규칙으로 끊긴다.
 */
function flattenToTwoLevels(topics: Topic[]): void {
  const byId = new Map(topics.map(t => [t.id, t]))
  for (const t of topics) {
    if (!t.parentId) continue
    const parent = byId.get(t.parentId)
    if (!parent || parent.id === t.id) { t.parentId = undefined; continue }
  }
  for (const t of topics) {
    if (!t.parentId) continue
    if (byId.get(t.parentId)?.parentId) t.parentId = undefined
  }
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
      // 색은 비워 둘 수 있다. 비면 상위 분류 것을 물려받는다. (topicPair 가 처리)
      color: hex(t.color),
      ink: hex(t.ink),
      parentId: typeof t.parentId === 'string' && t.parentId.trim() !== ''
        ? t.parentId.trim() : undefined,
    }))

  flattenToTwoLevels(topics)

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
