import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'barqquzhhojqgrvgeleb.supabase.co' },
    ],
  },
};

export default nextConfig;
