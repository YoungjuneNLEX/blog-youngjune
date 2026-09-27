import { Topic } from '@/lib/site-config'
import { coverImage, topicColor } from '@/lib/cover'

/**
 * 자동 표지.
 * 본문에 이미지가 있으면 그것을 쓰고, 없으면 주제 색 위에 제목을 찍는다.
 * 이미지 파일을 새로 만들지 않고 CSS 로만 처리한다.
 */
export default function AutoCover({
  post, topics, className = '',
}: {
  post: { title: string; thumbnail_url?: string | null; content?: string | null; topic?: string | null }
  topics: Topic[]
  className?: string
}) {
  const src = coverImage(post)

  return (
    <div className={`cover ${className}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" />
      ) : (
        <div className="cover-type"
          style={{ background: topicColor(post.topic, topics) }}>
          <span>{post.title || '무제'}</span>
        </div>
      )}
    </div>
  )
}
