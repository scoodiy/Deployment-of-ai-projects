"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function JsonTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    try {
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj, null, 2));
      setError('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '解析失败'); setOutput(''); }
  };

  const minify = () => {
    try {
      const obj = JSON.parse(input);
      setOutput(JSON.stringify(obj));
      setError('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : '解析失败'); setOutput(''); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder='粘贴 JSON...' rows={4}
        className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 resize-none" />
      <div className="flex gap-1.5">
        <button onClick={format} className="flex-1 min-h-[44px] bg-indigo-500 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-all active:scale-95">格式化</button>
        <button onClick={minify} className="flex-1 min-h-[44px] bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-500 transition-all active:scale-95">压缩</button>
      </div>
      {error && <div className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{error}</div>}
      {output && <pre className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-[11px] font-mono text-slate-700 dark:text-slate-200 overflow-auto max-h-48 whitespace-pre-wrap">{output}</pre>}
    </motion.div>
  );
}
