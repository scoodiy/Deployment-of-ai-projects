"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";

type StockReportStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
type StockReportType = "stock_analysis" | "market_review";
type FilterType = "all" | StockReportType;

interface StockReport {
  id: number | string;
  stocks: string[];
  market?: string;
  report_type: StockReportType;
  summary: string;
  status: StockReportStatus;
  error_message?: string;
  created_at?: string;
}

interface ConfigCheck {
  key: string;
  title?: string;
  status?: string;
  message?: string;
  next_step?: string | null;
}

interface ConfigStatus {
  configured: boolean;
  api_url?: string;
  required_missing_keys?: string[];
  checks?: ConfigCheck[];
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  warnings?: string[];
  error?: string;
}

function statusTone(status?: string): "success" | "warning" | "danger" | "muted" | "info" {
  switch (status) {
    case "completed":
    case "ok":
    case "ready":
      return "success";
    case "processing":
    case "pending":
      return "warning";
    case "failed":
    case "error":
      return "danger";
    case "cancelled":
      return "muted";
    default:
      return "info";
  }
}

function reportTypeLabel(type: StockReportType) {
  return type === "market_review" ? "大盘复盘" : "个股分析";
}

function formatTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

async function readJson<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const payload = await res.json().catch(() => ({ success: false, error: "接口返回无法解析" })) as ApiResponse<T>;
  if (!res.ok && payload.success !== false) {
    return { success: false, error: `HTTP ${res.status}` };
  }
  return payload;
}

