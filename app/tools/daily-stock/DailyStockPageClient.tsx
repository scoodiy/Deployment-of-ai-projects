"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DailyStockTool from '../../../components/toolbox/DailyStockTool';
import { ArrowLeft } from 'lucide-react';

export default function DailyStockPageClient() {
  const router = useRouter();

  // Handle escape key to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="min-h-screen relative pb-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              📊 每日行情
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              市场涨跌停一网打尽
            </p>
          </div>
        </div>

        {/* Tool content */}
        <div className="bg-white/30 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl rounded-3xl p-6">
          <div className="max-w-md mx-auto">
            <DailyStockTool />
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            数据来源: DSA API · 按 Esc 返回工具箱
          </p>
        </div>
      </motion.div>
    </div>
  );
}
