"use client";
import { useTheme } from './ThemeProvider';
import { useState, useEffect } from 'react';
import Fireflies from './Fireflies';
import Sakura from './Sakura';
import WindyGrass from './WindyGrass';

export default function BackgroundEffects() {
  const { isDark } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 移动端禁用过重的粒子动画以提升性能
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) return null;

  return (
    <>
      <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <Fireflies />
      </div>
      <div className={`transition-opacity duration-1000 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <Sakura />
      </div>
      <WindyGrass />
    </>
  );
}
