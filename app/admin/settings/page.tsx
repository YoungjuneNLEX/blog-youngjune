'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  ColorChange, SiteConfig, ThemeColors, Topic,
  DEFAULT_CONFIG, NEUTRAL_TOPIC, THEME_FIELD_LABELS,
  childTopics, orderedTopics, planColorReset, themeToCssVars,
} from '@/lib/site-config'
import { DEFAULT_TEMPLATES, PostTemplate } from '@/lib/templates'
import { coverInk, topicPair } from '@/lib/cover'

const TEXT_FIELDS: { key: keyof SiteConfig; label: string; hint?: string }[] = [
  { key: 'siteName', label: '제호 (사이트 이름)', hint: '머리글·푸터·브라우저 탭에 쓰입니다' },
  { key: 'heroTitle', label: '검색 설명문', hint: '구글 검색 결과에 보이는 사이트 설명입니다. 홈 커버의 한 줄 소개는 아래 "서재 주인"에서 바꿉니다' },
  { key: 'latestTitle', label: '전체 페이지 제목', hint: '/archive 맨 위에 쓰입니다' },
  { key: 'bookshelfTitle', label: '책장 페이지 제목' },
  { key: 'footerName', label: '푸터 이름' },
  { key: 'footerNote', label: '푸터 한 줄' },
]

