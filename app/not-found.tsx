import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - 页面不存在',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center px-4">
        <div className="relative inline-block mb-8">
          <h1 className="text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-400 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-indigo-500/20 blur-3xl" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          页面不见了
        </h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          你寻找的页面可能已被移除、移动，或者从未存在过。
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-medium hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回首页
        </Link>
      </div>
    </div>
  );
}
