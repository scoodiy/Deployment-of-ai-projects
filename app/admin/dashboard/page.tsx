"use client";

import { useEffect, useState } from "react";
import { AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";

interface Stats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalMedia: number;
  totalMusic: number;
  lastBlogUpdate: string | null;
}

interface Log {
  id: number;
  action: string;
  target_type: string;
  detail: string;
  username: string;
  nickname: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setLogs(data.recentLogs);
      });
  }, []);

  if (!stats) return <div className="text-slate-500">加载中...</div>;

  const statCards = [
    { label: "博客总数", value: stats.totalBlogs, icon: "📝", accent: "border-indigo-500", tone: "info" as const },
    { label: "已发布", value: stats.publishedBlogs, icon: "✅", accent: "border-emerald-500", tone: "success" as const },
    { label: "草稿", value: stats.draftBlogs, icon: "📋", accent: "border-amber-500", tone: "warning" as const },
    { label: "图片数量", value: stats.totalMedia, icon: "🖼️", accent: "border-fuchsia-500", tone: "default" as const },
    { label: "音乐数量", value: stats.totalMusic, icon: "🎵", accent: "border-rose-500", tone: "danger" as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="仪表盘"
        description="站点内容、媒体资源和最近操作的管理总览。"
        actions={<StatusBadge tone="info">Admin Console</StatusBadge>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <AdminCard key={card.label} className={`border-l-4 ${card.accent} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{card.value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-2xl">{card.icon}</div>
            </div>
            <div className="mt-4">
              <StatusBadge tone={card.tone}>实时统计</StatusBadge>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-950">最近操作</h3>
            <p className="mt-1 text-sm text-slate-500">后台关键操作的审计记录。</p>
          </div>
          <StatusBadge tone="muted">{logs.length} 条</StatusBadge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">操作人</th>
                <th className="px-5 py-3 font-semibold">操作</th>
                <th className="px-5 py-3 font-semibold">详情</th>
                <th className="px-5 py-3 font-semibold">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{log.nickname || log.username}</td>
                  <td className="px-5 py-3">
                    <StatusBadge tone="info">{log.action}</StatusBadge>
                  </td>
                  <td className="px-5 py-3">{log.detail}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(log.created_at).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
