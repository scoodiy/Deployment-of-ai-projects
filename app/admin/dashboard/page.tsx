"use client";

import { useState, useEffect } from "react";

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

  if (!stats) return <div className="text-white">加载中...</div>;

  const statCards = [
    { label: "博客总数", value: stats.totalBlogs, icon: "📝", color: "from-blue-500 to-cyan-500" },
    { label: "已发布", value: stats.publishedBlogs, icon: "✅", color: "from-green-500 to-emerald-500" },
    { label: "草稿", value: stats.draftBlogs, icon: "📋", color: "from-yellow-500 to-orange-500" },
    { label: "图片数量", value: stats.totalMedia, icon: "🖼️", color: "from-purple-500 to-pink-500" },
    { label: "音乐数量", value: stats.totalMusic, icon: "🎵", color: "from-red-500 to-rose-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl p-6 text-white shadow-lg`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm">{card.label}</p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
              </div>
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6">
        <h3 className="text-white text-lg font-semibold mb-4">📋 最近操作</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="pb-3 pr-4">操作人</th>
                <th className="pb-3 pr-4">操作</th>
                <th className="pb-3 pr-4">详情</th>
                <th className="pb-3">时间</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 text-gray-300">
                  <td className="py-3 pr-4">{log.nickname || log.username}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">{log.action}</span>
                  </td>
                  <td className="py-3 pr-4">{log.detail}</td>
                  <td className="py-3 text-gray-500">{new Date(log.created_at).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
