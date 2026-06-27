"use client";

import { useState, useEffect } from "react";
import { AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";
import Pagination from "../../../components/admin/Pagination";

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

function getActionTone(action: string): 'success' | 'info' | 'danger' | 'default' | 'warning' | 'muted' {
  switch (action) {
    case "create": return "success";
    case "update": return "info";
    case "delete": return "danger";
    case "upload": return "default";
    case "login": return "warning";
    default: return "muted";
  }
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="操作日志"
        description="记录管理员所有后台操作，用于安全审计和问题追踪。"
      />

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">操作人</th>
                <th className="px-5 py-3 font-semibold">操作</th>
                <th className="px-5 py-3 font-semibold">类型</th>
                <th className="px-5 py-3 font-semibold">详情</th>
                <th className="px-5 py-3 font-semibold">IP</th>
                <th className="px-5 py-3 font-semibold">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-950">{log.nickname || log.username}</td>
                  <td className="px-5 py-3">
                    <StatusBadge tone={getActionTone(log.action)}>{log.action}</StatusBadge>
                  </td>
                  <td className="px-5 py-3">{log.target_type}</td>
                  <td className="px-5 py-3">{log.detail}</td>
                  <td className="px-5 py-3 text-slate-500">{log.ip}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(log.created_at).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}
