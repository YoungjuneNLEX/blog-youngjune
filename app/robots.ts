import type { MetadataRoute } from 'next'

// 방문자 화면이 없는 비공개 작업실이다. 모든 검색 로봇을 막는다.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } }
}
