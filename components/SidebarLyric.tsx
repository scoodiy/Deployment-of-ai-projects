"use client";
import { useMusic } from './MusicProvider';
import { useEffect, useRef, useState } from 'react';

export default function SidebarLyric() {
  const { currentSong, isPlaying, lyrics, currentLyricIndex } = useMusic();
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayCount, setDisplayCount] = useState(5);

  // 根据容器高度动态计算显示行数
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        const lines = Math.max(3, Math.floor(height / 28));
        setDisplayCount(lines % 2 === 0 ? lines + 1 : lines);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!currentSong) return null;

  // 当前行居中
  const half = Math.floor(displayCount / 2);
  const start = Math.max(0, currentLyricIndex - half);
  const end = Math.min(lyrics.length, start + displayCount);
  const visibleLyrics = lyrics.slice(start, end);

  return (
    <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl transition-colors duration-700">
      <h3 className="font-black text-slate-900 dark:text-white mb-4 border-l-4 border-indigo-500 pl-2 text-sm">NOW PLAYING</h3>

      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-md animate-[spin_6s_linear_infinite]"
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        >
          <img src={currentSong.cover} className="w-full h-full object-cover" alt="cover" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentSong.title}</h4>
          <p className="text-xs text-slate-500 truncate">{currentSong.artist}</p>
        </div>
      </div>

      {/* 多行歌词，自适应容器 */}
      <div
        ref={containerRef}
        className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl min-h-[120px] max-h-[240px] flex flex-col items-center justify-center gap-1 overflow-hidden shadow-inner"
      >
        {visibleLyrics.length > 0 ? (
          visibleLyrics.map((lyric, idx) => {
            const globalIndex = start + idx;
            const isCurrent = globalIndex === currentLyricIndex;
            return (
              <p
                key={globalIndex}
                className={`text-center transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${
                  isCurrent
                    ? 'text-sm font-bold text-indigo-600 dark:text-indigo-400 scale-105'
                    : 'text-xs text-slate-400 dark:text-slate-500 opacity-60'
                }`}
              >
                {lyric.text || '♪'}
              </p>
            );
          })
        ) : (
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">♪ 纯享音乐 ♪</p>
        )}
      </div>
    </div>
  );
}
