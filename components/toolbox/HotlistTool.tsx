"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HotItem {
  title: string;
  url?: string;
  hot?: string | number;
  desc?: string;
  source?: string;
}

export default function HotlistTool() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<HotItem[]>([]);
  const [error, setError] = useState('');
  const [activeSource, setActiveSource] = useState('all');
  const [sources, setSources] = useState<string[]>([]);

  // 加载可用热榜类型
  useEffect(() => {
    fetch('/api/hotlist')
      .then(r => r.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          // 提取所有来源
          const srcSet = new Set<string>();
          data.data.forEach((item: any) => {
            if (item.source) srcSet.add(item.source);
            else if (item.platform) srcSet.add(item.platform);
          });
          if (srcSet.size > 0) {
            setSources(['all', ...Array.from(srcSet)]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchHotlist = useCallback(async (type: string = 'all') => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/hotlist?type=${encodeURIComponent(type)}`);
      const raw = await res.json();
      if (raw.error) {
        setError(raw.error);
        return;
      }
      // API returns {success, data: [{title:"微博", data:[{title,url,hot}...]}, ...]}
      const sources = raw.data || raw;
      const flat: HotItem[] = [];
      const srcNames: string[] = [];

      if (Array.isArray(sources)) {
        for (const src of sources) {
          const srcName = src.title || src.source || src.platform || '';
          if (srcName && !srcNames.includes(srcName)) srcNames.push(srcName);
          const items = src.data || src.items || [];
          if (Array.isArray(items)) {
            for (const item of items) {
              flat.push({
                title: item.title || item.name || '',
                url: item.url || item.mobilUrl || item.link || '',
                hot: item.hot || item.heat || item.hotValue || '',
                desc: item.desc || item.description || item.subtitle || '',
                source: srcName,
              });
            }
          }
        }
      }

      // Filter by source
      if (srcNames.length > 0 && !sources.includes(type)) {
        setSources(['all', ...srcNames.slice(0, 8)]);
      }

      const filtered = type === 'all' ? flat : flat.filter(i => i.source === type);
      setItems(filtered.slice(0, 60));
    } catch (e: any) {
      setError('获取热榜失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotlist(activeSource);
  }, [activeSource, fetchHotlist]);

  const handleClick = (item: HotItem) => {
    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-3"
    >
      {/* 来源筛选 */}
      {sources.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {sources.slice(0, 5).map(src => (
            <button
              key={src}
              onClick={() => setActiveSource(src)}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                activeSource === src
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
              }`}
            >
              {src === 'all' ? '全部' : src}
            </button>
          ))}
        </div>
      )}

      {/* 刷新按钮 */}
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-400">
          {items.length > 0 ? `${items.length} 条热搜` : ''}
        </span>
        <button
          onClick={() => fetchHotlist(activeSource)}
          disabled={loading}
          className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold transition-colors disabled:opacity-40"
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      {/* 热榜列表 */}
      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {items.map((item, index) => {
            const isHot = index < 3;
            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleClick(item)}
                className="w-full flex items-start gap-2 px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-700/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-left border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 group"
              >
                {/* 排名 */}
                <span className={`text-[10px] font-black w-4 flex-shrink-0 mt-0.5 ${
                  isHot ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {index + 1}
                </span>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold truncate ${
                    isHot ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'
                  } group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors`}>
                    {item.title}
                  </div>
                  {item.desc && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {item.desc}
                    </div>
                  )}
                </div>

                {/* 热度 */}
                {item.hot && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                    {typeof item.hot === 'number' ? (item.hot > 10000 ? `${(item.hot / 10000).toFixed(1)}万` : item.hot) : item.hot}
                  </span>
                )}

                {/* 来源 */}
                {item.source && (
                  <span className="text-[9px] text-slate-300 dark:text-slate-600 flex-shrink-0">
                    {item.source}
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        {!loading && items.length === 0 && !error && (
          <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-[10px]">
            <svg className="w-6 h-6 mb-1 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            点击刷新获取热榜
          </div>
        )}
      </div>
    </motion.div>
  );
}
