"use client";
import { useEffect, useRef, useState } from 'react';
import { useMusic } from './MusicProvider';

export default function LyricBar() {
  const { isPlaying, currentSong, lyrics, currentLyricIndex } = useMusic();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(5);

  // 根据容器宽度动态计算显示行数
  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // 歌词条用于快速预览，按更紧凑的宽度估算让一行能展示更多句。
        const lines = Math.max(3, Math.floor(width / 150));
        setDisplayCount(Math.min(lines, 7)); // 最多显示 7 句
      }
    });
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, []);

  if (!currentSong) return null;

  // 当前行居中
  const half = Math.floor(displayCount / 2);
  const start = Math.max(0, currentLyricIndex - half);
  const end = Math.min(lyrics.length, start + displayCount);
  const visibleLyrics = lyrics.slice(start, end);

  const waves = [
    { color: 'bg-indigo-400', delay: '0ms' },
    { color: 'bg-purple-400', delay: '200ms' },
    { color: 'bg-indigo-500', delay: '400ms' },
    { color: 'bg-purple-500', delay: '100ms' },
    { color: 'bg-indigo-300', delay: '300ms' },
  ];

  return (
    <>
      <style>{`
        @keyframes safeWave {
          0%, 100% { height: 8px; }
          50% { height: 28px; }
        }
        .safe-wave-active {
          animation: safeWave 1s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full rounded-3xl bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-xl border border-white/10 shadow-2xl p-5 flex items-center justify-between transition-all duration-700 hover:shadow-indigo-500/20 group h-20">

        {/* 波形 */}
        <div className="flex items-end justify-center gap-[4px] h-8 w-16 shrink-0">
          {waves.map((wave, index) => (
            <div
              key={index}
              className={`w-1.5 rounded-t-sm transition-all duration-500 ease-out ${
                isPlaying
                  ? `${wave.color} safe-wave-active`
                  : 'h-1 bg-slate-600 shadow-none'
              }`}
              style={{
                animationDelay: wave.delay,
                height: isPlaying ? undefined : '4px'
              }}
            />
          ))}
        </div>

        {/* 多行歌词 */}
        <div ref={scrollRef} className="flex-1 px-6 flex justify-center items-center gap-4 overflow-hidden">
          {visibleLyrics.length > 0 ? (
            visibleLyrics.map((lyric, idx) => {
              const globalIndex = start + idx;
              const isCurrent = globalIndex === currentLyricIndex;
              return (
                <p
                  key={globalIndex}
                  className={`whitespace-nowrap transition-all duration-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] ${
                    isCurrent
                      ? 'text-lg font-bold text-white scale-110'
                      : 'text-sm text-slate-400 opacity-50'
                  }`}
                >
                  {lyric.text || '♪'}
                </p>
              );
            })
          ) : (
            <p className="text-white text-lg font-bold tracking-widest drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]">
              ♪ 纯享音乐 ♪
            </p>
          )}
        </div>

        {/* 音乐图标 */}
        <div className="w-16 flex justify-end shrink-0">
          <svg className={`w-6 h-6 text-indigo-400/50 transition-all duration-500 ${isPlaying ? 'animate-bounce' : 'opacity-30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
      </div>
    </>
  );
}
