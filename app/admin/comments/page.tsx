"use client";

import { useState, useEffect, useCallback } from "react";
import LoadingState from "../../../components/LoadingState";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import { useToast } from "../../../components/admin/Toast";
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";

interface Comment {
  id: number;
  user_id: number;
  target_type: string;
  target_id: number;
  content: string;
  parent_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  nickname: string | null;
  avatar: string | null;
  username: string | null;
}

function getStatusTone(status: string): 'success' | 'danger' | 'warning' | 'muted' {
  switch (status) {
    case "approved": return "success";
    case "rejected": return "danger";
    case "pending": return "warning";
    default: return "muted";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "approved": return "已通过";
    case "pending": return "待审核";
    case "rejected": return "已拒绝";
    default: return status;
  }
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const qs = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/comments${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.data.comments || []);
      } else {
        throw new Error(data.error?.message || "加载失败");
      }
    } catch (_e) {
      console.error("Error:", _e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleStatusChange = async (id: number, status: string) => {
    if (pendingIds.has(String(id))) return;
    setPendingIds(prev => new Set(prev).add(String(id)));
    try {
      const res = await fetch(`/api/admin/comments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `操作失败 (${res.status})`);
      }
      loadComments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "操作失败", "error");
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(String(id));
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete);
    try {
      const res = await fetch(`/api/admin/comments/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `删除失败 (${res.status})`);
      }
      setConfirmDelete(null);
      loadComments();
    } catch (err) {
      toast(err instanceof Error ? err.message : "删除失败", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const getTargetLabel = (type: string) => {
    switch (type) {
      case "blog": return "博客";
      case "media": return "媒体";
      case "music": return "音乐";
      case "friend": return "友链";
      case "project": return "项目";
      default: return type;
    }
  };

  const filterOptions = [
    { label: "全部", value: "" },
    { label: "已通过", value: "approved" },
    { label: "待审核", value: "pending" },
    { label: "已拒绝", value: "rejected" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="评论管理"
        description="审核和管理全站评论，支持通过、拒绝和删除操作。"
        actions={
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map((opt) => (
              <ActionButton
                key={opt.value}
                tone={filter === opt.value ? "info" : "default"}
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </ActionButton>
            ))}
          </div>
        }
      />

      {loading ? (
        <LoadingState text="加载评论列表..." />
      ) : error ? (
        <ErrorState onRetry={loadComments} />
      ) : comments.length === 0 ? (
        <EmptyState message="暂无评论" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">用户</th>
                  <th className="px-5 py-3 font-semibold">内容</th>
                  <th className="px-5 py-3 font-semibold">位置</th>
                  <th className="px-5 py-3 font-semibold">状态</th>
                  <th className="px-5 py-3 font-semibold">时间</th>
                  <th className="px-5 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {comments.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {c.avatar && <img src={c.avatar} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />}
                        <span className="text-slate-950">{c.nickname || c.username || "匿名"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 max-w-xs">
                      <p className="truncate">{c.content}</p>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge tone="info">
                        {getTargetLabel(c.target_type)} #{c.target_id}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={getStatusTone(c.status)}>
                        {getStatusLabel(c.status)}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.created_at}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {c.status !== "approved" && (
                          <ActionButton tone="success" onClick={() => handleStatusChange(c.id, "approved")} disabled={pendingIds.has(String(c.id))}>通过</ActionButton>
                        )}
                        {c.status !== "rejected" && (
                          <ActionButton tone="warning" onClick={() => handleStatusChange(c.id, "rejected")} disabled={pendingIds.has(String(c.id))}>拒绝</ActionButton>
                        )}
                        <ActionButton tone="danger" onClick={() => setConfirmDelete(c.id)} disabled={deletingId === c.id}>删除</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="删除评论"
        message="确定删除这条评论？此操作不可恢复。"
        confirmText="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
