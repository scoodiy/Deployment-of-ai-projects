"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import MomentList from './MomentList';

interface MomentData {
  id: string;
  date: string;
  location: string;
  images: string[];
  content: string;
}

interface MomentsPageClientProps {
  authorName: string;
  avatarUrl: string;
}

export default function MomentsPageClient({ authorName, avatarUrl }: MomentsPageClientProps) {
  const [moments, setMoments] = useState<MomentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadMoments() {
      try {
        const res = await fetch('/api/moments', { cache: 'no-store' });
        const payload = await res.json().catch(() => ({ success: false, error: '说说数据解析失败' }));
        if (cancelled) return;

        if (!res.ok || !payload.success) {
          setError(payload.error || '说说数据读取失败');
          setMoments([]);
          return;
        }

        setMoments(Array.isArray(payload.data) ? payload.data : []);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : '说说数据读取失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMoments();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-32 flex flex-1 items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/50 px-5 py-4 text-sm font-bold text-slate-600 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
          <Loader2 size={18} className="animate-spin text-indigo-500" />
          正在读取生活动态...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-32 max-w-lg rounded-3xl border border-rose-200 bg-rose-50/90 px-6 py-5 text-center text-sm font-semibold text-rose-700 shadow-xl">
        {error}
      </div>
    );
  }

  return (
    <MomentList
      moments={moments}
      authorName={authorName}
      avatarUrl={avatarUrl}
    />
  );
}
