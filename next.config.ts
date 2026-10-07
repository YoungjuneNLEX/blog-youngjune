import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 합치거나 없앤 주소는 옛 북마크·홈 화면 아이콘이 깨지지 않게 넘겨 준다.
  async redirects() {
    return [
      { source: '/memo', destination: '/write', permanent: true },       // 글쓰기 화면으로 합침
      { source: '/archive', destination: '/', permanent: true },         // '전체' 는 홈이 대신한다
      { source: '/bookshelf', destination: '/', permanent: true },       // 책장 페이지는 없앴다
    ]
  },
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'barqquzhhojqgrvgeleb.supabase.co' },
    ],
  },
};

export default nextConfig;
