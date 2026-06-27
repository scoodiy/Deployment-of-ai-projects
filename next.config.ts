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
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https:; media-src 'self' https://music.163.com https://*.music.126.net; connect-src 'self' https:; frame-ancestors 'self';",
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
