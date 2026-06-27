"use client";
import { useState, useEffect } from 'react';
import { siteConfig } from '../siteConfig';
import { useSiteConfig } from './SiteConfigProvider';

export default function BackgroundSlider() {
  const [index, setIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const dbConfig = useSiteConfig();
  // 如果数据库配置了 hero_background_image，优先使用；否则用静态配置
  const images = dbConfig.hero_background_image
    ? [dbConfig.hero_background_image]
    : siteConfig.bgImages;

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setIndex((currentIndex) => {
        setPreviousIndex(currentIndex);
        return (currentIndex + 1) % images.length;
      });
    }, 10000); // 10秒切换一次

    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    if (previousIndex === null) return;

    const timer = setTimeout(() => setPreviousIndex(null), 2000);
    return () => clearTimeout(timer);
  }, [index, previousIndex]);

  const activeImage = images[index];
  const previousImage = previousIndex === null ? null : images[previousIndex];

  return (
    <div className="absolute inset-0 z-[-10] overflow-hidden">
      {previousImage && previousImage !== activeImage && (
        <div
          key={previousImage}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out transform-gpu"
          style={{
            backgroundImage: `url(${previousImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0,
          }}
        />
      )}
      {activeImage && (
        <div
          key={activeImage}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out transform-gpu"
          style={{
            backgroundImage: `url(${activeImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 1,
          }}
        />
      )}
    </div>
  );
}