export default function AdminStockPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [reports, setReports] = useState<StockReport[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  const reportQuery = useMemo(() => {
    const params = new URLSearchParams({ limit: "20" });
    if (filter !== "all") params.set("report_type", filter);
    return params.toString();
  }, [filter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statusPayload, reportsPayload] = await Promise.all([
        readJson<ConfigStatus>("/api/stock/config/status"),
        readJson<StockReport[]>(`/api/stock/reports?${reportQuery}`),
      ]);

      if (statusPayload.success && statusPayload.data) {
        setConfig(statusPayload.data);
      }

      if (reportsPayload.success && Array.isArray(reportsPayload.data)) {
        setReports(reportsPayload.data);
        setWarnings(reportsPayload.warnings || []);
      } else {
        setReports([]);
        setWarnings(reportsPayload.warnings || []);
        setError(reportsPayload.error || "读取股票报告失败");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "读取股票模块状态失败");
    } finally {
      setLoading(false);
    }
  }, [reportQuery]);

  useEffect(() => {
    loadData().catch(() => undefined);
  }, [loadData]);

  const testIntegration = async () => {
    setTesting(true);
    setTestResult("检测中...");
    try {
      const payload = await readJson<{ history_available?: boolean }>("/api/stock/config/test", { method: "POST" });
      if (!payload.success) {
        setTestResult(payload.error || "股票服务检测失败");
        return;
      }
      const historyAvailable = payload.data?.history_available ? "历史服务可用" : "历史服务暂不可用";
      const warningText = payload.warnings?.length ? `；${payload.warnings.join("；")}` : "";
      setTestResult(`连接正常，${historyAvailable}${warningText}`);
      await loadData();
    } catch (requestError) {
      setTestResult(requestError instanceof Error ? requestError.message : "股票服务检测失败");
    } finally {
      setTesting(false);
    }
  };

  const completedCount = reports.filter((report) => report.status === "completed").length;
  const processingCount = reports.filter((report) => report.status === "processing" || report.status === "pending").length;
  const failedCount = reports.filter((report) => report.status === "failed").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="股票智能分析"
        description="查看 daily_stock_analysis 服务状态、最近报告，并快速进入前台分析工具。"
        actions={
          <>
            <ActionButton tone="muted" onClick={loadData} disabled={loading}>刷新</ActionButton>
            <ActionButton tone="info" onClick={testIntegration} disabled={testing}>{testing ? "检测中..." : "检测服务"}</ActionButton>
            <ActionButton tone="success" href="/tools/stock-analysis">个股分析</ActionButton>
            <ActionButton tone="success" href="/tools/market-review">大盘复盘</ActionButton>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <AdminCard className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">服务状态</h3>
              <p className="mt-1 text-sm text-slate-500">Next 后端通过本机 HTTP 调用 Python 股票服务，前台不会直接暴露内部端口。</p>
            </div>
            <StatusBadge tone={config?.configured ? "success" : "warning"}>{config?.configured ? "配置完整" : "需要配置"}</StatusBadge>
          </div>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs font-semibold text-slate-500">服务地址</dt>
              <dd className="mt-1 break-all font-mono text-slate-900">{config?.api_url || "未读取"}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs font-semibold text-slate-500">缺少配置</dt>
              <dd className="mt-1 text-slate-900">{config?.required_missing_keys?.length ? config.required_missing_keys.join("、") : "无"}</dd>
            </div>
          </dl>

          {config?.checks?.length ? (
            <div className="mt-5 space-y-2">
              {config.checks.map((check) => (
                <div key={check.key} className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800">{check.title || check.key}</div>
                    {check.message ? <div className="mt-0.5 text-xs text-slate-500">{check.message}</div> : null}
                    {check.next_step ? <div className="mt-0.5 text-xs text-amber-600">{check.next_step}</div> : null}
                  </div>
                  <StatusBadge tone={statusTone(check.status)}>{check.status || "unknown"}</StatusBadge>
                </div>
              ))}
            </div>
          ) : null}

          {testResult ? <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">{testResult}</div> : null}
        </AdminCard>

        <AdminCard className="p-6">
          <h3 className="text-lg font-semibold text-slate-950">报告概览</h3>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-center">
              <div className="text-2xl font-black text-emerald-700">{completedCount}</div>
              <div className="mt-1 text-xs font-semibold text-emerald-700">已完成</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <div className="text-2xl font-black text-amber-700">{processingCount}</div>
              <div className="mt-1 text-xs font-semibold text-amber-700">处理中</div>
            </div>
            <div className="rounded-lg bg-rose-50 p-3 text-center">
              <div className="text-2xl font-black text-rose-700">{failedCount}</div>
              <div className="mt-1 text-xs font-semibold text-rose-700">失败</div>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/tools/stock-analysis" className="rounded-lg border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50">
              <div className="text-sm font-bold text-slate-950">股票智能分析</div>
              <div className="mt-1 text-xs text-slate-500">输入多个代码，生成趋势、评分、风险和建议。</div>
            </Link>
            <Link href="/tools/market-review" className="rounded-lg border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50">
              <div className="text-sm font-bold text-slate-950">大盘复盘</div>
              <div className="mt-1 text-xs text-slate-500">触发市场复盘，查看指数、板块和 AI 总结。</div>
            </Link>
          </div>
        </AdminCard>
      </div>

      {warnings.length > 0 ? (
        <AdminCard className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </AdminCard>
      ) : null}

      {error ? <AdminCard className="border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</AdminCard> : null}

      <AdminCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">最近报告</h3>
            <p className="mt-1 text-sm text-slate-500">显示本地保存的报告，并在可用时合并 Python 服务历史记录。</p>
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as FilterType)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400"
          >
            <option value="all">全部报告</option>
            <option value="stock_analysis">个股分析</option>
            <option value="market_review">大盘复盘</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">类型</th>
                <th className="px-5 py-3 font-semibold">标的 / 市场</th>
                <th className="px-5 py-3 font-semibold">摘要</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">读取中...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">暂无股票分析报告</td></tr>
              ) : reports.map((report) => (
                <tr key={`${report.id}`} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-950">{reportTypeLabel(report.report_type)}</td>
                  <td className="px-5 py-3 text-slate-600">{report.stocks?.length ? report.stocks.join("、") : report.market || "全市场"}</td>
                  <td className="max-w-[360px] truncate px-5 py-3" title={report.summary || report.error_message}>{report.summary || report.error_message || "-"}</td>
                  <td className="px-5 py-3"><StatusBadge tone={statusTone(report.status)}>{report.status}</StatusBadge></td>
                  <td className="px-5 py-3 text-slate-500">{formatTime(report.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
