"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

const ROWS = 9, COLS = 9, MINES = 10;

function createBoard() {
  const board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, count: 0 }))
  );
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
    if (!board[r][c].mine) { board[r][c].mine = true; placed++; }
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (board[r][c].mine) continue;
    let cnt = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) cnt++;
    }
    board[r][c].count = cnt;
  }
  return board;
}


export default function MinesweeperGame() {
  const [board, setBoard] = useState(createBoard);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const reveal = (r: number, c: number) => {
    if (gameOver || won || board[r][c].revealed || board[r][c].flagged) return;
    const nb = board.map(row => row.map(cell => ({ ...cell })));
    if (nb[r][c].mine) {
      nb.forEach(row => row.forEach(cell => { if (cell.mine) cell.revealed = true; }));
      setBoard(nb); setGameOver(true); return;
    }
    const flood = (rr: number, cc: number) => {
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || nb[rr][cc].revealed || nb[rr][cc].mine) return;
      nb[rr][cc].revealed = true;
      if (nb[rr][cc].count === 0) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) flood(rr + dr, cc + dc);
    };
    flood(r, c);
    const unrevealed = nb.flat().filter(c => !c.revealed && !c.mine).length;
    if (unrevealed === 0) setWon(true);
    setBoard(nb);
  };

  const flag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won || board[r][c].revealed) return;
    const nb = board.map(row => row.map(cell => ({ ...cell })));
    nb[r][c].flagged = !nb[r][c].flagged;
    setBoard(nb);
  };

  const newGame = () => { setBoard(createBoard()); setGameOver(false); setWon(false); };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-3">
      <div className="flex justify-between w-full items-center">
        <div className="text-xs text-slate-500">💣 {MINES} 雷 | 🚩 {board.flat().filter(c => c.flagged).length} 标记</div>
        <button onClick={newGame} className="px-3 py-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600 active:scale-95">新游戏</button>
      </div>
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {board.map((row, r) => row.map((cell, c) => (
          <button key={`${r}-${c}`} onClick={() => reveal(r, c)} onContextMenu={e => flag(e, r, c)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
              cell.revealed
                ? cell.mine ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-slate-600'
                : cell.flagged ? 'bg-amber-200 dark:bg-amber-800' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}>
            {cell.revealed ? (cell.mine ? '💣' : cell.count || '') : cell.flagged ? '🚩' : ''}
          </button>
        )))}
      </div>
      {gameOver && <div className="text-red-500 font-bold text-sm">💥 踩雷了！</div>}
      {won && <div className="text-green-500 font-bold text-sm">🎉 恭喜通关！</div>}
      <p className="text-[10px] text-slate-400">左键揭开，右键标记</p>
    </motion.div>
  );
}
