"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';

import WeatherTool from '../../components/toolbox/WeatherTool';
import MapTool from '../../components/toolbox/MapTool';
import StockTool from '../../components/toolbox/StockTool';
import HotlistTool from '../../components/toolbox/HotlistTool';
import CalculatorTool from '../../components/toolbox/CalculatorTool';
import TranslateTool from '../../components/toolbox/TranslateTool';
import QrCodeTool from '../../components/toolbox/QrCodeTool';
import JsonTool from '../../components/toolbox/JsonTool';
import IpTool from '../../components/toolbox/IpTool';
import PomodoroTool from '../../components/toolbox/PomodoroTool';
import Game2048 from '../../components/toolbox/games/Game2048';
import SnakeGame from '../../components/toolbox/games/SnakeGame';
import MinesweeperGame from '../../components/toolbox/games/MinesweeperGame';
import SudokuGame from '../../components/toolbox/games/SudokuGame';

const TOOLS = [
  { id: 'weather', name: '天气', desc: '实时天气查询，支持全国城市', icon: '🌤️', cat: '查询', component: <WeatherTool /> },
  { id: 'map', name: '地图', desc: '地点搜索、地图预览、一键导航', icon: '🗺️', cat: '查询', component: <MapTool /> },
  { id: 'stock', name: '股票', desc: '同花顺行情、问财自然语言查询', icon: '📈', cat: '查询', component: <StockTool /> },
  { id: 'hotlist', name: '热榜', desc: '多平台热搜聚合，一站速览', icon: '🔥', cat: '查询', component: <HotlistTool /> },
  { id: 'ip', name: 'IP 查询', desc: '查询 IP 归属地、运营商', icon: '🌐', cat: '查询', component: <IpTool /> },
  { id: 'translate', name: '翻译', desc: '多语言互译，中英日韩法', icon: '💬', cat: '工具', component: <TranslateTool /> },
  { id: 'calc', name: '计算器', desc: '快捷计算，支持基本运算', icon: '🧮', cat: '工具', component: <CalculatorTool /> },
  { id: 'json', name: 'JSON', desc: 'JSON 格式化、压缩、校验', icon: '📋', cat: '工具', component: <JsonTool /> },
  { id: 'qrcode', name: '二维码', desc: '文本、链接生成二维码', icon: '📱', cat: '工具', component: <QrCodeTool /> },
  { id: 'pomodoro', name: '番茄钟', desc: '25分钟专注 + 5分钟休息', icon: '🍅', cat: '效率', component: <PomodoroTool /> },
  { id: '2048', name: '2048', desc: '经典数字合并游戏', icon: '🎲', cat: '游戏', component: <Game2048 /> },
  { id: 'snake', name: '贪吃蛇', desc: '经典贪吃蛇小游戏', icon: '🐍', cat: '游戏', component: <SnakeGame /> },
  { id: 'minesweeper', name: '扫雷', desc: '经典扫雷，9×9 十颗雷', icon: '💣', cat: '游戏', component: <MinesweeperGame /> },
  { id: 'sudoku', name: '数独', desc: '逻辑数独，锻炼大脑', icon: '🧩', cat: '游戏', component: <SudokuGame /> },
];

const CATEGORIES = ['全部', '查询', '工具', '效率', '游戏'];

export default function ToolsClient() {
  function getInitialTool(): { id: string; cat: string } | null {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.replace('#', '');
    const tool = TOOLS.find(t => t.id === hash);
    return tool ? { id: tool.id, cat: tool.cat } : null;
  }

  const [activeId, setActiveId] = useState<string | null>(() => getInitialTool()?.id ?? null);
  const [cat, setCat] = useState(() => getInitialTool()?.cat ?? '全部');
  const activeTool = TOOLS.find(t => t.id === activeId);
  const filtered = cat === '全部' ? TOOLS : TOOLS.filter(t => t.cat === cat);

  // 滚动到工具区域
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    setTimeout(() => {
      document.getElementById(`tool-${hash}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <div className="w-full max-w-4xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">

          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">工具箱</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">实用工具 · 效率提升 · 小游戏</p>
          </div>

          {/* 分类筛选 */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { setCat(c); setActiveId(null); }}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${cat === c ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-white/40 dark:border-white/10'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* 工具网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((tool, index) => {
              const isActive = activeId === tool.id;
              return (
                <motion.button key={tool.id} id={`tool-${tool.id}`}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
                  onClick={() => setActiveId(isActive ? null : tool.id)}
                  className={`text-left p-4 rounded-2xl border transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-400 dark:border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]'
                      : 'bg-white/50 dark:bg-slate-800/30 backdrop-blur-md border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.02]'
                  }`}>
                  <span className="text-2xl block mb-2">{tool.icon}</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{tool.name}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{tool.desc}</p>
                </motion.button>
              );
            })}
          </div>

          {/* 展开的工具区域 */}
          <AnimatePresence mode="wait">
            {activeTool && (
              <motion.div key={activeTool.id}
                initial={{ opacity: 0, y: 20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 25 }}
                className="mt-6 overflow-hidden">
                <div className="bg-white/30 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{activeTool.icon}</span>
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">{activeTool.name}</h2>
                    </div>
                    <button onClick={() => setActiveId(null)}
                      className="text-xs text-slate-400 hover:text-indigo-500 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">收起</button>
                  </div>
                  <div className="max-w-md mx-auto">
                    {activeTool.component}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </PageTransition>
    </div>
  );
}
