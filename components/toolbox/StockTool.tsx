"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, ArrowLeft, BarChart3, CheckCircle2, Clock, Loader2, RefreshCw, Search, ShieldAlert } from 'lucide-react';

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
  checks?: Array<{ key: string; title?: string; status?: string; message?: string; next_step?: string | null }>;
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
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

export default function StockTool() {
  const [codes, setCodes] = useState('600519, hk00700, AAPL');
  const [market, setMarket] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [report, setReport] = useState<StockReport | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, unknown>>({});
  const [history, setHistory] = useState<StockReport[]>([]);
  const [config, setConfig] = useState<ConfigStatus | null>(null);

  const parsedCodes = useMemo(() => codes.split(/[\s,，;；]+/).map((item) => item.trim()).filter(Boolean), [codes]);

  const loadConfig = useCallback(async () => {
    const { payload } = await readJson<ConfigStatus>('/api/stock/config/status');
    if (payload.success && payload.data) {
      setConfig(payload.data as ConfigStatus);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { payload } = await readJson<StockReport[]>('/api/stock/reports?report_type=stock_analysis&limit=8');
      if (payload.success && Array.isArray(payload.data)) {
        setHistory(payload.data);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig().catch(() => setConfig(null));
    loadHistory().catch(() => undefined);
  }, [loadConfig, loadHistory]);

  const runAnalysis = useCallback(async () => {
    if (parsedCodes.length === 0) {
      setError('请先输入股票代码');
      return;
    }

    setLoading(true);
    setError('');
    setWarnings([]);

    try {
      const { ok, payload } = await readJson<{ report?: StockReport; analysis?: Record<string, unknown> }>('/api/stock/analyze', {
        method: 'POST',
        body: JSON.stringify({
          stocks: parsedCodes,
          market,
        }),
      });

      const nextReport = payload.data?.report;
      if (nextReport) {
        setReport(nextReport);
        setAnalysis(payload.data?.analysis || getRecord(nextReport.raw_data));
      }
      setWarnings(payload.warnings || []);

      if (!ok || !payload.success) {
        setError(payload.error || '股票分析失败');
        return;
      }

      await loadHistory();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '股票分析请求失败');
    } finally {
      setLoading(false);
    }
  }, [loadHistory, market, parsedCodes]);

  const openHistory = useCallback(async (id: string | number) => {
    setLoading(true);
    setError('');
    try {
      const { ok, payload } = await readJson<StockReport>(`/api/stock/reports/${encodeURIComponent(String(id))}`);
      if (!ok || !payload.success || !payload.data) {
        setError(payload.error || '读取历史报告失败');
        return;
      }
      setReport(payload.data);
      setAnalysis(getRecord(payload.data.raw_data));
      setWarnings(payload.warnings || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '读取历史报告失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const resultData = getRecord(analysis.result);
  const rawData = getRecord(analysis.raw);
  const reportSummary = getRecord(analysis.report_summary);
  const score = reportSummary.sentiment_score || rawData.sentiment_score || resultData.sentiment_score;
  const advice = reportSummary.operation_advice || rawData.operation_advice || resultData.operation_advice;
  const trend = reportSummary.trend_prediction || rawData.trend_prediction || resultData.trend_prediction;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="flex flex-col gap-4"
    >
      <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">股票智能分析</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              支持 A 股、港股、美股和 ETF，多代码会统一进入 AI 分析报告。
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
            <p className="mt-1">
              缺少：{config.required_missing_keys?.join('、') || '模型或数据源'}。页面会保留请求入口，并在失败时显示具体原因。
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_150px]">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">股票代码</span>
            <textarea
              value={codes}
              onChange={(event) => setCodes(event.target.value)}
              rows={3}
              placeholder="例如：600519, hk00700, AAPL"
              className="resize-none rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-950/50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">市场</span>
            <select
              value={market}
              onChange={(event) => setMarket(event.target.value)}
              className="h-full min-h-[80px] rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-950/50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 dark:text-white"
            >
              <option value="auto">自动识别</option>
              <option value="cn">A 股</option>
              <option value="hk">港股</option>
              <option value="us">美股</option>
              <option value="global">全球</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-400">已识别 {parsedCodes.length} 个代码：{parsedCodes.join('、') || '无'}</p>
          <button
            onClick={runAnalysis}
            disabled={loading || parsedCodes.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            开始 AI 分析
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
          <BarChart3 className="mx-auto text-slate-400" size={28} />
          <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">等待分析</p>
          <p className="mt-1 text-xs text-slate-400">输入股票代码后，会在这里展示评分、建议、风险和完整 Markdown 报告。</p>
        </div>
      )}

      {report && (
        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                {report.status === 'completed' ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} className="text-amber-500" />}
                {report.status}
              </div>
              <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">{report.summary || '股票分析报告'}</h3>
              <p className="mt-1 text-[11px] text-slate-400">{formatTime(report.created_at)}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-3">
                <p className="text-[10px] font-bold text-slate-400">综合评分</p>
                <p className="mt-1 text-2xl font-black text-indigo-500">{String(score || '--')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-3">
                <p className="text-[10px] font-bold text-slate-400">趋势判断</p>
                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">{String(trend || '见完整报告')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-3">
                <p className="text-[10px] font-bold text-slate-400">操作建议</p>
                <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">{String(advice || '见完整报告')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/40 p-4">
            <h3 className="mb-3 text-sm font-black text-slate-900 dark:text-white">完整报告</h3>
            {report.report_markdown ? (
              <div className="max-w-none text-sm leading-7 text-slate-700 dark:text-slate-200 [&_h1]:text-xl [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-black [&_h3]:mt-4 [&_h3]:font-black [&_li]:ml-5 [&_ul]:list-disc [&_ol]:list-decimal [&_table]:my-3 [&_table]:w-full [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:p-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.report_markdown}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-xs text-slate-400">这条记录没有生成 Markdown 正文，可能是任务仍在处理或外部服务返回为空。</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">历史分析记录</h3>
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
          <p className="rounded-xl bg-white/40 dark:bg-slate-950/30 px-3 py-3 text-xs text-slate-400">还没有股票分析记录。</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {history.map((item) => (
              <button
                key={String(item.id)}
                onClick={() => openHistory(item.id)}
                className="rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/50 dark:bg-slate-950/30 px-3 py-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
              >
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-xs font-black text-slate-800 dark:text-white">{item.summary || item.stocks?.join('、') || '股票分析'}</span>
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
