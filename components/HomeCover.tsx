import { Profile } from '@/lib/site-config'

/**
 * 홈 맨 위 커버 + 서재 주인 (C안).
 * 커버 사진이 있으면 사진 위에 흰 글자, 없으면 옅은 색 위에 본문 색 글자.
 */
export default function HomeCover({
  siteName, profile, articleCount, noteCount,
}: { siteName: string; profile: Profile; articleCount: number; noteCount: number }) {
  const onPhoto = Boolean(profile.coverUrl)
  const dim = onPhoto ? 'rgba(255,255,255,0.85)' : 'var(--text-sub)'

  return (
    <section className="home-cover" style={onPhoto ? { color: '#ffffff' } : undefined}>
      {onPhoto && (
        <>
          <img className="home-cover-photo" src={profile.coverUrl} alt="" />
          <span className="home-cover-veil" />
        </>
      )}
      <div className="home-cover-inner" style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="home-cover-count" style={{ color: dim }}>
          글 {articleCount} · 짧은 노트 {noteCount}
        </span>
        <h1 className="home-cover-title">{siteName}</h1>
        <div className="owner">
          <span className="owner-face">
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="" />
              : profile.name.trim().slice(0, 1)}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span className="owner-name">{profile.name}</span>
            <span className="owner-bio" style={{ color: dim }}>{profile.bio}</span>
          </span>
        </div>
      </div>
    </section>
  )
}