/** 색 견본 한 칸 — 되돌리기 미리보기에서 전/후를 나란히 보여 준다 */
function Swatch({ color, ink }: { color: string; ink: string }) {
  return (
    <span style={{ width: '54px', height: '30px', borderRadius: '6px', flexShrink: 0,
      background: color || 'var(--border-soft)', color: ink || 'var(--text-muted)',
      border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
      {color ? '가' : '없음'}
    </span>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG)
  const [before, setBefore] = useState<SiteConfig | null>(null)
  const [templates, setTemplates] = useState<PostTemplate[]>([])
  const [usage, setUsage] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const [colorPlan, setColorPlan] =
    useState<{ config: SiteConfig; changes: ColorChange[] } | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.replace('/')
  }, [status, session, router])

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/templates').then(r => r.json()).catch(() => ({ templates: [] })),
      fetch('/api/topics').then(r => r.json()).catch(() => ({ usage: {} })),
    ]).then(([c, t, u]) => {
      setConfig(c); setBefore(c)
      setTemplates(t.templates || [])
      setUsage(u.usage || {})
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  function set<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setConfig(c => ({ ...c, [key]: value })); setSaved('')
  }
  function setTopic(id: string, patch: Partial<Topic>) {
    setConfig(c => ({ ...c, topics: c.topics.map(t => t.id === id ? { ...t, ...patch } : t) }))
    setSaved('')
  }

  /** 순서 바꾸기는 같은 부모 안에서만 (대분류끼리, 또는 같은 대분류의 중분류끼리) */
  function moveTopic(id: string, dir: -1 | 1) {
    setConfig(c => {
      const me = c.topics.find(t => t.id === id)
      if (!me) return c
      const siblings = c.topics.filter(t => (t.parentId || '') === (me.parentId || ''))
      const at = siblings.findIndex(t => t.id === id)
      const other = siblings[at + dir]
      if (!other) return c
      const next = [...c.topics]
      const a = next.findIndex(t => t.id === id)
      const b = next.findIndex(t => t.id === other.id)
      ;[next[a], next[b]] = [next[b], next[a]]
      return { ...c, topics: next }
    })
    setSaved('')
  }

  /** 상위 분류 바꾸기. 중분류로 내려가면 색을 비워 대분류 색을 물려받게 한다. */
  function setParent(id: string, parentId: string) {
    setConfig(c => ({
      ...c,
      topics: c.topics.map(t => t.id === id
        ? (parentId
            ? { ...t, parentId, color: '', ink: '' }
            : { ...t, parentId: undefined, color: t.color || NEUTRAL_TOPIC.color,
                ink: t.ink || NEUTRAL_TOPIC.ink })
        : t),
    }))
    setSaved('')
  }

  function addTopic() {
    setConfig(c => ({
      ...c,
      topics: [...c.topics, { id: `t${Date.now()}`, name: '새 주제', short: '새', ...NEUTRAL_TOPIC }],
    }))
    setSaved('')
  }

  /**
   * 주제 지우기.
   * 대분류에 중분류가 딸려 있으면 "대분류로 올릴지 / 함께 지울지" 먼저 묻는다.
   * 글은 지금까지처럼 '분류 전'으로 되돌아간다 (실제 이동은 저장할 때 API 가 한다).
   */
  function removeTopic(id: string) {
    const t = config.topics.find(x => x.id === id)
    if (!t) return
    const kids = childTopics(config.topics, id)

    if (kids.length > 0) {
      const raise = confirm(
        `"${t.name}" 아래에 중분류가 ${kids.length}개 있습니다.\n\n` +
        `[확인] 중분류를 대분류로 올리고 "${t.name}" 만 지웁니다.\n` +
        `[취소] 다음 물음에서 함께 지울지 고릅니다.`,
      )
      if (raise) {
        const n = usage[t.name] || 0
        if (!confirm(`"${t.name}" 을 지우고 중분류 ${kids.length}개를 대분류로 올립니다.` +
          (n > 0 ? `\n이 대분류의 글 ${n}편은 '분류 전'으로 갑니다.` : ''))) return
        setConfig(c => ({
          ...c,
          topics: c.topics
            .filter(x => x.id !== id)
            .map(x => x.parentId === id
              ? { ...x, parentId: undefined, color: x.color || NEUTRAL_TOPIC.color,
                  ink: x.ink || NEUTRAL_TOPIC.ink }
              : x),
        }))
        setSaved('')
        return
      }
      const all = [t, ...kids]
      const n = all.reduce((sum, x) => sum + (usage[x.name] || 0), 0)
      if (!confirm(`"${t.name}" 과 중분류 ${kids.length}개를 함께 지울까요?` +
        (n > 0 ? `\n글 ${n}편이 '분류 전'으로 갑니다.` : ''))) return
      setConfig(c => ({ ...c, topics: c.topics.filter(x => x.id !== id && x.parentId !== id) }))
      setSaved('')
      return
    }

    const n = usage[t.name] || 0
    const msg = n > 0
      ? `"${t.name}" 을 지울까요?\n이 주제의 글 ${n}편은 '분류 전'으로 옮겨집니다.`
      : `"${t.name}" 을 지울까요?`
    if (!confirm(msg)) return
    setConfig(c => ({ ...c, topics: c.topics.filter(x => x.id !== id) }))
    setSaved('')
  }

  /** 사진을 올려 프로필 사진(avatarUrl) 또는 홈 커버(coverUrl) 에 넣는다 */
  async function uploadImage(file: File, field: 'avatarUrl' | 'coverUrl') {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) { alert('사진을 올리지 못했습니다.'); return }
    const d = await res.json()
    set('profile', { ...config.profile, [field]: d.url })
  }

  /**
   * 쪽빛 색으로 되돌리기 — 사이트 색과 주제의 바탕·글자색만 되돌린다.
   * 누르면 바로 바꾸지 않고, 어떤 주제가 어떻게 바뀌는지 먼저 보여 준다.
   */
  function askColorReset() {
    setColorPlan(planColorReset(config))
  }
  function applyColorReset() {
    if (!colorPlan) return
    setConfig(colorPlan.config)
    setColorPlan(null)
    setSaved('')
  }

  /** 저장 전에 주제 이름 변경·삭제로 몇 편이 함께 바뀌는지 알려준다 */
  function confirmTopicChanges(): boolean {
    if (!before) return true
    const lines: string[] = []
    for (const t of config.topics) {
      const old = before.topics.find(o => o.id === t.id)
      if (old && old.name !== t.name) {
        const n = usage[old.name] || 0
        lines.push(`· "${old.name}" → "${t.name}"${n > 0 ? ` (글 ${n}편이 함께 바뀝니다)` : ''}`)
      }
    }
    for (const old of before.topics) {
      if (config.topics.some(t => t.id === old.id)) continue
      const n = usage[old.name] || 0
      lines.push(`· "${old.name}" 삭제${n > 0 ? ` (글 ${n}편이 '분류 전'으로 갑니다)` : ''}`)
    }
    if (lines.length === 0) return true
    return confirm(`주제가 이렇게 바뀝니다.\n\n${lines.join('\n')}\n\n저장할까요?`)
  }

  async function save() {
    if (!confirmTopicChanges()) return
    setSaving(true)

    const res = await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    const tRes = await fetch('/api/templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templates }),
    })
    setSaving(false)

    if (!res.ok || !tRes.ok) { alert('저장에 실패했습니다. 다시 시도해주세요.'); return }
    const d = await res.json()
    setBefore(d.config)
    setSaved(d.moved > 0 ? `저장했습니다. 글 ${d.moved}편의 주제를 함께 옮겼습니다.` : '저장했습니다.')
    router.refresh()
  }

  const card: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
  }
  const input: React.CSSProperties = {
    width: '100%', minHeight: '44px', padding: '10px 12px', fontSize: '15px',
    border: '1px solid var(--border)', borderRadius: '10px',
    background: 'var(--bg)', color: 'var(--text-main)', outline: 'none',
    fontFamily: 'inherit',
  }

  if (!loaded) {
    return <div className="wrap" style={{ padding: '32px 0' }}><p className="meta-sub">불러오는 중…</p></div>
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 20px 80px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h1 className="wordmark">설정</h1>
        <Link href="/admin" className="meta-sub">회원 관리 →</Link>
      </div>

      {/* 문구 */}
      <section style={card}>
        <h2 className="sec-title" style={{ marginBottom: '14px' }}>문구</h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          {TEXT_FIELDS.map(f => (
            <label key={f.key} style={{ display: 'block' }}>
              <span className="meta-sub" style={{ display: 'block', marginBottom: '6px' }}>{f.label}</span>
              <input value={String(config[f.key] ?? '')} style={input}
                onChange={e => set(f.key, e.target.value as SiteConfig[typeof f.key])} />
              {f.hint && <span className="meta" style={{ display: 'block', marginTop: '4px' }}>{f.hint}</span>}
            </label>
          ))}
        </div>
      </section>

      {/* 주제 */}
      <section style={card}>
        <h2 className="sec-title" style={{ marginBottom: '4px' }}>주제</h2>
        <p className="meta" style={{ marginBottom: '14px' }}>
          대분류 아래에 중분류를 둘 수 있습니다(2단계까지). 중분류는 색을 비우면 대분류 색을 따릅니다.
          이름을 바꾸면 그 주제로 쓴 글도 함께 옮겨집니다. 저장 전에 몇 편인지 알려드립니다.
          순서 바꾸기(↑↓)는 같은 상위 분류 안에서만 움직입니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {orderedTopics(config.topics).map(({ topic: t, depth }) => {
            const pair = topicPair(t.name, config.topics)
            const ink = coverInk(pair.color, pair.ink)
            const siblings = config.topics.filter(x => (x.parentId || '') === (t.parentId || ''))
            const at = siblings.findIndex(x => x.id === t.id)
            // 3단계를 막는다: 자기 자신과 이미 중분류인 주제는 상위 분류가 될 수 없다.
            // 자식이 있는 주제도 다른 대분류 밑으로 들어갈 수 없다.
            const canHaveParent = childTopics(config.topics, t.id).length === 0
            const parentChoices = config.topics.filter(x => !x.parentId && x.id !== t.id)

            return (
              <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: '12px',
                padding: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start',
                flexWrap: 'wrap', background: 'var(--bg)',
                marginLeft: depth === 1 ? '24px' : 0 }}>

                {/* 표지 미리보기 — 글자가 읽히는지 바로 보인다 (물려받은 색도 그대로 보인다) */}
                <div style={{ width: '64px', height: '86px', borderRadius: '6px', flexShrink: 0,
                  background: pair.color, color: ink.fg, display: 'flex', alignItems: 'flex-end',
                  padding: '8px', fontSize: '11px', fontWeight: 700, lineHeight: 1.3 }}
                  className="serif">
                  {t.short || t.name}
                </div>

                <div style={{ flex: 1, minWidth: '180px', display: 'grid', gap: '8px' }}>
                  <label>
                    <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>이름</span>
                    <input value={t.name} style={input}
                      onChange={e => setTopic(t.id, { name: e.target.value })} />
                  </label>

                  <label>
                    <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>상위 분류</span>
                    <select value={t.parentId || ''} style={input} disabled={!canHaveParent}
                      onChange={e => setParent(t.id, e.target.value)}>
                      <option value="">없음 (대분류)</option>
                      {parentChoices.map(p2 => (
                        <option key={p2.id} value={p2.id}>{p2.name}</option>
                      ))}
                    </select>
                    {!canHaveParent && (
                      <span className="meta" style={{ display: 'block', marginTop: '4px' }}>
                        중분류가 딸려 있어 다른 분류 밑으로 옮길 수 없습니다
                      </span>
                    )}
                  </label>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label style={{ flex: 1 }}>
                      <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>짧은 이름</span>
                      <input value={t.short} style={input}
                        onChange={e => setTopic(t.id, { short: e.target.value })} />
                    </label>
                    <label style={{ width: '84px' }}>
                      <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>바탕</span>
                      <input type="color" value={t.color || pair.color} style={{ ...input, padding: '4px' }}
                        onChange={e => setTopic(t.id, { color: e.target.value })} />
                    </label>
                    <label style={{ width: '84px' }}>
                      <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>글자</span>
                      <input type="color" value={t.ink || pair.ink} style={{ ...input, padding: '4px' }}
                        onChange={e => setTopic(t.id, { ink: e.target.value })} />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="meta">글 {usage[t.name] || 0}편</span>
                    {!t.color && depth === 1 && (
                      <span className="meta">상위 분류 색을 따름</span>
                    )}
                    {(t.color || t.ink) && depth === 1 && (
                      <button onClick={() => setTopic(t.id, { color: '', ink: '' })}
                        className="meta" style={{ background: 'none', border: 'none', padding: 0,
                          cursor: 'pointer', textDecoration: 'underline' }}>
                        상위 분류 색 따르기
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => moveTopic(t.id, -1)} disabled={at === 0}
                    className="btn" style={{ minHeight: '44px', padding: '0 12px' }}>↑</button>
                  <button onClick={() => moveTopic(t.id, 1)} disabled={at === siblings.length - 1}
                    className="btn" style={{ minHeight: '44px', padding: '0 12px' }}>↓</button>
                  <button onClick={() => removeTopic(t.id)}
                    className="btn" style={{ minHeight: '44px', padding: '0 12px', color: '#a33' }}>지움</button>
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={addTopic} className="btn" style={{ marginTop: '12px' }}>+ 주제 추가</button>
      </section>

      {/* 프로필 */}
      <section style={card}>
        <h2 className="sec-title" style={{ marginBottom: '4px' }}>서재 주인</h2>
        <p className="meta" style={{ marginBottom: '14px' }}>
          홈 맨 위 커버와 소개 페이지, 푸터에 보입니다.
        </p>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
              background: 'var(--border-soft)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              {config.profile.avatarUrl
                ? <img src={config.profile.avatarUrl} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '사진 없음'}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'avatarUrl'); e.target.value = '' }} />
            <button onClick={() => fileRef.current?.click()} className="btn"
              style={{ minHeight: '44px', padding: '0 12px', fontSize: '14px' }}>사진 고르기</button>
            {config.profile.avatarUrl && (
              <button onClick={() => set('profile', { ...config.profile, avatarUrl: '' })}
                className="meta" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                사진 빼기
              </button>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '200px', display: 'grid', gap: '12px' }}>
            <label>
              <span className="meta-sub" style={{ display: 'block', marginBottom: '6px' }}>닉네임</span>
              <input value={config.profile.name} style={input}
                onChange={e => set('profile', { ...config.profile, name: e.target.value })} />
            </label>
            <label>
              <span className="meta-sub" style={{ display: 'block', marginBottom: '6px' }}>한 줄 소개 (홈 커버·소개 페이지에 보임)</span>
              <textarea value={config.profile.bio} rows={2}
                style={{ ...input, resize: 'vertical', lineHeight: 1.7 }}
                onChange={e => set('profile', { ...config.profile, bio: e.target.value })} />
            </label>
          </div>
        </div>

        {/* 홈 커버 이미지 — 비우면 옅은 단색이 깔린다 */}
        <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className="meta-sub">홈 커버 이미지</span>
          <div style={{ height: '120px', borderRadius: '10px', overflow: 'hidden',
            background: config.profile.coverUrl ? 'var(--border-soft)' : 'var(--accent-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {config.profile.coverUrl
              ? <img src={config.profile.coverUrl} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="meta">사진 없음 — 옅은 색이 깔립니다</span>}
          </div>
          <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'coverUrl'); e.target.value = '' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => coverRef.current?.click()} className="btn"
              style={{ minHeight: '44px', padding: '0 14px', fontSize: '14px' }}>커버 고르기</button>
            {config.profile.coverUrl && (
              <button onClick={() => set('profile', { ...config.profile, coverUrl: '' })} className="btn"
                style={{ minHeight: '44px', padding: '0 14px', fontSize: '14px' }}>커버 빼기</button>
            )}
          </div>
        </div>
      </section>

      {/* 표시 */}
      <section style={card}>
        <h2 className="sec-title" style={{ marginBottom: '4px' }}>홈에 보일 것</h2>
        <p className="meta" style={{ marginBottom: '14px' }}>
          글 목록은 항상 보입니다. 아래 둘만 켜고 끌 수 있습니다.
        </p>
        {([
          ['showShortNotes', '짧은 노트 탭'],
          ['showBookshelf', '책장 (아래 메뉴와 책장 페이지)'],
        ] as const).map(([key, label]) => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px',
            minHeight: '44px', cursor: 'pointer' }}>
            <input type="checkbox" checked={config[key]} onChange={e => set(key, e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: '15px' }}>{label}</span>
          </label>
        ))}
      </section>

      {/* 테마 */}
      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <h2 className="sec-title">색</h2>
          <button onClick={askColorReset} className="btn"
            style={{ minHeight: '44px', fontSize: '14px' }}>쪽빛 색으로 되돌리기</button>
        </div>
        <p className="meta" style={{ marginBottom: '14px' }}>
          잘못 만지면 글자가 안 보일 수 있습니다. 그럴 땐 위 버튼으로 되돌리세요.
          버튼은 사이트 색과 주제 색(바탕·글자)만 되돌립니다. 주제 이름·순서·상위 분류와
          문구·서재 주인·템플릿은 그대로 둡니다. 누르면 무엇이 바뀌는지 먼저 보여 드립니다.
        </p>

        {/* 되돌리기 미리보기 — 여기서 확인해야 실제로 바뀐다 */}
        {colorPlan && (
          <div style={{ border: '1px solid var(--accent)', borderRadius: '12px', padding: '14px',
            marginBottom: '14px', background: 'var(--accent-light)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700 }}>
              주제 {colorPlan.changes.length}개의 색이 이렇게 바뀝니다
            </p>
            {colorPlan.changes.length === 0 ? (
              <p className="meta" style={{ margin: '0 0 12px' }}>
                주제 색은 이미 쪽빛 기본값입니다. 사이트 색만 되돌립니다.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {colorPlan.changes.map(ch => (
                  <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: '10px',
                    marginLeft: ch.depth === 1 ? '16px' : 0 }}>
                    <span style={{ fontSize: '14px', minWidth: '96px' }}>
                      {ch.depth === 1 ? '└ ' : ''}{ch.name}
                    </span>
                    <Swatch color={ch.before.color} ink={ch.before.ink} />
                    <span className="meta">→</span>
                    {ch.after.color
                      ? <Swatch color={ch.after.color} ink={ch.after.ink} />
                      : <span className="meta">상위 분류 색을 따름</span>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={applyColorReset} className="btn btn-accent"
                style={{ padding: '0 16px', fontSize: '14px' }}>이대로 바꾸기</button>
              <button onClick={() => setColorPlan(null)} className="btn"
                style={{ minHeight: '44px', padding: '0 16px', fontSize: '14px' }}>그만두기</button>
            </div>
            <p className="meta" style={{ margin: '10px 0 0' }}>
              바꾼 뒤 아래 &lsquo;저장&rsquo;을 눌러야 사이트에 반영됩니다.
            </p>
          </div>
        )}

        <div style={{ ...themeToCssVars(config.theme), background: 'var(--bg)',
          border: '1px solid var(--border)', borderRadius: '12px', padding: '16px',
          marginBottom: '14px' } as React.CSSProperties}>
          <p className="serif" style={{ color: 'var(--text-main)', fontSize: '18px',
            fontWeight: 700, margin: '0 0 4px' }}>{config.siteName}</p>
          <p style={{ color: 'var(--text-sub)', fontSize: '14px', margin: '0 0 2px' }}>보조 글자</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>흐린 글자</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px' }}>
          {(Object.keys(THEME_FIELD_LABELS) as (keyof ThemeColors)[]).map(key => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px',
              border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 8px',
              background: 'var(--bg)', minHeight: '44px' }}>
              <input type="color" value={config.theme[key]}
                onChange={e => set('theme', { ...config.theme, [key]: e.target.value })}
                style={{ width: '28px', height: '28px', border: 'none', background: 'none',
                  padding: 0, cursor: 'pointer', flexShrink: 0 }} />
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span className="meta-sub">{THEME_FIELD_LABELS[key]}</span>
                <span className="meta" style={{ fontFamily: 'monospace' }}>{config.theme[key]}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* 템플릿 */}
      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <h2 className="sec-title">글 템플릿</h2>
          <button onClick={() => setTemplates(t => [...t, ...DEFAULT_TEMPLATES.filter(
            d => !t.some(x => x.name === d.name))])}
            className="btn" style={{ minHeight: '44px', fontSize: '14px' }}>기본 템플릿 넣기</button>
        </div>
        <p className="meta" style={{ marginBottom: '14px' }}>
          글쓰기 화면에서 불러다 씁니다. 본문은 HTML 로 저장됩니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {templates.length === 0 && (
            <p className="meta-sub">아직 템플릿이 없습니다. 위 버튼으로 기본 3개를 넣어보세요.</p>
          )}
          {templates.map((t, i) => (
            <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: '12px',
              padding: '12px', background: 'var(--bg)', display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <label style={{ flex: 1 }}>
                  <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>이름</span>
                  <input value={t.name} style={input}
                    onChange={e => setTemplates(list => list.map((x, n) =>
                      n === i ? { ...x, name: e.target.value } : x))} />
                </label>
                <button onClick={() => { if (confirm(`"${t.name}" 템플릿을 지울까요?`))
                    setTemplates(list => list.filter((_, n) => n !== i)) }}
                  className="btn" style={{ minHeight: '44px', padding: '0 12px', color: '#a33' }}>지움</button>
              </div>
              <label>
                <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>본문</span>
                <textarea value={t.body} rows={4}
                  style={{ ...input, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
                  onChange={e => setTemplates(list => list.map((x, n) =>
                    n === i ? { ...x, body: e.target.value } : x))} />
              </label>
            </div>
          ))}
        </div>
        <button onClick={() => setTemplates(t => [...t,
          { id: `t${Date.now()}`, name: '새 템플릿', body: '<p></p>' }])}
          className="btn" style={{ marginTop: '12px' }}>+ 템플릿 추가</button>
      </section>

      {/* 저장 */}
      <div style={{ position: 'sticky', bottom: 0, paddingTop: '12px', paddingBottom: '12px',
        background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
        {saved && <span className="meta-sub">{saved}</span>}
        <button onClick={save} disabled={saving} className="btn btn-accent"
          style={{ minHeight: '48px', padding: '0 28px' }}>
          {saving ? '저장 중…' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
