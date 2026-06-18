import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 关闭图片优化，直接使用原始图片，消除 500 错误
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // experimental 配置已清理（fontProxy 在 Next.js 16 中已移除）
};

export default nextConfig;
