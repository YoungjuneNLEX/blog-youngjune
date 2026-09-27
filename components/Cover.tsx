import { Topic } from '@/lib/site-config'
import { coverInk, topicColor } from '@/lib/cover'

/**
 * 표지 — 주제 색 위에 주제·제목·메타를 세로로 편다. (시안 기준)
 * 사진이 있으면 사진을 깔고 같은 배치를 그 위에 얹는다.
 * 글자가 읽힐 만큼만 어둡게 덮어 사진이 묻히지 않게 한다.
 */
export default function Cover({
  title, topic, topics, image, meta, className = '',
}: {
  title: string
  topic: string | null
  topics: Topic[]
  image?: string | null
  meta?: string
  className?: string
}) {
  const bg = topicColor(topic, topics)
  const ink = coverInk(bg)
  // 사진 위에서는 덮개가 어두우므로 항상 밝은 글자를 쓴다
  const fg = image ? '#f5ead9' : ink.fg
  const dim = image ? '#e3d6c2' : ink.dim
  const label = topics.find(t => t.name === topic)?.short || topic || '적바림'

  return (
    <div className={`cover ${className}`} style={{ background: bg, color: fg }}>
      {image && (
        <>
          <img className="cover-photo" src={image} alt="" loading="lazy" />
          <span className="cover-veil" />
        </>
      )}
      <span className="cover-topic" style={{ color: dim }}>{label}</span>
      <span className="cover-title">{title || '무제'}</span>
      {meta && <span className="cover-meta" style={{ color: dim }}>{meta}</span>}
    </div>
  )
}
