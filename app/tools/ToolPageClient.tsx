"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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
import DailyStockTool from '../../components/toolbox/DailyStockTool';
import Game2048 from '../../components/toolbox/games/Game2048';
import SnakeGame from '../../components/toolbox/games/SnakeGame';
import MinesweeperGame from '../../components/toolbox/games/MinesweeperGame';
import SudokuGame from '../../components/toolbox/games/SudokuGame';
import { getToolBySlug } from './toolCatalog';

const TOOL_COMPONENTS = {
  weather: WeatherTool,
  map: MapTool,
  stock: StockTool,
  hotlist: HotlistTool,
  ip: IpTool,
  translate: TranslateTool,
  calc: CalculatorTool,
  json: JsonTool,
  qrcode: QrCodeTool,
  pomodoro: PomodoroTool,
  'daily-stock': DailyStockTool,
  '2048': Game2048,
  snake: SnakeGame,
  minesweeper: MinesweeperGame,
  sudoku: SudokuGame,
} as const;

interface ToolPageClientProps {
  slug: string;
}

export default function ToolPageClient({ slug }: ToolPageClientProps) {
  const router = useRouter();
  const tool = getToolBySlug(slug);
  const ToolComponent = tool ? TOOL_COMPONENTS[tool.id as keyof typeof TOOL_COMPONENTS] : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        router.push('/tools');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  if (!tool || !ToolComponent) {
    return (
      <div className="min-h-screen relative pb-10">
        <Navbar />
        <PageTransition>
          <div className="w-full max-w-lg mx-auto mt-24 sm:mt-28 px-4 relative z-10">
            <div className="bg-white/30 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl rounded-3xl p-6 text-center">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">工具不存在</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">这个工具入口可能已经移动。</p>
              <Link href="/tools" className="inline-flex mt-5 px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors">
                返回工具箱
              </Link>
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/tools"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              aria-label="返回工具箱"
            >
              <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                <span className="mr-2">{tool.icon}</span>
                {tool.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tool.desc}</p>
            </div>
          </div>

          <div className="bg-white/30 dark:bg-slate-800/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl rounded-3xl p-5 sm:p-6">
            <div className={`mx-auto ${tool.wide ? 'max-w-3xl' : 'max-w-md'}`}>
              <ToolComponent />
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500">按 Esc 返回工具箱</p>
          </div>
        </motion.div>
      </PageTransition>
    </div>
  );
}
