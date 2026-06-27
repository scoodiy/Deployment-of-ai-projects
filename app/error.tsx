'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('页面错误:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center px-4 max-w-lg">
        <div className="relative inline-block mb-8">
          <h1 className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 via-orange-500 to-yellow-400 leading-none select-none">
            500
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-red-500/20 blur-3xl" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          出了点问题
        </h2>
        <p className="text-slate-400 mb-2 leading-relaxed">
          页面加载时遇到了意外错误，请稍后再试。
        </p>

        {error.digest && (
          <p className="text-slate-600 text-xs font-mono mb-6">错误 ID: {error.digest}</p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重试
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
