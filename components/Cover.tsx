import { Topic } from '@/lib/site-config'
import { coverInk, topicPair } from '@/lib/cover'

/**
 * 표지 (C안) — 주제 파스텔 바탕 위에 주제 이름과 제목을 얹는다.
 * 사진이 있으면 사진만 보여 준다. 제목은 카드 아래에 글로 따로 붙으므로
 * 사진 위에 글자를 겹치지 않는다.
 */
export default function Cover({
  title, topic, topics, image, className = '',
}: {
  title: string
  topic: string | null
  topics: Topic[]
  image?: string | null
  className?: string
}) {
  const pair = topicPair(topic, topics)
  const ink = coverInk(pair.color, pair.ink)
  const label = topics.find(t => t.name === topic)?.short || topic || '적바림'

  if (image) {
    return (
      <div className={`cover ${className}`} style={{ background: 'var(--border-soft)' }}>
        <img className="cover-photo" src={image} alt="" loading="lazy" />
      </div>
    )
  }

  return (
    <div className={`cover ${className}`} style={{ background: pair.color, color: ink.fg }}>
      <span className="cover-topic" style={{ color: ink.dim }}>{label}</span>
      <span className="cover-title">{title || '무제'}</span>
    </div>
  )
}

/** 목록형의 88px 네모 표지 — 사진이면 사진, 아니면 파스텔 바탕에 작은 제목 */
export function Thumb({
  title, topic, topics, image,
}: { title: string; topic: string | null; topics: Topic[]; image?: string | null }) {
  const pair = topicPair(topic, topics)
  if (image) {
    return (
      <div className="row-thumb" style={{ background: 'var(--border-soft)' }}>
        <img src={image} alt="" loading="lazy" />
      </div>
    )
  }
  return (
    <div className="row-thumb" style={{ background: pair.color, color: pair.ink }}>
      <span>{title || '무제'}</span>
    </div>
  )
}
