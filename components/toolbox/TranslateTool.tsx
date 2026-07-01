"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';

const LANGUAGES = [
  { label: '自动检测', value: 'auto' },
  { label: '中文', value: 'zh-CN' },
  { label: '英文', value: 'en' },
  { label: '日语', value: 'ja' },
  { label: '韩语', value: 'ko' },
  { label: '法语', value: 'fr' },
];

const TARGET_LANGUAGES = [
  { label: '中文', value: 'zh-CN' },
  { label: '英文', value: 'en' },
  { label: '日语', value: 'ja' },
  { label: '韩语', value: 'ko' },
  { label: '法语', value: 'fr' },
];

export default function TranslateTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('zh-CN');

  const doTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const langpair = `${sourceLang}|${targetLang}`;
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${langpair}`
      );
      const data = await res.json();
      setOutput(data.responseData?.translatedText || '翻译失败');
    } catch { setOutput('翻译服务暂时不可用'); }
    finally { setLoading(false); }
  };

  const handleSwap = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3">
      <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="输入要翻译的文本..." rows={3}
        className="w-full px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 resize-none" />
      <div className="flex items-center gap-2">
        <select value={sourceLang} onChange={e => setSourceLang(e.target.value)}
          className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400">
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
        <button onClick={handleSwap} disabled={sourceLang === 'auto'}
          className="px-2 py-1.5 text-sm rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-40 transition-all">
          🔄
        </button>
        <select value={targetLang} onChange={e => setTargetLang(e.target.value)}
          className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-400">
          {TARGET_LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
      </div>
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
