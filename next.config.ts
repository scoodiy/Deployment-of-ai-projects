import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 关闭图片优化，直接使用原始图片，消除 500 错误
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 使用国内 Google Fonts 镜像
  experimental: {
    fontProxy: "https://fonts.loli.net",
  },
};

export default nextConfig;
