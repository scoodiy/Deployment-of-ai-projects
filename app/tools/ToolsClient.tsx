"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { getToolById, getToolBySlug, TOOL_CATALOG, TOOL_CATEGORIES } from './toolCatalog';

export default function ToolsClient() {
  const router = useRouter();
  const [cat, setCat] = useState<(typeof TOOL_CATEGORIES)[number]>('全部');
  const filtered = cat === '全部' ? TOOL_CATALOG : TOOL_CATALOG.filter((tool) => tool.cat === cat);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const tool = getToolBySlug(hash) || getToolById(hash);
    if (tool) {
      router.replace(tool.href);
    }
  }, [router]);

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <div className="w-full max-w-4xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">工具箱</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">实用工具 · 效率提升 · 小游戏</p>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {TOOL_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setCat(category)}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${
                  cat === category
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-white/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-white/40 dark:border-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((tool, index) => (
              <motion.div
                key={tool.id}
                id={`tool-${tool.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  href={tool.href}
                  className="group h-full min-h-[132px] text-left p-4 rounded-2xl border transition-all duration-300 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.02] flex flex-col"
                >
                  <span className="text-2xl block mb-2">{tool.icon}</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{tool.name}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 flex-1">{tool.desc}</p>
                  <span className="mt-3 text-[10px] font-bold text-indigo-500 dark:text-indigo-300 opacity-80 group-hover:opacity-100">
                    进入功能
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
