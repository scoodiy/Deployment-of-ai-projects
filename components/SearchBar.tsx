"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

interface Post {
  slug: string;
  title?: string;
  description?: string;
  tags?: string[];
  date?: string;
  cover?: string;
}

interface Tool {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cat: string;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const Highlight = ({ text = '', query = '' }) => {
  if (!query.trim() || !text) return <>{text}</>;

  const safeQuery = escapeRegExp(query);
  const regex = new RegExp(`(${safeQuery})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-500/80 text-slate-900 dark:text-white px-1 mx-[1px] rounded-[4px] shadow-sm font-bold transition-all">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const ALL_TOOLS: Tool[] = [
  { id: 'weather', name: '天气', desc: '实时天气查询，支持全国城市', icon: '🌤️', cat: '查询' },
  { id: 'map', name: '地图', desc: '地点搜索、地图预览、一键导航', icon: '🗺️', cat: '查询' },
  { id: 'stock', name: '股票', desc: '同花顺行情、问财自然语言查询', icon: '📈', cat: '查询' },
  { id: 'hotlist', name: '热榜', desc: '多平台热搜聚合，一站速览', icon: '🔥', cat: '查询' },
  { id: 'ip', name: 'IP 查询', desc: '查询 IP 归属地、运营商', icon: '🌐', cat: '查询' },
  { id: 'translate', name: '翻译', desc: '多语言互译，中英日韩法', icon: '💬', cat: '工具' },
  { id: 'calc', name: '计算器', desc: '快捷计算，支持基本运算', icon: '🧮', cat: '工具' },
  { id: 'json', name: 'JSON', desc: 'JSON 格式化、压缩、校验', icon: '📋', cat: '工具' },
  { id: 'qrcode', name: '二维码', desc: '文本、链接生成二维码', icon: '📱', cat: '工具' },
  { id: 'pomodoro', name: '番茄钟', desc: '25分钟专注 + 5分钟休息', icon: '🍅', cat: '效率' },
  { id: '2048', name: '2048', desc: '经典数字合并游戏', icon: '🎲', cat: '游戏' },
  { id: 'snake', name: '贪吃蛇', desc: '经典贪吃蛇小游戏', icon: '🐍', cat: '游戏' },
  { id: 'minesweeper', name: '扫雷', desc: '经典扫雷，9×9 十颗雷', icon: '💣', cat: '游戏' },
  { id: 'sudoku', name: '数独', desc: '逻辑数独，锻炼大脑', icon: '🧩', cat: '游戏' },
];

export default function SearchBar({ posts = [] }: { posts: Post[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { posts: [], tools: [] };
    const query = searchQuery.toLowerCase();

    const matchedPosts = posts.filter(post => {
      const titleMatch = (post.title || '').toLowerCase().includes(query);
      const descMatch = (post.description || '').toLowerCase().includes(query);
      const tagMatch = (post.tags || []).some(tag => tag.toLowerCase().includes(query));
      return titleMatch || descMatch || tagMatch;
    });

    const matchedTools = ALL_TOOLS.filter(tool => {
      const nameMatch = tool.name.toLowerCase().includes(query);
      const descMatch = tool.desc.toLowerCase().includes(query);
      const catMatch = tool.cat.toLowerCase().includes(query);
      // 额外关键词映射
      const keywords: Record<string, string[]> = {
        'snake': ['蛇', '贪吃蛇'], '贪吃蛇': ['snake'],
        '2048': ['数字游戏'], '扫雷': ['minesweeper', '地雷'],
        '数独': ['sudoku'], '天气': ['weather', '温度', '气温'],
        '地图': ['map', '导航'], '股票': ['stock', '行情'],
        '热榜': ['hotlist', '热搜'], '翻译': ['translate'],
        '计算器': ['calc', '计算'], 'json': ['格式化', '压缩'],
        '二维码': ['qrcode', 'qr'], '番茄钟': ['pomodoro', '专注'],
        'ip': ['ip查询', '归属地'],
      };
      const extraMatch = Object.entries(keywords).some(([key, vals]) => {
        if (query.includes(key) || key.includes(query)) return true;
        return vals.some(v => query.includes(v) || v.includes(query));
      });

      return nameMatch || descMatch || catMatch || (extraMatch && (query.length >= 2));
    });

    return { posts: matchedPosts, tools: matchedTools };
  }, [searchQuery, posts]);

  const hasResults = searchResults.posts.length > 0 || searchResults.tools.length > 0;

  return (
    <div className="relative w-full max-w-sm mx-auto mb-5 z-30" ref={containerRef}>
      <form className="relative group" onSubmit={(e) => e.preventDefault()}>

        {/* 先渲染 Input */}
        <input
          type="text"
          className="w-full pl-9 pr-4 py-1.5 bg-white/50 dark:bg-slate-800/30 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-200 transition-all placeholder-slate-500 dark:placeholder-slate-400 font-medium text-xs relative z-0"
          placeholder="搜文章、工具、游戏..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          spellCheck="false"
        />

        {/* 🌟 核心修复：把放大镜放在 input 之后，并且加上 z-10 强制置顶！ */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none select-none z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors drop-shadow-sm"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

      </form>

      <AnimatePresence>
        {isOpen && searchQuery.trim() !== '' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden max-h-[450px] overflow-y-auto z-20"
          >
            {hasResults ? (
              <div className="flex flex-col">
                {/* 工具/游戏结果 */}
                {searchResults.tools.length > 0 && (
                  <div>
                    <div className="px-4 py-2 border-b border-slate-100/50 dark:border-slate-800/50">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">工具 / 游戏</span>
                    </div>
                    {searchResults.tools.map((tool) => (
                      <Link
                        href={`/tools#${tool.id}`}
                        key={tool.id}
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-3 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-colors border-b border-slate-100/50 dark:border-slate-800/50 flex items-center gap-3"
                      >
                        <span className="text-xl flex-shrink-0">{tool.icon}</span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            <Highlight text={tool.name} query={searchQuery} />
                          </h4>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                            <Highlight text={tool.desc} query={searchQuery} />
                          </p>
                        </div>
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium flex-shrink-0">{tool.cat}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* 文章结果 */}
                {searchResults.posts.length > 0 && (
                  <div>
                    <div className="px-4 py-2 border-b border-slate-100/50 dark:border-slate-800/50">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">文章</span>
                    </div>
                    {searchResults.posts.map((post) => (
                      <Link
                        href={`/posts/${post.slug}`}
                        key={post.slug}
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-3 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-colors group border-b border-slate-100/50 dark:border-slate-800/50 last:border-0 flex flex-col gap-1"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors line-clamp-1">
                            <Highlight text={post.title} query={searchQuery} />
                          </h4>
                          {post.date && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded shrink-0">
                              {post.date.split(' ')[0] || post.date.split('T')[0]}
                            </span>
                          )}
                        </div>

                        {post.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                            <Highlight text={post.description} query={searchQuery} />
                          </p>
                        )}

                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {post.tags.map(tag => (
                              <span key={tag} className="flex items-center text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                <Highlight text={tag} query={searchQuery} />
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 py-10 text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400">
                    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  未找到 &ldquo;<span className="text-indigo-500 font-bold">{searchQuery}</span>&rdquo; 相关内容
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
