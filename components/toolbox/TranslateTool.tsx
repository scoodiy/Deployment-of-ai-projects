"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function TranslateTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState<'zh-en' | 'en-zh'>('zh-en');

  const doTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      // 检测语言方向
      const hasChinese = /[\u4e00-\u9fff]/.test(input);
      const langpair = hasChinese ? 'zh-CN|en' : 'en|zh-CN';

      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${langpair}`
      );
      const data = await res.json();
      setOutput(data.responseData?.translatedText || '翻译失败');
    } catch { setOutput('翻译服务暂时不可用'); }
    finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="输入要翻译的文本..." rows={3}
        className="w-full px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 resize-none" />
      <button onClick={doTranslate} disabled={loading || !input.trim()}
        className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-40 transition-all active:scale-95">
        {loading ? '翻译中...' : '翻译'}
      </button>
      {output && (
        <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-700/40 border border-slate-200/50 dark:border-slate-600/50">
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{output}</p>
        </div>
      )}
    </motion.div>
  );
}
