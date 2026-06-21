'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  SiteConfig, ThemeColors, SectionId,
  DEFAULT_CONFIG, THEME_PRESETS, THEME_FIELD_LABELS, SECTION_LABELS,
  themeToCssVars,
} from '@/lib/site-config'

const TEXT_FIELDS: { key: keyof SiteConfig; label: string; placeholder?: string; hint?: string }[] = [
  { key: 'siteName', label: '사이트 이름', hint: '헤더·푸터·브라우저 탭에 표시됩니다' },
  { key: 'siteEyebrow', label: '이름 위 영문 문구', placeholder: "Young June's" },
  { key: 'heroTitle', label: '메인 큰 제목 (히어로)' },
  { key: 'heroImage', label: '히어로 배경 이미지 경로', placeholder: '/hero.png' },
  { key: 'latestTitle', label: '최신 글 섹션 제목' },
  { key: 'bookshelfTitle', label: '책장 섹션 제목' },
  { key: 'footerName', label: '푸터 이름' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/')
    }
  }, [status, session, router])

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((d: SiteConfig) => { setConfig(d); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  function setField<K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) {
    setConfig(c => ({ ...c, [key]: value }))
    setSaved(false)
  }

  function setThemeColor(key: keyof ThemeColors, value: string) {
    setConfig(c => ({ ...c, theme: { ...c.theme, [key]: value } }))
    setSaved(false)
  }

  function applyPreset(theme: ThemeColors) {
    setConfig(c => ({ ...c, theme }))
    setSaved(false)
  }

  function moveSection(id: SectionId, dir: -1 | 1) {
    setConfig(c => {
      const order = [...c.sectionOrder]
      const i = order.indexOf(id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= order.length) return c
      ;[order[i], order[j]] = [order[j], order[i]]
      return { ...c, sectionOrder: order }
    })
    setSaved(false)
  }

  function toggleSection(id: SectionId) {
    setConfig(c => {
      const hidden = c.hiddenSections.includes(id)
        ? c.hiddenSections.filter(s => s !== id)
        : [...c.hiddenSections, id]
      return { ...c, hiddenSections: hidden }
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2500)
    } else {
      alert('저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  function resetDefault() {
    if (confirm('모든 설정을 기본값으로 되돌릴까요? (저장 전까지는 반영되지 않습니다)')) {
      setConfig(DEFAULT_CONFIG)
      setSaved(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '1.5rem', marginBottom: '1.25rem',
  }
  const sectionTitle: React.CSSProperties = {
    fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem',
  }
  const sectionDesc: React.CSSProperties = {
    fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.1rem',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: '0.875rem',
    border: '1px solid var(--border)', borderRadius: '8px',
    background: 'var(--bg)', color: 'var(--text-main)', outline: 'none',
  }

  if (!loaded) {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.25rem', color: 'var(--text-muted)' }}>
        불러오는 중...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.25rem 5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            사이트 설정
          </h1>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            홈페이지의 문구·테마(스킨)·섹션 위치를 직접 수정할 수 있어요.
          </p>
        </div>
        <button onClick={resetDefault}
          style={{ fontSize: '0.8rem', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '7px 14px', background: 'var(--bg-card)', color: 'var(--text-sub)', cursor: 'pointer' }}>
          기본값으로
        </button>
      </div>

      {/* 미리보기 */}
      <div style={{ ...cardStyle }}>
        <div style={sectionTitle}>미리보기</div>
        <p style={sectionDesc}>선택한 테마와 문구가 아래처럼 보여요. (저장해야 실제 사이트에 반영됩니다)</p>
        <div style={{ ...themeToCssVars(config.theme), background: 'var(--bg)',
          border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' } as React.CSSProperties}>
          <p style={{ color: 'var(--accent)', fontSize: '0.6rem', letterSpacing: '0.15em',
            textTransform: 'uppercase', fontWeight: 600 }}>{config.siteEyebrow || ' '}</p>
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.3rem', fontWeight: 800,
            letterSpacing: '-0.02em', marginBottom: '12px' }}>{config.heroTitle || config.siteName}</h3>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '14px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent)', background: 'var(--border-soft)',
              padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>카테고리</span>
            <p style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.9rem', margin: '8px 0 4px' }}>
              {config.latestTitle} 카드 제목 예시
            </p>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.78rem' }}>본문 미리보기 문장입니다.</p>
            <div style={{ marginTop: '12px' }}>
              <span style={{ display: 'inline-block', background: 'var(--accent)', color: '#fff',
                fontSize: '0.75rem', fontWeight: 600, padding: '6px 14px', borderRadius: '999px' }}>강조 버튼</span>
            </div>
          </div>
        </div>
      </div>

      {/* 문구 */}
      <div style={cardStyle}>
        <div style={sectionTitle}>문구 (텍스트)</div>
        <p style={sectionDesc}>사이트 이름과 각 섹션 제목 등을 바꿀 수 있어요.</p>
        <div style={{ display: 'grid', gap: '14px' }}>
          {TEXT_FIELDS.map(f => (
            <label key={f.key} style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--text-sub)', marginBottom: '5px' }}>{f.label}</span>
              <input
                value={String(config[f.key] ?? '')}
                placeholder={f.placeholder}
                onChange={e => setField(f.key, e.target.value as SiteConfig[typeof f.key])}
                style={inputStyle} />
              {f.hint && (
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {f.hint}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* 테마 / 스킨 */}
      <div style={cardStyle}>
        <div style={sectionTitle}>테마 (스킨)</div>
        <p style={sectionDesc}>아래 프리셋을 누르면 한 번에 색상이 바뀌고, 개별 색상도 직접 고를 수 있어요.</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.25rem' }}>
          {THEME_PRESETS.map(p => (
            <button key={p.id} onClick={() => applyPreset(p.theme)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px',
                border: '1px solid var(--border)', borderRadius: '999px',
                padding: '6px 12px 6px 8px', background: 'var(--bg)', cursor: 'pointer',
                fontSize: '0.8rem', color: 'var(--text-sub)' }}>
              <span style={{ display: 'flex' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: p.theme.accent }} />
                <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: p.theme.bg,
                  border: '1px solid var(--border)', marginLeft: '-5px' }} />
              </span>
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          {(Object.keys(THEME_FIELD_LABELS) as (keyof ThemeColors)[]).map(key => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px',
              border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 8px', background: 'var(--bg)' }}>
              <input type="color" value={config.theme[key]}
                onChange={e => setThemeColor(key, e.target.value)}
                style={{ width: '28px', height: '28px', border: 'none', background: 'none',
                  padding: 0, cursor: 'pointer', flexShrink: 0 }} />
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                  {THEME_FIELD_LABELS[key]}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {config.theme[key]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 섹션 위치 / 표시 */}
      <div style={cardStyle}>
        <div style={sectionTitle}>섹션 위치 / 표시</div>
        <p style={sectionDesc}>홈페이지 섹션의 순서를 바꾸거나 숨길 수 있어요.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {config.sectionOrder.map((id, idx) => {
            const hidden = config.hiddenSections.includes(id)
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px',
                border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px',
                background: 'var(--bg)', opacity: hidden ? 0.55 : 1 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', width: '20px' }}>{idx + 1}</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {SECTION_LABELS[id]}
                </span>
                <button onClick={() => moveSection(id, -1)} disabled={idx === 0}
                  title="위로" style={{ border: '1px solid var(--border)', borderRadius: '6px',
                    width: '30px', height: '30px', background: 'var(--bg-card)', color: 'var(--text-sub)',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
                <button onClick={() => moveSection(id, 1)} disabled={idx === config.sectionOrder.length - 1}
                  title="아래로" style={{ border: '1px solid var(--border)', borderRadius: '6px',
                    width: '30px', height: '30px', background: 'var(--bg-card)', color: 'var(--text-sub)',
                    cursor: idx === config.sectionOrder.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: idx === config.sectionOrder.length - 1 ? 0.4 : 1 }}>↓</button>
                <button onClick={() => toggleSection(id)}
                  style={{ border: '1px solid var(--border)', borderRadius: '6px',
                    padding: '0 12px', height: '30px', background: 'var(--bg-card)',
                    color: hidden ? 'var(--text-muted)' : 'var(--accent)', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {hidden ? '숨김' : '표시'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 저장 바 */}
      <div style={{ position: 'sticky', bottom: '0', paddingTop: '1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
        {saved && (
          <span style={{ color: '#4a7c59', fontSize: '0.85rem', fontWeight: 600 }}>✓ 저장되었습니다</span>
        )}
        <button onClick={handleSave} disabled={saving}
          style={{ fontSize: '0.9rem', fontWeight: 700, background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: '10px', padding: '11px 28px', cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(44,26,14,0.18)', opacity: saving ? 0.6 : 1 }}>
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
