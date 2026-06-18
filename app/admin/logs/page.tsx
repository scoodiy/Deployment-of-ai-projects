"use client";

import { useState, useEffect } from "react";

interface Log {
  id: number;
  admin_id: number;
  action: string;
  target_type: string;
  target_id: number | null;
  detail: string;
  ip: string;
  username: string;
  nickname: string;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch(`/api/admin/logs?page=${page}&limit=50`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      });
  }, [page]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-500/20 text-green-300";
      case "update": return "bg-blue-500/20 text-blue-300";
      case "delete": return "bg-red-500/20 text-red-300";
      case "upload": return "bg-purple-500/20 text-purple-300";
      case "login": return "bg-yellow-500/20 text-yellow-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">操作日志</h2>

      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-white/10 bg-white/5">
              <th className="p-4">操作人</th>
              <th className="p-4">操作</th>
              <th className="p-4">类型</th>
              <th className="p-4">详情</th>
              <th className="p-4">IP</th>
              <th className="p-4">时间</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5">
                <td className="p-4">{log.nickname || log.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${getActionColor(log.action)}`}>{log.action}</span>
                </td>
                <td className="p-4">{log.target_type}</td>
                <td className="p-4">{log.detail}</td>
                <td className="p-4 text-gray-500 text-sm">{log.ip}</td>
                <td className="p-4 text-gray-500 text-sm">{new Date(log.created_at).toLocaleString("zh-CN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50">上一页</button>
          <span className="px-4 py-2 text-gray-400">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50">下一页</button>
        </div>
      )}
    </div>
  );
}
