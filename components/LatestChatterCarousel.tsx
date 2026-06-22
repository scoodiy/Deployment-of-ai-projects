"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Heart, Tag } from 'lucide-react';

type Chatter = {
  slug: string;
  title: string;
  description: string;
  formattedDate?: string;
};

export default function LatestChatterCarousel({ chatters }: { chatters: Chatter[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (chatters.length <= 1) return;
    const timer = window.setInterval(() => setCurrentIndex((previous) => (previous + 1) % chatters.length), 6000);
    return () => window.clearInterval(timer);
  }, [chatters.length]);

  if (chatters.length === 0) return null;

  const currentChatter = chatters[currentIndex];
  const href = currentChatter.slug === 'none' ? '/chatter' : `/chatter/${currentChatter.slug}`;

  return (
    <section className="home-surface relative flex h-full min-h-[300px] flex-col overflow-hidden p-6 md:p-7" aria-labelledby="latest-diary-title">
      <Link href={href} className="absolute inset-0 z-10" aria-label={`阅读日记：${currentChatter.title}`} />
      <div className="pointer-events-none relative z-0">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-[var(--home-accent)]">LATEST DIARY</p>
          <span className="text-xs text-[var(--home-muted)] dark:text-slate-400">{currentChatter.formattedDate || '刚刚更新'}</span>
        </div>
        <h2 id="latest-diary-title" className="mt-5 line-clamp-2 text-2xl font-bold leading-tight text-[var(--home-text)] dark:text-slate-100">{currentChatter.title}</h2>
        <p className="mt-4 line-clamp-4 text-sm leading-7 text-[var(--home-muted)] dark:text-slate-400">{currentChatter.description}</p>
      </div>

      <div className="relative z-20 mt-auto flex items-center justify-between border-t border-[var(--home-border)] pt-5">
        <div className="pointer-events-none flex items-center gap-4 text-xs text-[var(--home-muted)] dark:text-slate-400">
          <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> 日常</span>
          <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> 记录</span>
        </div>
        <div className="flex items-center gap-2">
          {chatters.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 transition-all ${index === currentIndex ? 'w-5 bg-[var(--home-accent)]' : 'w-1.5 bg-[var(--home-border)] hover:bg-[var(--home-muted)]'}`}
              aria-label={`查看第 ${index + 1} 条日记`}
            />
          ))}
          <ArrowUpRight className="ml-2 h-4 w-4 text-[var(--home-accent)]" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
