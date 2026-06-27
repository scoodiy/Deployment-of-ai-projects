"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { siteConfig } from '../siteConfig';

interface RawSongEntry {
  id?: string;
  url?: string;
  error?: string;
  name?: string;
  artist?: string;
  author?: string;
  cover?: string;
  pic?: string;
  lrc?: string;
}

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lrcUrl: string | null;
  lyrics: { time: number; text: string }[];
  lrc?: string;
  lyric?: string;
  pic?: string;
  name?: string;
  author?: string;
}

// 【增强版 LRC 歌词解析】
function parseLrc(lrcText: string) {
  if (!lrcText || lrcText.length > 30000) return [];

  const lines = lrcText.split(/\r?\n/);
  const result = [];

  for (const line of lines) {
    const matches = [...line.matchAll(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (matches.length > 0) {
      const text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

      // 剔除控制字符
      const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, "");

      if (cleanText) {
        for (const match of matches) {
          const min = parseInt(match[1]);
          const sec = parseInt(match[2]);
          const ms = match[3] ? parseInt(match[3]) : 0;
          const divisor = match[3] && match[3].length === 3 ? 1000 : 100;
          const time = min * 60 + sec + ms / divisor;
          result.push({ time, text: cleanText });
        }
      }
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

// 🌟 1. 扩充 Context 类型，加入 MusicPage 需要的所有属性
type PlayMode = 'loop' | 'single' | 'random';

interface MusicContextType {
  playlist: MusicTrack[];
  currentIndex: number;
  currentSong: MusicTrack | undefined;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
  currentLyricIndex: number;
  lyrics: { time: number; text: string }[];
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  playMode: PlayMode;

  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  playSong: (index: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  togglePlayMode: () => void;
  retryFetch: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylist] = useState<MusicTrack[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem('music_playlist');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [currentLyric, setCurrentLyric] = useState("ONLINE");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUserActivated, setHasUserActivated] = useState(false);

  // 🌟 2. 新增音量和播放模式状态
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('loop');

  const audioRef = useRef<HTMLAudioElement>(null);
  const hasFetchedRef = useRef(false);

  const fetchMusicData = () => {
    if (hasFetchedRef.current || siteConfig.cloudMusicIds?.length === 0) return;
    hasFetchedRef.current = true;
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    (async () => {
      try {
        const res = await fetch('/api/music', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawResults = await res.json();

        const mergedPlaylist: MusicTrack[] = rawResults
          .filter((song: RawSongEntry) => song && song.url && !song.error)
          .map((song: RawSongEntry) => ({
            id: song.id || Math.random().toString(),
            title: song.name || '未知歌曲',
            artist: song.artist || song.author || '未知歌手',
            cover: song.cover || song.pic || 'https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg',
            src: song.url!,
            lrcUrl: null,
            lyrics: song.lrc ? parseLrc(song.lrc) : []
          }));

        if (mergedPlaylist.length > 0) {
          setPlaylist(mergedPlaylist);
          try { localStorage.setItem('music_playlist', JSON.stringify(mergedPlaylist)); } catch { /* ignore */ }
          setIsLoading(false);
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
              setIsPlaying(true);
            }
          }, 100);
        } else {
          setCurrentLyric("云端链路受阻");
          setIsLoading(false);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setCurrentLyric("网络初始化失败");
        }
        setIsLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    })();
  };

  const retryFetch = () => {
    setHasUserActivated(true);
    hasFetchedRef.current = false;
    setPlaylist([]);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    (async () => {
      try {
        const res = await fetch('/api/music', { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rawResults = await res.json();
        const mergedPlaylist: MusicTrack[] = rawResults
          .filter((song: RawSongEntry) => song && song.url && !song.error)
          .map((song: RawSongEntry) => ({
            id: song.id || Math.random().toString(),
            title: song.name || '未知歌曲',
            artist: song.artist || song.author || '未知歌手',
            cover: song.cover || song.pic || 'https://bu.dusays.com/2026/03/24/69c24230a5ff8.jpg',
            src: song.url!,
            lrcUrl: null,
            lyrics: song.lrc ? parseLrc(song.lrc) : []
          }));
        hasFetchedRef.current = true;
        if (mergedPlaylist.length > 0) {
          setPlaylist(mergedPlaylist);
          try { localStorage.setItem('music_playlist', JSON.stringify(mergedPlaylist)); } catch {}
          setIsLoading(false);
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
              setIsPlaying(true);
            }
          }, 100);
        } else {
          setCurrentLyric("云端链路受阻");
          setIsLoading(false);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setCurrentLyric("网络初始化失败");
        }
        setIsLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    })();
  };

  useEffect(() => {
    if (playlist.length === 0) return;
    let isMounted = true;
    const currentSong = playlist[currentIndex];
    setLyrics([]);
    setCurrentLyric("♪ 正在缓冲 ♪");
    if (currentSong.lyrics && currentSong.lyrics.length > 0) {
      if (isMounted) {
        setLyrics(currentSong.lyrics);
        setCurrentLyric(currentSong.lyrics[0]?.text || "\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a");
      }
    } else if (currentSong.lrcUrl) {
      fetch(currentSong.lrcUrl)
        .then(res => res.text())
        .then(text => {
          if (isMounted) {
             const parsed = parseLrc(text);
             setLyrics(parsed);
             setPlaylist(prev => {
                const newPlaylist = [...prev];
                newPlaylist[currentIndex].lyrics = parsed;
                return newPlaylist;
             });
          }
        })
        .catch(() => { if (isMounted) setCurrentLyric("\u266a \u7eaf\u4eab\u97f3\u4e50 \u266a"); });
    }

    if (hasUserActivated && isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
    return () => { isMounted = false; };
  }, [currentIndex, playlist, hasUserActivated, isPlaying]);

  // 🌟 4. 同步音量到 audio 元素
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    setHasUserActivated(true);
    if (playlist.length === 0) {
      fetchMusicData();
      return;
    }

    if (!hasUserActivated) {
      setIsPlaying(true);
      return;
    }

    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(!isPlaying);
    }
  };

  // 🌟 5. 重写 nextSong，加入对随机模式的处理
  const nextSong = () => {
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const prevSong = () => {
    if (playMode === 'random') {
      setCurrentIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    }
  };

  // 🌟 6. 暴露直接播放指定歌曲的方法
  const playSong = (index: number) => {
    setCurrentIndex(index);
    if (!isPlaying) setIsPlaying(true); // 保证切歌后自动播放
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const { currentTime, duration } = audioRef.current;
      setCurrentTime(currentTime);
      setDuration(duration || 0);
      setProgress((currentTime / (duration || 1)) * 100);

      if (lyrics.length > 0) {
        const activeLyricIdx = lyrics.slice().reverse().findIndex(l => currentTime >= l.time);
        if (activeLyricIdx >= 0) {
          const realIdx = lyrics.length - 1 - activeLyricIdx;
          const activeLyric = lyrics[realIdx];
          if (activeLyric.text !== currentLyric) {
            setCurrentLyric(activeLyric.text);
            setCurrentLyricIndex(realIdx);
          }
        }
      }
    }
  };

  // 🌟 7. 处理歌曲结束
  const handleEnded = () => {
    if (playMode === 'single' && audioRef.current) {
       audioRef.current.currentTime = 0;
       audioRef.current.play();
    } else {
       nextSong();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (isMuted && val > 0) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const togglePlayMode = () => {
    setPlayMode(prev => {
      if (prev === 'loop') return 'single';
      if (prev === 'single') return 'random';
      return 'loop';
    });
  };

  const currentSong = playlist[currentIndex];
  const activeAudioSrc = hasUserActivated ? currentSong?.src : undefined;

  return (
    <MusicContext.Provider value={{
        playlist, currentIndex, currentSong, isPlaying, progress, currentTime, duration, currentLyric, isLoading,
        lyrics, currentLyricIndex,
        volume, isMuted, playMode, // 暴露新状态
        togglePlay, nextSong, prevSong, handleSeek,
        playSong, setVolume, toggleMute, togglePlayMode, // 暴露新方法
        retryFetch // 重试
    }}>
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={activeAudioSrc}
          preload="none"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded} // 使用我们重写的结束处理
          onLoadedMetadata={handleTimeUpdate}
        />
      )}
    </MusicContext.Provider>
  );
}

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error("useMusic must be used within MusicProvider");
  return context;
};
