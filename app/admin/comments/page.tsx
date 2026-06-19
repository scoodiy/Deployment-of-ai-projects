"use client";

import { useState, useEffect, useCallback } from "react";
import LoadingState from "../../../components/LoadingState";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";

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

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

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
    } catch (e) {
      console.error("Load comments error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("操作失败");
      loadComments();
    } catch (e) {
      alert("操作失败，请重试");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/admin/comments/${confirmDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      setConfirmDelete(null);
      loadComments();
    } catch (e) {
      alert("删除失败，请重试");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/20 text-green-300";
      case "rejected": return "bg-red-500/20 text-red-300";
      case "pending": return "bg-yellow-500/20 text-yellow-300";
      default: return "bg-gray-500/20 text-gray-400";
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">评论管理</h2>
        <div className="flex gap-2">
          {["", "approved", "pending", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filter === s ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"}`}
            >
              {s === "" ? "全部" : s === "approved" ? "已通过" : s === "pending" ? "待审核" : "已拒绝"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState text="加载评论列表..." />
      ) : error ? (
        <ErrorState onRetry={loadComments} />
      ) : comments.length === 0 ? (
        <EmptyState message="暂无评论" />
      ) : (
        <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-white/10 bg-white/5">
                <th className="p-4">用户</th>
                <th className="p-4">内容</th>
                <th className="p-4">位置</th>
                <th className="p-4">状态</th>
                <th className="p-4">时间</th>
                <th className="p-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {c.avatar && <img src={c.avatar} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />}
                      <span className="text-sm">{c.nickname || c.username || "匿名"}</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="text-sm truncate">{c.content}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      {getTargetLabel(c.target_type)} #{c.target_id}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusBadge(c.status)}`}>
                      {c.status === "approved" ? "已通过" : c.status === "pending" ? "待审核" : "已拒绝"}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-400">{c.created_at}</td>
                  <td className="p-4 space-x-2">
                    {c.status !== "approved" && (
                      <button onClick={() => handleStatusChange(c.id, "approved")} className="px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm">通过</button>
                    )}
                    {c.status !== "rejected" && (
                      <button onClick={() => handleStatusChange(c.id, "rejected")} className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded text-sm">拒绝</button>
                    )}
                    <button onClick={() => setConfirmDelete(c.id)} className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
