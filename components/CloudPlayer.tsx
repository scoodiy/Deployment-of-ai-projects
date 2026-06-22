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
  const { playlist, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading, togglePlay, nextSong, prevSong, handleSeek } = useMusic();
  const router = useRouter();

  if (isLoading) {
    return <PlayerState icon={<Music2 className="h-5 w-5 animate-pulse" />} title="正在载入音乐" detail="播放列表准备中" />;
  }

  if (playlist.length === 0 || !currentSong) {
    return <PlayerState icon={<Music2 className="h-5 w-5" />} title="暂无音乐" detail="请检查播放列表或网络连接" />;
  }

  const stopClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

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

      <p className="mt-6 h-6 truncate text-sm text-[var(--home-muted)] dark:text-slate-400">{currentLyric || '让音乐陪伴这一刻'}</p>

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

function PlayerState({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <section className="home-surface flex h-full min-h-[300px] flex-col items-center justify-center p-6 text-center">
      <span className="inline-flex h-10 w-10 items-center justify-center border border-[var(--home-border)] text-[var(--home-accent)]">{icon}</span>
      <h2 className="mt-4 text-lg font-bold text-[var(--home-text)] dark:text-slate-100">{title}</h2>
      <p className="mt-1 text-sm text-[var(--home-muted)] dark:text-slate-400">{detail}</p>
    </section>
  );
}
