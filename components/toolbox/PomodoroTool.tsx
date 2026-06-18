"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

type Phase = 'work' | 'break' | 'idle';

export default function PomodoroTool() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(25 * 60);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const WORK = 25 * 60, BREAK = 5 * 60;
  const total = phase === 'work' ? WORK : BREAK;
  const progress = total > 0 ? ((total - seconds) / total) * 100 : 0;

  useEffect(() => {
    if (phase === 'idle') return;
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          if (phase === 'work') { setPhase('break'); return BREAK; }
          else { setCycles(c => c + 1); setPhase('work'); return WORK; }
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const toggle = () => {
    if (phase === 'idle') { setPhase('work'); setSeconds(WORK); }
    else { setPhase('idle'); if (timerRef.current) clearInterval(timerRef.current); }
  };

  const reset = () => { setPhase('idle'); setSeconds(WORK); if (timerRef.current) clearInterval(timerRef.current); };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // Circular progress
  const r = 45, c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-700" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={c} strokeDashoffset={offset}
            strokeLinecap="round" className={phase === 'work' ? 'text-indigo-500' : 'text-green-500'} style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</span>
          <span className="text-[10px] font-bold text-slate-400 mt-1">
            {phase === 'idle' ? '准备开始' : phase === 'work' ? '专注中' : '休息中'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <span>🍅 已完成 {cycles} 个番茄</span>
      </div>
      <div className="flex gap-2">
        <button onClick={toggle}
          className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-all active:scale-95">
          {phase === 'idle' ? '开始' : '暂停'}
        </button>
        <button onClick={reset}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-500 transition-all active:scale-95">
          重置
        </button>
      </div>
    </motion.div>
  );
}
