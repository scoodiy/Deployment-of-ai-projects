"use client";

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, RefreshCw, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

interface StockReport {
  id: number | string;
  stocks: string[];
  market?: string;
  report_type: 'stock_analysis' | 'market_review';
  summary: string;
  report_markdown: string;
  raw_data?: unknown;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error_message?: string;
  created_at?: string;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  report_markdown?: string;
  summary?: string;
  warnings?: string[];
  created_at?: string;
  error?: string;
}

interface ConfigStatus {
  configured: boolean;
  required_missing_keys?: string[];
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function getArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[] : [];
}

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}

async function readJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; payload: ApiResponse<T> }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const payload = await res.json().catch(() => ({ success: false, error: '接口返回无法解析' })) as ApiResponse<T>;
  return { ok: res.ok, payload };
}

export default function DailyStockTool() {
  const [market, setMarket] = useState('cn');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [report, setReport] = useState<StockReport | null>(null);
  const [review, setReview] = useState<Record<string, unknown>>({});
  const [history, setHistory] = useState<StockReport[]>([]);
  const [config, setConfig] = useState<ConfigStatus | null>(null);

  const loadConfig = useCallback(async () => {
    const { payload } = await readJson<ConfigStatus>('/api/stock/config/status');
    if (payload.success && payload.data) setConfig(payload.data);
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { payload } = await readJson<StockReport[]>('/api/stock/reports?report_type=market_review&limit=8');
      if (payload.success && Array.isArray(payload.data)) setHistory(payload.data);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig().catch(() => setConfig(null));
    loadHistory().catch(() => undefined);
  }, [loadConfig, loadHistory]);

  const runReview = useCallback(async () => {
    setLoading(true);
    setError('');
    setWarnings([]);

    try {
      const { ok, payload } = await readJson<{ report?: StockReport; review?: Record<string, unknown> }>('/api/stock/market-review', {
        method: 'POST',
        body: JSON.stringify({ market }),
      });

      const nextReport = payload.data?.report;
      if (nextReport) {
        setReport(nextReport);
        setReview(payload.data?.review || getRecord(nextReport.raw_data));
      }
      setWarnings(payload.warnings || []);

      if (!ok || !payload.success) {
        setError(payload.error || '市场复盘失败');
        return;
      }

      await loadHistory();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '市场复盘请求失败');
    } finally {
      setLoading(false);
    }
  }, [loadHistory, market]);

  const openHistory = useCallback(async (id: string | number) => {
    setLoading(true);
    setError('');
    try {
      const { ok, payload } = await readJson<StockReport>(`/api/stock/reports/${encodeURIComponent(String(id))}`);
      if (!ok || !payload.success || !payload.data) {
        setError(payload.error || '读取历史复盘失败');
        return;
      }
      setReport(payload.data);
      setReview(getRecord(payload.data.raw_data));
      setWarnings(payload.warnings || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '读取历史复盘失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const reviewRaw = getRecord(review.raw);
  const payload = getRecord(review.market_review_payload || reviewRaw.market_review_payload);
  const indices = getArray(payload.indices || payload.index_data || payload.major_indices).slice(0, 6);
  const sectors = getArray(payload.sectors || payload.sector_performance || payload.hot_sectors).slice(0, 8);
  const breadth = getRecord(payload.broad || payload.breadth || payload.market_breadth);
  const emotion = payload.market_sentiment || payload.sentiment || payload.emotion || '见 AI 总结';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="flex flex-col gap-4"
    >
      <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">大盘复盘 / 市场分析</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              触发 daily_stock_analysis 的市场复盘能力，展示指数、涨跌家数、板块表现、风险提示和 AI 总结。
            </p>
          </div>
          <button
            onClick={() => {
              loadConfig().catch(() => undefined);
              loadHistory().catch(() => undefined);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-indigo-500"
            aria-label="刷新配置与历史"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {config && !config.configured && (
          <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert size={14} />
              股票分析服务配置未完整
            </div>
            <p className="mt-1">缺少：{config.required_missing_keys?.join('、') || '模型或数据源'}。复盘可能使用降级数据或返回失败原因。</p>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">市场</span>
            <select
              value={market}
              onChange={(event) => setMarket(event.target.value)}
              className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 dark:text-white"
            >
              <option value="cn">A 股市场</option>
              <option value="hk">港股市场</option>
              <option value="us">美股市场</option>
              <option value="global">全球市场</option>
            </select>
          </label>
          <button
            onClick={runReview}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            生成复盘
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <div className="flex items-center gap-2 font-bold"><AlertTriangle size={14} />{error}</div>
        </div>
      )}

      {!report && !loading && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/30 dark:bg-slate-900/30 p-6 text-center">
          <Sparkles className="mx-auto text-slate-400" size={28} />
          <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">等待生成复盘</p>
          <p className="mt-1 text-xs text-slate-400">点击“生成复盘”后，会展示市场摘要、主要指数、板块和完整报告。</p>
        </div>
      )}

      {report && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <CheckCircle2 size={14} className={report.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'} />
                {report.status}
              </div>
              <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{report.summary || '市场复盘'}</h3>
              <p className="mt-1 text-[11px] text-slate-400">{formatTime(report.created_at)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-4">
              <p className="text-[10px] font-bold text-slate-400">市场情绪</p>
              <p className="mt-2 text-sm font-black text-indigo-500">{String(emotion)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-4">
              <p className="text-[10px] font-bold text-slate-400">涨跌家数</p>
              <p className="mt-2 text-sm font-black text-slate-800 dark:text-white">
                {String(breadth.upCount || breadth.up_count || '--')} / {String(breadth.downCount || breadth.down_count || '--')}
              </p>
            </div>
          </div>

          {(indices.length > 0 || sectors.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-4">
                <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-white">主要指数</h3>
                <div className="grid gap-2">
                  {indices.length === 0 ? <p className="text-xs text-slate-400">暂无指数数据。</p> : indices.map((item, index) => {
                    const changeText = String(item.changePct || item.change_percent || item.pct_chg || item.change || '--');
                    const isDown = changeText.includes('-');
                    return (
                      <div key={`${String(item.code || item.name || index)}`} className="flex items-center justify-between rounded-xl bg-white/50 dark:bg-slate-950/30 px-3 py-2 text-xs">
                        <div>
                          <p className="font-black text-slate-800 dark:text-white">{String(item.name || item.name_cn || item.code || '指数')}</p>
                          <p className="text-[10px] text-slate-400">{String(item.code || '')}</p>
                        </div>
                        <div className={`inline-flex items-center gap-1 font-black ${isDown ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isDown ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                          {changeText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-4">
                <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-white">板块表现</h3>
                <div className="flex flex-wrap gap-2">
                  {sectors.length === 0 ? <p className="text-xs text-slate-400">暂无板块数据。</p> : sectors.map((item, index) => (
                    <span key={`${String(item.name || index)}`} className="rounded-full border border-indigo-200/70 bg-indigo-50/80 px-3 py-1 text-[11px] font-bold text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
                      {String(item.name || item.sector || item.title || '板块')} {String(item.changePct || item.change_percent || item.pct_chg || '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/40 p-4">
            <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-white">AI 复盘报告</h3>
            {report.report_markdown ? (
              <div className="max-w-none text-sm leading-7 text-slate-700 dark:text-slate-200 [&_h1]:text-xl [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-black [&_h3]:mt-4 [&_h3]:font-black [&_li]:ml-5 [&_ul]:list-disc [&_ol]:list-decimal [&_table]:my-3 [&_table]:w-full [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:p-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.report_markdown}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-xs text-slate-400">这条复盘没有 Markdown 正文，可能仍在处理或外部服务返回为空。</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">历史复盘记录</h3>
          <button
            onClick={loadHistory}
            disabled={historyLoading}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-500 disabled:opacity-50"
          >
            {historyLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            刷新
          </button>
        </div>

        {history.length === 0 ? (
          <p className="rounded-xl bg-white/40 dark:bg-slate-950/30 px-3 py-3 text-xs text-slate-400">还没有市场复盘记录。</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {history.map((item) => (
              <button
                key={String(item.id)}
                onClick={() => openHistory(item.id)}
                className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/30 px-3 py-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
              >
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs font-black text-slate-800 dark:text-white">{item.summary || '市场复盘'}</span>
                  <ArrowLeft size={12} className="rotate-180 text-slate-400" />
                </div>
                <p className="mt-1 truncate text-[10px] text-slate-400">{formatTime(item.created_at)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
