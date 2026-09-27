'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  SiteConfig, ThemeColors, Topic,
  DEFAULT_CONFIG, DEFAULT_THEME, THEME_FIELD_LABELS, themeToCssVars,
} from '@/lib/site-config'
import { DEFAULT_TEMPLATES, PostTemplate } from '@/lib/templates'
import { coverInk } from '@/lib/cover'

const TEXT_FIELDS: { key: keyof SiteConfig; label: string; hint?: string }[] = [
  { key: 'siteName', label: '제호 (사이트 이름)', hint: '머리글·푸터·브라우저 탭에 쓰입니다' },
  { key: 'heroTitle', label: '한 줄 소개', hint: '검색 결과의 설명문에 쓰입니다' },
  { key: 'latestTitle', label: '최근 글 섹션 제목' },
  { key: 'bookshelfTitle', label: '책장 섹션 제목' },
  { key: 'footerName', label: '푸터 이름' },
  { key: 'footerNote', label: '푸터 한 줄' },
]

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
  function setTopic(i: number, patch: Partial<Topic>) {
    setConfig(c => ({ ...c, topics: c.topics.map((t, n) => n === i ? { ...t, ...patch } : t) }))
    setSaved('')
  }
  function moveTopic(i: number, dir: -1 | 1) {
    setConfig(c => {
      const next = [...c.topics]
      const j = i + dir
      if (j < 0 || j >= next.length) return c
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...c, topics: next }
    })
    setSaved('')
  }
  function addTopic() {
    setConfig(c => ({
      ...c,
      topics: [...c.topics, { id: `t${Date.now()}`, name: '새 주제', short: '새', color: '#8b5e3c' }],
    }))
    setSaved('')
  }
  function removeTopic(i: number) {
    const t = config.topics[i]
    const n = usage[t.name] || 0
    const msg = n > 0
      ? `"${t.name}" 을 지울까요?\n이 주제의 글 ${n}편은 '분류 전'으로 옮겨집니다.`
      : `"${t.name}" 을 지울까요?`
    if (!confirm(msg)) return
    setConfig(c => ({ ...c, topics: c.topics.filter((_, n2) => n2 !== i) }))
    setSaved('')
  }

  async function uploadAvatar(file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) { alert('사진을 올리지 못했습니다.'); return }
    const d = await res.json()
    set('profile', { ...config.profile, avatarUrl: d.url })
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
          이름을 바꾸면 그 주제로 쓴 글도 함께 옮겨집니다. 저장 전에 몇 편인지 알려드립니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {config.topics.map((t, i) => {
            const ink = coverInk(t.color)
            return (
              <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: '12px',
                padding: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start',
                flexWrap: 'wrap', background: 'var(--bg)' }}>

                {/* 표지 미리보기 — 글자가 읽히는지 바로 보인다 */}
                <div style={{ width: '64px', height: '86px', borderRadius: '6px', flexShrink: 0,
                  background: t.color, color: ink.fg, display: 'flex', alignItems: 'flex-end',
                  padding: '8px', fontSize: '11px', fontWeight: 700, lineHeight: 1.3 }}
                  className="serif">
                  {t.short || t.name}
                </div>

                <div style={{ flex: 1, minWidth: '180px', display: 'grid', gap: '8px' }}>
                  <label>
                    <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>이름</span>
                    <input value={t.name} style={input}
                      onChange={e => setTopic(i, { name: e.target.value })} />
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label style={{ flex: 1 }}>
                      <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>짧은 이름</span>
                      <input value={t.short} style={input}
                        onChange={e => setTopic(i, { short: e.target.value })} />
                    </label>
                    <label style={{ width: '96px' }}>
                      <span className="meta" style={{ display: 'block', marginBottom: '4px' }}>색</span>
                      <input type="color" value={t.color} style={{ ...input, padding: '4px' }}
                        onChange={e => setTopic(i, { color: e.target.value })} />
                    </label>
                  </div>
                  <span className="meta">글 {usage[t.name] || 0}편</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => moveTopic(i, -1)} disabled={i === 0}
                    className="btn" style={{ minHeight: '44px', padding: '0 12px' }}>↑</button>
                  <button onClick={() => moveTopic(i, 1)} disabled={i === config.topics.length - 1}
                    className="btn" style={{ minHeight: '44px', padding: '0 12px' }}>↓</button>
                  <button onClick={() => removeTopic(i)}
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
        <p className="meta" style={{ marginBottom: '14px' }}>소개 페이지 맨 위와 푸터에 보입니다.</p>

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
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = '' }} />
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
              <span className="meta-sub" style={{ display: 'block', marginBottom: '6px' }}>한 줄 소개</span>
              <textarea value={config.profile.bio} rows={2}
                style={{ ...input, resize: 'vertical', lineHeight: 1.7 }}
                onChange={e => set('profile', { ...config.profile, bio: e.target.value })} />
            </label>
          </div>
        </div>
      </section>

      {/* 표시 */}
      <section style={card}>
        <h2 className="sec-title" style={{ marginBottom: '4px' }}>홈에 보일 것</h2>
        <p className="meta" style={{ marginBottom: '14px' }}>
          최근 글은 항상 보입니다. 아래 둘만 켜고 끌 수 있습니다.
        </p>
        {([
          ['showShortNotes', '짧은 노트'],
          ['showBookshelf', '책장'],
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
          <button onClick={() => { set('theme', DEFAULT_THEME); }} className="btn"
            style={{ minHeight: '44px', fontSize: '14px' }}>시안 색으로 되돌리기</button>
        </div>
        <p className="meta" style={{ marginBottom: '14px' }}>
          잘못 만지면 글자가 안 보일 수 있습니다. 그럴 땐 위 버튼으로 되돌리세요.
        </p>

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
