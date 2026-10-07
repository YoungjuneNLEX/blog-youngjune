import Link from 'next/link'

/**
 * 글쓰기 화면 맨 위 줄. 쓰는 공간은 사이트 머리글 대신 이것을 쓴다.
 * 왼쪽은 돌아갈 곳, 가운데는 화면마다 다른 것(짧은 글/긴 글 전환 등), 오른쪽은 사이트 보기.
 */
export default function WriteBar({
  back, children,
}: { back: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="write-bar">
      <Link href={back.href} className="write-bar-link">← {back.label}</Link>
      <div className="write-bar-mid">{children}</div>
      <Link href="/" className="write-bar-link write-bar-right">사이트</Link>
    </div>
  )
}
