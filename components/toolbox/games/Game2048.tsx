"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const COLORS: Record<number, string> = {
  0: 'bg-slate-100 dark:bg-slate-800', 2: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
  4: 'bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200',
  8: 'bg-orange-300 dark:bg-orange-700/60 text-white', 16: 'bg-orange-400 dark:bg-orange-600/70 text-white',
  32: 'bg-red-400 text-white', 64: 'bg-red-500 text-white', 128: 'bg-yellow-400 text-white',
  256: 'bg-yellow-500 text-white', 512: 'bg-yellow-600 text-white', 1024: 'bg-indigo-500 text-white',
  2048: 'bg-indigo-600 text-white',
};

const createEmpty = () => Array.from({ length: 4 }, () => Array(4).fill(0));

function addRandom(b: number[][]) {
  const empty: [number, number][] = [];
  b.forEach((r, i) => r.forEach((v, j) => { if (!v) empty.push([i, j]); }));
  if (!empty.length) return;
  const [i, j] = empty[Math.floor(Math.random() * empty.length)];
  b[i][j] = Math.random() < 0.9 ? 2 : 4;
}

function slide(row: number[]) {
  let a = row.filter(v => v);
  for (let i = 0; i < a.length - 1; i++) { if (a[i] === a[i + 1]) { a[i] *= 2; a[i + 1] = 0; } }
  a = a.filter(v => v);
  while (a.length < 4) a.push(0);
  return a;
}

function transpose(b: number[][]) { return b[0].map((_, i) => b.map(r => r[i])); }
function reverse(b: number[][]) { return b.map(r => [...r].reverse()); }

function moveBoard(b: number[][], dir: string): number[][] {
  let m = b.map(r => [...r]);
  if (dir === 'left') m = m.map(r => slide(r));
  else if (dir === 'right') m = reverse(reverse(m).map(r => slide(r)));
  else if (dir === 'up') m = transpose(transpose(m).map(r => slide(r)));
  else if (dir === 'down') m = transpose(reverse(reverse(transpose(m)).map(r => slide(r))));
  return m;
}

function canMove(b: number[][]) {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    if (!b[i][j]) return true;
    if (j < 3 && b[i][j] === b[i][j + 1]) return true;
    if (i < 3 && b[i][j] === b[i + 1][j]) return true;
  }
  return false;
}

function eq(a: number[][], b: number[][]) { return a.flat().join() === b.flat().join(); }

function init() { const b = createEmpty(); addRandom(b); addRandom(b); return b; }

export default function Game2048() {
  const [board, setBoard] = useState(init);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);

  const move = useCallback((dir: string) => {
    const nb = moveBoard(board, dir);
    if (!eq(board, nb)) {
      const oldSum = board.flat().reduce((s, v) => s + v, 0);
      const newSum = nb.flat().reduce((s, v) => s + v, 0);
      addRandom(nb);
      setBoard(nb);
      setScore(s => { const ns = s + newSum - oldSum; setBest(b => Math.max(b, ns)); return ns; });
      if (!canMove(nb)) setOver(true);
    }
  }, [board]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const map: Record<string, string> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [move]);

  const newGame = () => { setBoard(init()); setScore(0); setOver(false); };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-3">
      <div className="flex justify-between w-full items-center">
        <div className="flex gap-3">
          <div className="text-center"><div className="text-lg font-black text-indigo-600">{score}</div><div className="text-[9px] text-slate-400">得分</div></div>
          <div className="text-center"><div className="text-lg font-black text-slate-500">{best}</div><div className="text-[9px] text-slate-400">最高</div></div>
        </div>
        <button onClick={newGame} className="px-3 py-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600 active:scale-95">新游戏</button>
      </div>
      <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-200 dark:bg-slate-700 rounded-xl">
        {board.flat().map((val, i) => (
          <div key={i} className={`w-16 h-16 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-sm sm:text-base font-black ${COLORS[val] || 'bg-red-600 text-white'}`}>
            {val || ''}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1.5 sm:hidden">
        <button onClick={() => move('up')} className="w-14 h-10 bg-slate-300 dark:bg-slate-600 rounded-lg text-sm font-bold active:bg-indigo-400 active:text-white">↑</button>
        <div className="flex gap-1.5">
          <button onClick={() => move('left')} className="w-14 h-10 bg-slate-300 dark:bg-slate-600 rounded-lg text-sm font-bold active:bg-indigo-400 active:text-white">←</button>
          <button onClick={() => move('down')} className="w-14 h-10 bg-slate-300 dark:bg-slate-600 rounded-lg text-sm font-bold active:bg-indigo-400 active:text-white">↓</button>
          <button onClick={() => move('right')} className="w-14 h-10 bg-slate-300 dark:bg-slate-600 rounded-lg text-sm font-bold active:bg-indigo-400 active:text-white">→</button>
        </div>
      </div>
      {over && <div className="text-red-500 font-bold text-sm">游戏结束！</div>}
      <p className="text-[10px] text-slate-400">键盘方向键或按钮移动</p>
    </motion.div>
  );
}
