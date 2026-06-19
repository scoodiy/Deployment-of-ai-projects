import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 保留 unoptimized 避免服务器 500 错误，但配置好 remotePatterns 以便未来启用
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'bu.dusays.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'p1.music.126.net' },
      { protocol: 'https', hostname: 'music.126.net' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
