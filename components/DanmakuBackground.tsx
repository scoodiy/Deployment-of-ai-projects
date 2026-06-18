"use client";

import { useEffect, useState, useMemo } from 'react';
import { siteConfig } from '../siteConfig';

interface DanmakuItem {
  id: number;
  text: string;
  top: number;
  duration: number;
  delay: number;
}

export default function DanmakuBackground() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 使用 useMemo 生成稳定的弹幕数据，避免每次渲染重新生成
  const danmakus = useMemo<DanmakuItem[]>(() => {
    const list = siteConfig.danmakuList || [];
    if (list.length === 0) return [];

    const generated: DanmakuItem[] = [];
    const count = 15;

    // 使用固定种子生成伪随机值，保证每次渲染结果一致
    for (let i = 0; i < count; i++) {
      const seed = i * 7 + 3;
      generated.push({
        id: i,
        text: list[seed % list.length],
        top: ((seed * 13) % 80) + 10,
        duration: ((seed * 17) % 20) + 25,
        delay: ((seed * 11) % 20),
      });
    }
    return generated;
  }, []);

  // 移动端或未挂载时不渲染
  if (!mounted || isMobile) return null;

  return (
    <div className="fixed top-28 h-[30vh] left-0 right-0 overflow-hidden pointer-events-none z-0">
      {danmakus.map((item) => (
        <div
          key={item.id}
          className="absolute whitespace-nowrap text-white/30 dark:text-white/10 font-bold text-lg tracking-wider select-none"
          style={{
            top: `${item.top}%`,
            right: '-100%',
            animation: `float-left ${item.duration}s linear ${item.delay}s infinite`,
          }}
        >
          {item.text}
        </div>
      ))}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-left {
          0% {
            right: -100%;
            transform: translateX(100%);
          }
          100% {
            right: 100%;
            transform: translateX(-100%);
          }
        }
      `}} />
    </div>
  );
}
