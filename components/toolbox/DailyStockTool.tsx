"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Loader2, RefreshCw, BarChart3, Search } from 'lucide-react';

interface IndexItem {
  name: string;
  code: string;
  price: string;
  change: string;
  changePct: string;
  isUp: boolean;
}

interface MarketBroad {
  upCount: number;
  downCount: number;
  upDownRatio: string;
}

interface DailyData {
  date: string;
  indices: IndexItem[];
  broad: MarketBroad;
  topGainers: Array<{ name: string; code: string; changePct: string }>;
  topLosers: Array<{ name: string; code: string; changePct: string }>;
}

interface StockQuote {
  stock_code: string;
  stock_name: string;
  current_price: number;
  change: number | null;
  change_percent: number | null;
}

const API_BASE = 'http://127.0.0.1:8000';

export default function DailyStockTool() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DailyData | null>(null);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState('');
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const pollTaskStatus = async (taskId: string, maxAttempts = 60): Promise<Record<string, unknown> | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/analysis/tasks/${taskId}`, {
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const task = await res.json();
        const status = task.status;

        if (status === 'completed') {
          return task;
        } else if (status === 'failed') {
          throw new Error(task.error || 'Task failed');
        } else if (status === 'cancel_requested' || status === 'cancelled') {
          throw new Error('Task was cancelled');
        }

        // Still processing, wait before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          continue;
        }
        throw e;
      }
    }
    throw new Error('Task polling timed out');
  };

  const fetchDailyData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Trigger market-review (async, returns task_id)
      const triggerRes = await fetch(`${API_BASE}/api/v1/analysis/market-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(15000),
      });

      if (!triggerRes.ok) {
        const errText = await triggerRes.text();
        throw new Error(`触发失败: ${triggerRes.status} - ${errText}`);
      }

      const triggerResult = await triggerRes.json();

      // Handle 409 Conflict (task already running)
      if (triggerRes.status === 409) {
        setError('市场复盘任务正在执行中，请稍后再试');
        setData(getMockData());
        setLastUpdate(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
        setLoading(false);
        return;
      }

      const taskId = triggerResult.task_id;
      if (!taskId) {
        throw new Error('未返回任务ID');
      }

      // Step 2: Poll for task completion
      setError('正在获取复盘数据...');
      const taskResult = await pollTaskStatus(taskId);

      if (!taskResult) {
        throw new Error('获取任务状态失败');
      }

      // Step 3: Parse the result
      const payload = taskResult.market_review_payload as Record<string, unknown> || {};
      const report = taskResult.market_review_report as string || '';

      // Build indices from payload
      const indices: IndexItem[] = (payload.indices as Array<Record<string, unknown>> || []).map((item: Record<string, unknown>) => {
        const changePct = parseFloat(String(item.changePct || item.change_percent || '0'));
        return {
          name: String(item.name || item.name_cn || '未知'),
          code: String(item.code || item.stock_code || ''),
          price: String(item.price || item.current_price || '0'),
          change: String(item.change || '0'),
          changePct: String(item.changePct || item.change_percent || '0%'),
          isUp: changePct >= 0,
        };
      });

      const broad: MarketBroad = payload.broad as MarketBroad || {
        upCount: 0,
        downCount: 0,
        upDownRatio: '0',
      };

      const topGainers = (payload.topGainers as Array<Record<string, unknown>> || []).slice(0, 5).map((item: Record<string, unknown>) => ({
        name: String(item.name || '未知'),
        code: String(item.code || ''),
        changePct: String(item.changePct || item.change_percent || '0%'),
      }));

      const topLosers = (payload.topLosers as Array<Record<string, unknown>> || []).slice(0, 5).map((item: Record<string, unknown>) => ({
        name: String(item.name || '未知'),
        code: String(item.code || ''),
        changePct: String(item.changePct || item.change_percent || '0%'),
      }));

      setData({
        date: new Date().toLocaleDateString('zh-CN'),
        indices,
        broad,
        topGainers,
        topLosers,
      });

      setLastUpdate(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      setError('');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '获取数据失败';
      setError(message);
      // Fallback to mock data
      setData(getMockData());
      setLastUpdate(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockQuote = useCallback(async () => {
    if (!selectedStock.trim()) {
      setQuoteError('请输入股票代码');
      return;
    }

    setQuoteLoading(true);
    setQuoteError('');
    setStockQuote(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/stocks/${encodeURIComponent(selectedStock.trim())}/quote`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('股票不存在');
        }
        throw new Error(`查询失败: ${res.status}`);
      }

      const quote: StockQuote = await res.json();
      setStockQuote(quote);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '查询失败';
      setQuoteError(message);
    } finally {
      setQuoteLoading(false);
    }
  }, [selectedStock]);

  const getMockData = (): DailyData => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN');
    return {
      date: dateStr,
      indices: [
        { name: '上证指数', code: 'SH000001', price: '3285.67', change: '+15.23', changePct: '+0.47%', isUp: true },
        { name: '深证成指', code: 'SZ399001', price: '10828.45', change: '+85.12', changePct: '+0.79%', isUp: true },
        { name: '创业板指', code: 'SZ399006', price: '2156.78', change: '-12.34', changePct: '-0.57%', isUp: false },
        { name: '沪深300', code: 'SH000300', price: '3892.12', change: '+22.45', changePct: '+0.58%', isUp: true },
        { name: '科创50', code: 'SH000688', price: '1024.56', change: '-5.67', changePct: '-0.55%', isUp: false },
      ],
      broad: { upCount: 2847, downCount: 1983, upDownRatio: '1.44' },
      topGainers: [
        { name: '华力创通', code: '300045', changePct: '+20.00%' },
        { name: '天银机电', code: '300342', changePct: '+20.00%' },
        { name: '星星科技', code: '300256', changePct: '+19.90%' },
        { name: '天和防务', code: '300397', changePct: '+19.87%' },
        { name: '天翔环境', code: '300362', changePct: '+19.84%' },
      ],
      topLosers: [
        { name: '*ST左江', code: '300799', changePct: '-20.00%' },
        { name: '*ST中天', code: '300159', changePct: '-20.00%' },
        { name: '*ST文化', code: '300089', changePct: '-19.91%' },
        { name: '*ST辅仁', code: '600781', changePct: '-19.87%' },
        { name: '*ST柏龙', code: '002776', changePct: '-19.76%' },
      ],
    };
  };

  const formatChange = (val: number | null) => {
    if (val === null) return '--';
    return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  const formatPercent = (val: number | null) => {
    if (val === null) return '--';
    return val >= 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-3"
    >
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {data ? data.date : '每日行情'}
          </span>
          {lastUpdate && (
            <span className="text-[9px] text-slate-400 dark:text-slate-500">
              更新 {lastUpdate}
            </span>
          )}
        </div>
        <button
          onClick={fetchDailyData}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-40"
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-[10px] text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl">
          {error}
          {!data && <span>（显示模拟数据）</span>}
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="animate-spin text-indigo-400" size={24} />
          <span className="text-[10px] font-bold">加载每日行情...</span>
        </div>
      )}

      {/* Stock quote search */}
      <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-white/40 dark:bg-slate-700/40">
        <div className="flex items-center gap-1.5">
          <Search size={10} className="text-slate-500" />
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">股票查询</span>
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={selectedStock}
            onChange={e => setSelectedStock(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchStockQuote()}
            placeholder="输入代码如 600519"
            className="flex-1 px-2 py-1 text-[10px] rounded bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400"
          />
          <button
            onClick={fetchStockQuote}
            disabled={quoteLoading}
            className="px-2 py-1 text-[10px] bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-40 transition-colors"
          >
            {quoteLoading ? <Loader2 size={10} className="animate-spin" /> : '查询'}
          </button>
        </div>
        {quoteError && (
          <div className="text-[9px] text-red-500">{quoteError}</div>
        )}
        {stockQuote && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-800/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-700 dark:text-white">
                {stockQuote.stock_name} ({stockQuote.stock_code})
              </span>
              <span className="text-[11px] font-black text-slate-800 dark:text-white">
                {stockQuote.current_price.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-bold ${(stockQuote.change ?? 0) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatChange(stockQuote.change)}
              </span>
              <span className={`text-[10px] font-bold ${(stockQuote.change_percent ?? 0) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatPercent(stockQuote.change_percent)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Data display */}
      {data && (
        <div className="flex flex-col gap-3">
          {/* Market breadth */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 rounded-xl bg-white/40 dark:bg-slate-700/40">
              <span className="text-[9px] text-slate-500 dark:text-slate-400">上涨</span>
              <span className="text-sm font-black text-red-500">{data.broad.upCount}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-white/40 dark:bg-slate-700/40">
              <span className="text-[9px] text-slate-500 dark:text-slate-400">下跌</span>
              <span className="text-sm font-black text-green-500">{data.broad.downCount}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-white/40 dark:bg-slate-700/40">
              <span className="text-[9px] text-slate-500 dark:text-slate-400">涨跌比</span>
              <span className="text-sm font-black text-indigo-500">{data.broad.upDownRatio}</span>
            </div>
          </div>

          {/* Index grid */}
          <div className="grid grid-cols-1 gap-1.5">
            {data.indices.map((index, i) => (
              <motion.div
                key={index.code}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-700/40"
              >
                <div className="flex items-center gap-2">
                  {index.isUp ? (
                    <TrendingUp size={12} className="text-red-500" />
                  ) : (
                    <TrendingDown size={12} className="text-green-500" />
                  )}
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{index.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{index.price}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    index.isUp
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                      : 'bg-green-50 dark:bg-green-900/30 text-green-500'
                  }`}>
                    {index.changePct}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Gainers and Losers */}
          <div className="grid grid-cols-2 gap-3">
            {/* Top Gainers */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 px-2">
                <TrendingUp size={10} className="text-red-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">涨幅榜</span>
              </div>
              {data.topGainers.map((item, i) => (
                <motion.div
                  key={item.code + i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-red-50/50 dark:bg-red-900/20"
                >
                  <span className="text-[10px] text-slate-700 dark:text-slate-200 truncate max-w-[60px]">{item.name}</span>
                  <span className="text-[10px] font-bold text-red-500">{item.changePct}</span>
                </motion.div>
              ))}
            </div>

            {/* Top Losers */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 px-2">
                <TrendingDown size={10} className="text-green-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">跌幅榜</span>
              </div>
              {data.topLosers.map((item, i) => (
                <motion.div
                  key={item.code + i}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-green-50/50 dark:bg-green-900/20"
                >
                  <span className="text-[10px] text-slate-700 dark:text-slate-200 truncate max-w-[60px]">{item.name}</span>
                  <span className="text-[10px] font-bold text-green-500">{item.changePct}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400">
          <BarChart3 size={32} className="mb-2 opacity-30" />
          <span className="text-[10px]">点击刷新获取每日行情</span>
        </div>
      )}
    </motion.div>
  );
}