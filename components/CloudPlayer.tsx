"use client";

import type { MouseEvent, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ListMusic, Music2, Pause, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useMusic } from './MusicProvider';

const formatTime = (time: number) => {
  if (!time || Number.isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60).toString().padStart(2, '0');
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function CloudPlayer() {
  const {
    playlist,
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    currentLyric,
    lyrics,
    currentLyricIndex,
    isLoading,
    togglePlay,
    nextSong,
    prevSong,
    handleSeek
  } = useMusic();
  const router = useRouter();

  if (isLoading) {
    return <PlayerState icon={<Music2 className="h-5 w-5 animate-pulse" />} title="正在载入音乐" detail="播放列表准备中" />;
  }

  if (playlist.length === 0 || !currentSong) {
    return <PlayerState icon={<Music2 className="h-5 w-5" />} title="音乐未加载" detail="点击播放按钮开始" onStart={togglePlay} />;
  }

  const stopClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const lyricWindowSize = 4;
  const start = Math.max(0, Math.min(currentLyricIndex - 1, lyrics.length - lyricWindowSize));
  const end = Math.min(lyrics.length, start + lyricWindowSize);
  const visibleLyrics = lyrics.slice(start, end);

  return (
    <section
      onClick={() => router.push('/music')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') router.push('/music');
      }}
      className="home-surface flex h-full min-h-[300px] cursor-pointer flex-col p-6 transition-colors"
      role="link"
      tabIndex={0}
      aria-label="前往音乐页面"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[var(--home-border)] bg-slate-100 dark:bg-slate-800">
          <img
            src={currentSong.cover}
            alt={`${currentSong.title}封面`}
            className={`h-full w-full object-cover ${isPlaying ? 'animate-[spin_18s_linear_infinite]' : ''}`}
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--home-accent)]">NOW PLAYING</p>
          <h2 className="mt-1 truncate text-lg font-bold text-[var(--home-text)] dark:text-slate-100">{currentSong.title}</h2>
          <p className="mt-1 truncate text-sm text-[var(--home-muted)] dark:text-slate-400">{currentSong.artist}</p>
        </div>
      </div>

      <div className="mt-6 min-h-[92px] max-h-[124px] space-y-2 overflow-hidden">
        {visibleLyrics.length > 0 ? (
          visibleLyrics.map((lyric, index) => {
            const globalIndex = start + index;
            const isActive = globalIndex === currentLyricIndex;
            return (
              <p
                key={`${globalIndex}-${lyric.time}`}
                className={`line-clamp-1 text-sm transition-colors ${
                  isActive
                    ? 'font-bold text-[var(--home-text)] dark:text-slate-100'
                    : 'text-[var(--home-muted)] dark:text-slate-500'
                }`}
              >
                {lyric.text || '♪'}
              </p>
            );
          })
        ) : (
          <p className="text-sm text-[var(--home-muted)] dark:text-slate-400">{currentLyric || '让音乐陪伴这一刻'}</p>
        )}
      </div>

      <div className="mt-auto" onClick={stopClick} onPointerDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 text-xs text-[var(--home-muted)] dark:text-slate-400">
          <span className="w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="h-1 flex-1 cursor-pointer appearance-none bg-[var(--home-border)]"
            style={{ accentColor: 'var(--home-accent)' }}
            aria-label="播放进度"
          />
          <span className="w-10">{formatTime(duration)}</span>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={(event) => { stopClick(event); prevSong(); }} className="player-control" title="上一首" aria-label="上一首">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={(event) => { stopClick(event); togglePlay(); }} className="inline-flex h-11 w-11 items-center justify-center bg-[var(--home-accent)] text-white transition-colors hover:brightness-95" title={isPlaying ? '暂停' : '播放'} aria-label={isPlaying ? '暂停' : '播放'}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
          <button type="button" onClick={(event) => { stopClick(event); nextSong(); }} className="player-control" title="下一首" aria-label="下一首">
            <ChevronRight className="h-5 w-5" />
          </button>
          <button type="button" onClick={(event) => { stopClick(event); router.push('/music'); }} className="player-control" title="打开歌单" aria-label="打开歌单">
            <ListMusic className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function PlayerState({ icon, title, detail, onStart }: { icon: ReactNode; title: string; detail: string; onStart?: () => void }) {
  return (
    <section className="home-surface flex h-full min-h-[300px] flex-col items-center justify-center p-6 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center border border-[var(--home-border)] text-[var(--home-accent)]">{icon}</span>
      <h2 className="mt-4 text-lg font-bold text-[var(--home-text)] dark:text-slate-100">{title}</h2>
      <p className="mt-1 text-sm text-[var(--home-muted)] dark:text-slate-400">{detail}</p>
      {onStart && (
        <button
          type="button"
          onClick={onStart}
          className="mt-5 inline-flex h-11 w-11 items-center justify-center bg-[var(--home-accent)] text-white transition-colors hover:brightness-95"
          title="播放音乐"
          aria-label="播放音乐"
        >
          <Play className="ml-0.5 h-5 w-5" />
        </button>
      )}
    </section>
  );
}
