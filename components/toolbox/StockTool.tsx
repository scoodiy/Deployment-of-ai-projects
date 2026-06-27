"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StockItem {
  [key: string]: string | number | undefined;
}

interface QuoteData {
  [key: string]: string | number | undefined;
}

export default function StockTool() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'wencai'>('search');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StockItem[]>([]);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [error, setError] = useState('');

  const searchStock = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setQuote(null);
    setResults([]);

    try {
      const endpoint = mode === 'wencai'
        ? `/api/stock?action=wencai&question=${encodeURIComponent(query)}`
        : `/api/stock?action=search&keyword=${encodeURIComponent(query)}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (mode === 'wencai') {
        // 问财结果
        if (data.data && Array.isArray(data.data)) {
          setResults(data.data);
        } else if (data.results) {
          setResults(data.results);
        } else {
          setResults([data]);
        }
      } else {
        // 搜索结果 - API returns {success, data: [...]}
        if (data.data && Array.isArray(data.data)) {
          setResults(data.data);
        } else if (data.results && Array.isArray(data.results)) {
          setResults(data.results);
        } else if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([data]);
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '未知错误';
      setError('请求失败: ' + message);
    } finally {
      setLoading(false);
    }
  }, [query, mode]);

  const fetchQuote = useCallback(async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/stock?action=quote&code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQuote(data.data || data);
      }
    } catch (_e: unknown) {
      setError('获取行情失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchStock();
  };

  // 渲染搜索结果项
  const renderResultItem = (item: StockItem, index: number) => {
    const name = item['名称'] || item.Name || item.name || item.stock_name || item['股票名称'] || item[1] || '';
    const code = item['THSCODE'] || item.THSCODE || item.code || item.stock_code || item.thscode || item['股票代码'] || item['代码'] || item.Code || item[0] || '';
    const market = item['市场'] || item.MarketDisplay || item.market || '';
    const displayCode = item['代码'] || item.CodeDisplay || item.Code || '';
    const price = item.price || item['最新价'] || '';
    const change = item.change || item.change_pct || item['涨跌幅'] || '';
    const changeNum = parseFloat(String(change));
    const changeColor = isNaN(changeNum) ? '' : changeNum > 0 ? 'text-red-500' : changeNum < 0 ? 'text-green-500' : 'text-slate-400';

    return (
      <motion.button
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => code && fetchQuote(String(code))}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-left border border-transparent hover:border-indigo-300 dark:hover:border-indigo-700"
      >
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{name || '未知'}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{displayCode || code} {market && `· ${market}`}</span>
        </div>
        {price && (
          <div className="text-right flex-shrink-0 ml-2">
            <div className="text-xs font-bold text-slate-800 dark:text-white">{price}</div>
            {change && <div className={`text-[10px] font-bold ${changeColor}`}>{change}%</div>}
          </div>
        )}
      </motion.button>
    );
  };

  // 渲染行情详情
  const renderQuote = () => {
    if (!quote) return null;
    const entries = Object.entries(quote).filter(([k]) => !['code', 'name', 'thscode'].includes(k));
    const name = quote.name || quote.stock_name || '';
    const code = quote.code || quote.thscode || '';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-slate-800 dark:text-white">{name}</div>
            <div className="text-[10px] text-slate-400">{code}</div>
          </div>
          <button
            onClick={() => setQuote(null)}
            className="text-xs text-slate-400 hover:text-indigo-500 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          >
            ← 返回
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {entries.slice(0, 12).map(([key, val]) => {
            const numVal = parseFloat(String(val));
            const isPercent = key.includes('涨') || key.includes('幅') || key.includes('换手');
            const color = !isNaN(numVal) && isPercent
              ? numVal > 0 ? 'text-red-500' : numVal < 0 ? 'text-green-500' : ''
              : '';
            return (
              <div key={key} className="flex justify-between items-center px-2 py-1 rounded-lg bg-white/40 dark:bg-slate-700/40 text-[10px]">
                <span className="text-slate-500 dark:text-slate-400 truncate mr-1">{key}</span>
                <span className={`font-bold ${color} text-slate-700 dark:text-slate-200 truncate`}>{String(val)}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-3"
    >
      {/* 模式切换 */}
      <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
        <button
          onClick={() => setMode('search')}
          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${
            mode === 'search'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          搜索
        </button>
        <button
          onClick={() => setMode('wencai')}
          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition-all ${
            mode === 'wencai'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          问财
        </button>
      </div>

      {/* 搜索框 */}
      <div className="flex gap-1.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'wencai' ? '如: 连续3天涨停的股票' : '股票名称/代码/拼音'}
          className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
        />
        <button
          onClick={searchStock}
          disabled={loading || !query.trim()}
          className="px-3 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
        >
          {loading ? '...' : '搜'}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      {/* 行情详情 */}
      <AnimatePresence mode="wait">
        {quote ? renderQuote() : (
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-thin">
            {results.map((item, i) => renderResultItem(item, i))}
            {!loading && results.length === 0 && !error && (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-[10px]">
                <svg className="w-6 h-6 mb-1 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {mode === 'wencai' ? '输入自然语言问题查询' : '搜索股票查看行情'}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
