"use client";

import { Moon, Sun } from 'lucide-react';

import { useTheme } from './ThemeProvider';

export default function ThemeToggleBlock() {
  const { isDark, toggleTheme } = useTheme();
  const Icon = isDark ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="home-surface flex h-full min-h-[180px] w-full flex-col items-start justify-between p-6 text-left transition-colors"
      aria-label={`切换到${isDark ? '日间' : '夜间'}模式`}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center border border-[var(--home-border)] text-[var(--home-accent)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-lg font-bold text-[var(--home-text)] dark:text-slate-100">{isDark ? '夜间模式' : '日间模式'}</span>
        <span className="mt-1 block text-sm text-[var(--home-muted)] dark:text-slate-400">{isDark ? '为安静的阅读留一点暗色' : '让页面保持清爽与明亮'}</span>
      </span>
    </button>
  );
}
