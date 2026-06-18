"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const SIZE = 20;
const CELL = 15;

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const dirRef = useRef({ x: 1, y: 0 });
  const snakeRef = useRef([{ x: 10, y: 10 }]);
  const foodRef = useRef({ x: 15, y: 15 });
  const scoreRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE * CELL, SIZE * CELL);
    // Grid
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#1e293b' : '#f1f5f9';
    ctx.fillRect(0, 0, SIZE * CELL, SIZE * CELL);
    // Food
    const f = foodRef.current;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    // Snake
    snakeRef.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#6366f1' : '#818cf8';
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      if (i === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(s.x * CELL + 4, s.y * CELL + 4, 3, 3); ctx.fillRect(s.x * CELL + 9, s.y * CELL + 4, 3, 3); }
    });
  }, []);

  const placeFood = () => {
    let pos: { x: number; y: number };
    do { pos = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) }; }
    while (snakeRef.current.some(s => s.x === pos.x && s.y === pos.y));
    foodRef.current = pos;
  };

  const tick = useCallback(() => {
    const snake = snakeRef.current;
    const dir = dirRef.current;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE || snake.some(s => s.x === head.x && s.y === head.y)) {
      setGameOver(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setBest(b => Math.max(b, scoreRef.current));
      return;
    }
    snake.unshift(head);
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      placeFood();
    } else { snake.pop(); }
    draw();
  }, [draw]);

  const start = () => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setStarted(true);
    placeFood();
    draw();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 150);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const map: Record<string, { x: number; y: number }> = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      };
      if (map[e.key]) {
        e.preventDefault();
        const d = map[e.key];
        if (d.x !== -dirRef.current.x || d.y !== -dirRef.current.y) dirRef.current = d;
      }
    };
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tick]);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-3">
      <div className="flex justify-between w-full items-center">
        <div className="flex gap-3">
          <div className="text-center"><div className="text-lg font-black text-indigo-600">{score}</div><div className="text-[9px] text-slate-400">得分</div></div>
          <div className="text-center"><div className="text-lg font-black text-slate-500">{best}</div><div className="text-[9px] text-slate-400">最高</div></div>
        </div>
        <button onClick={start} className="px-3 py-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600 active:scale-95">
          {started ? '重新开始' : '开始'}
        </button>
      </div>
      <canvas ref={canvasRef} width={SIZE * CELL} height={SIZE * CELL} className="rounded-xl border border-slate-200 dark:border-slate-700" />
      <div className="flex flex-col items-center gap-1 sm:hidden">
        <button onClick={() => { dirRef.current = { x: 0, y: -1 }; }} className="w-12 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold">↑</button>
        <div className="flex gap-1">
          <button onClick={() => { dirRef.current = { x: -1, y: 0 }; }} className="w-12 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold">←</button>
          <button onClick={() => { dirRef.current = { x: 0, y: 1 }; }} className="w-12 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold">↓</button>
          <button onClick={() => { dirRef.current = { x: 1, y: 0 }; }} className="w-12 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold">→</button>
        </div>
      </div>
      {gameOver && <div className="text-red-500 font-bold text-sm">游戏结束！得分：{score}</div>}
    </motion.div>
  );
}
