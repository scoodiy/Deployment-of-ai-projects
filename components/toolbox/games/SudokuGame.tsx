"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

const PUZZLES = [
  { puzzle: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179' },
  { puzzle: '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
    solution: '245981376169273584837564219976125434513498627482736951391657842728349165654812793' },
  { puzzle: '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
    solution: '483921657967345821251876493548132976729564138136789245372698514814253769695417382' },
];


export default function SudokuGame() {
  const [puzzleIdx, setPuzzleIdx] = useState(() => Math.floor(Math.random() * PUZZLES.length));
  const [board, setBoard] = useState<number[][]>(() => {
    const p = PUZZLES[puzzleIdx].puzzle;
    return Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => parseInt(p[i * 9 + j])));
  });
  const [fixed] = useState<boolean[][]>(() => {
    const p = PUZZLES[puzzleIdx].puzzle;
    return Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => p[i * 9 + j] !== '0'));
  });
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);

  const setCell = (r: number, c: number, val: number) => {
    if (fixed[r][c] || solved) return;
    const nb = board.map(row => [...row]);
    nb[r][c] = val;
    setBoard(nb);
    // Check errors
    const errs = new Set<string>();
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
      if (nb[i][j] === 0) continue;
      for (let k = 0; k < 9; k++) {
        if (k !== j && nb[i][k] === nb[i][j]) { errs.add(`${i}-${j}`); errs.add(`${i}-${k}`); }
        if (k !== i && nb[k][j] === nb[i][j]) { errs.add(`${i}-${j}`); errs.add(`${k}-${j}`); }
      }
      const br = Math.floor(i / 3) * 3, bc = Math.floor(j / 3) * 3;
      for (let ri = br; ri < br + 3; ri++) for (let ci = bc; ci < bc + 3; ci++) {
        if (ri !== i || ci !== j) { if (nb[ri][ci] === nb[i][j]) { errs.add(`${i}-${j}`); errs.add(`${ri}-${ci}`); } }
      }
    }
    setErrors(errs);
    // Check solved
    const sol = PUZZLES[puzzleIdx].solution;
    const flat = nb.flat().join('');
    if (flat === sol) setSolved(true);
  };

  const newGame = () => {
    const idx = (puzzleIdx + 1) % PUZZLES.length;
    setPuzzleIdx(idx);
    const p = PUZZLES[idx].puzzle;
    setBoard(Array.from({ length: 9 }, (_, i) => Array.from({ length: 9 }, (_, j) => parseInt(p[i * 9 + j]))));
    setErrors(new Set()); setSelected(null); setSolved(false);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-3">
      <div className="flex justify-between w-full items-center">
        <div className="text-xs text-slate-500">数独</div>
        <button onClick={newGame} className="px-3 py-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600 active:scale-95">新游戏</button>
      </div>
      <div className="inline-grid gap-px bg-slate-300 dark:bg-slate-600 p-px rounded-lg overflow-hidden" style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}>
        {board.map((row, r) => row.map((val, c) => {
          const isFixed = fixed[r][c];
          const isError = errors.has(`${r}-${c}`);
          const isSelected = selected && selected[0] === r && selected[1] === c;
          const boxBorder = r % 3 === 0 && r > 0 ? 'border-t-2 border-t-slate-400 dark:border-t-slate-500' : '';
          const boxBorderC = c % 3 === 0 && c > 0 ? 'border-l-2 border-l-slate-400 dark:border-l-slate-500' : '';
          return (
            <button key={`${r}-${c}`}
              onClick={() => setSelected([r, c])}
              className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${boxBorder} ${boxBorderC}
                ${isSelected ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-white dark:bg-slate-700'}
                ${isFixed ? 'text-slate-800 dark:text-white' : 'text-indigo-600 dark:text-indigo-400'}
                ${isError ? 'text-red-500 bg-red-50 dark:bg-red-900/30' : ''}
              `}>
              {val || ''}
            </button>
          );
        }))}
      </div>
      {/* Number input */}
      {selected && !fixed[selected[0]][selected[1]] && (
        <div className="flex gap-1.5 flex-wrap justify-center">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => setCell(selected[0], selected[1], n)}
              className="min-w-[36px] min-h-[36px] px-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800 active:scale-95">{n}</button>
          ))}
          <button onClick={() => setCell(selected[0], selected[1], 0)}
            className="min-w-[36px] min-h-[36px] px-2 bg-slate-200 dark:bg-slate-600 text-slate-500 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-500">✕</button>
        </div>
      )}
      {solved && <div className="text-green-500 font-bold text-sm">🎉 恭喜完成！</div>}
    </motion.div>
  );
}
