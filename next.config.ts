import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 옛 주소는 옛 북마크·홈 화면 아이콘이 깨지지 않게 새 화면으로 넘겨 준다.
  async redirects() {
    return [
      { source: '/write', destination: '/', permanent: false },          // 옛 홈 화면 아이콘은 콘티 목록으로
      { source: '/write/:path*', destination: '/', permanent: false },
      { source: '/notes', destination: '/memo', permanent: false },
      { source: '/archive', destination: '/', permanent: false },
      { source: '/bookshelf', destination: '/', permanent: false },
    ]
  },
  // 검색엔진에 노출하지 않는다. (robots.txt 와 메타 태그에 더한 세 번째 겹)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ]
  },
};

export default nextConfig;
