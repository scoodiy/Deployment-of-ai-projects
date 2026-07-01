"use client";

import { useState, useEffect, useCallback } from "react";
import LoadingState from "../../../components/LoadingState";
import ErrorState from "../../../components/ErrorState";
import EmptyState from "../../../components/EmptyState";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import { useToast } from "../../../components/admin/Toast";
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";

interface Music {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover_image: string;
  is_background: number;
  is_enabled: number;
  sort_order: number;
}

export default function MusicPage() {
  const [music, setMusic] = useState<Music[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", artist: "", url: "", cover_image: "", is_background: false, is_enabled: true });
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMusic = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/music");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setMusic(data.data.music || []);
      } else {
        throw new Error(data.error?.message || "加载失败");
      }
    } catch (_e) {
      console.error("Error:", _e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMusic(); }, [loadMusic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editId ? `/api/admin/music/${editId}` : "/api/admin/music";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "操作失败");
      }
      setShowForm(false);
      setEditId(null);
      setForm({ title: "", artist: "", url: "", cover_image: "", is_background: false, is_enabled: true });
      loadMusic();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "操作失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (m: Music) => {
    setForm({
      title: m.title,
      artist: m.artist,
      url: m.url,
      cover_image: m.cover_image,
      is_background: !!m.is_background,
      is_enabled: !!m.is_enabled,
    });
    setEditId(m.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete || deletingId) return;
    setDeletingId(String(confirmDelete.id));
    try {
      const res = await fetch(`/api/admin/music/${confirmDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      setConfirmDelete(null);
      loadMusic();
    } catch (_e) {
      toast("删除失败，请重试", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="音乐管理"
        description="管理网站背景音乐和播放列表。"
        actions={
          <ActionButton tone="info" onClick={() => { setShowForm(true); setEditId(null); setForm({ title: "", artist: "", url: "", cover_image: "", is_background: false, is_enabled: true }); }}>
            + 添加音乐
          </ActionButton>
        }
      />

      {showForm && (
        <AdminCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="歌曲名称" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" required />
              <input type="text" placeholder="歌手" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
              <input type="text" placeholder="音乐URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" required />
              <input type="text" placeholder="封面图URL" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={form.is_background} onChange={(e) => setForm({ ...form, is_background: e.target.checked })} className="rounded" />
                设为背景音乐
              </label>
              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="rounded" />
                启用
              </label>
            </div>
            <div className="flex gap-2">
              <ActionButton tone="info" type="submit" disabled={submitting}>{submitting ? "提交中..." : editId ? "更新" : "添加"}</ActionButton>
              <ActionButton tone="muted" onClick={() => setShowForm(false)}>取消</ActionButton>
            </div>
          </form>
        </AdminCard>
      )}

      {loading ? (
        <LoadingState text="加载音乐列表..." />
      ) : error ? (
        <ErrorState onRetry={loadMusic} />
      ) : music.length === 0 ? (
        <EmptyState message="暂无音乐，点击上方按钮添加" />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">歌曲</th>
                  <th className="px-5 py-3 font-semibold">歌手</th>
                  <th className="px-5 py-3 font-semibold">状态</th>
                  <th className="px-5 py-3 font-semibold">类型</th>
                  <th className="px-5 py-3 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {music.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 flex items-center gap-3">
                      {m.cover_image && <img src={m.cover_image} className="w-10 h-10 rounded object-cover" />}
                      <span className="font-medium text-slate-950">{m.title}</span>
                    </td>
                    <td className="px-5 py-3">{m.artist || "-"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={m.is_enabled ? "success" : "muted"}>
                        {m.is_enabled ? "启用" : "禁用"}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3">
                      {m.is_background ? <StatusBadge tone="info">背景音乐</StatusBadge> : "-"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <ActionButton tone="info" onClick={() => handleEdit(m)}>编辑</ActionButton>
                        <ActionButton tone="danger" onClick={() => setConfirmDelete({ id: m.id, title: m.title })} disabled={deletingId === String(m.id)}>删除</ActionButton>
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
        open={!!confirmDelete}
        title="删除音乐"
        message={`确定删除「${confirmDelete?.title}」？此操作不可恢复。`}
        confirmText="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
