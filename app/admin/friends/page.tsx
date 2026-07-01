"use client";

import { useState, useEffect, useCallback } from "react";
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import { useToast } from "../../../components/admin/Toast";

interface Friend {
  id: number;
  name: string;
  url: string;
  description: string;
  avatar: string;
  theme_color: string;
  sort_order: number;
  is_enabled: number;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", description: "", avatar: "", theme_color: "rgba(99, 102, 241, 0.5)", sort_order: 0, is_enabled: true });
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; id: number; loading?: boolean } | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();

  const loadFriends = useCallback(async () => {
    const res = await fetch("/api/admin/friends");
    const data = await res.json();
    setFriends(data.friends || []);
  }, []);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const url = editId ? `/api/admin/friends/${editId}` : "/api/admin/friends";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => ({}));
      toast(data.error || "操作失败", "error");
      return;
    }

    setLoading(false);
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", url: "", description: "", avatar: "", theme_color: "rgba(99, 102, 241, 0.5)", sort_order: 0, is_enabled: true });
    loadFriends();
  };

  const handleEdit = (f: Friend) => {
    setForm({
      name: f.name,
      url: f.url,
      description: f.description,
      avatar: f.avatar,
      theme_color: f.theme_color,
      sort_order: f.sort_order,
      is_enabled: !!f.is_enabled,
    });
    setEditId(f.id);
    setShowForm(true);
  };

  const handleDelete = (id: number, name: string) => {
    setPendingName(name);
    setPendingAction({ type: 'delete', id, loading: false });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingAction || pendingAction.type !== 'delete') return;
    const { id } = pendingAction;
    setPendingAction({ type: 'delete', id, loading: true });
    try {
      const res = await fetch(`/api/admin/friends/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `删除失败 (${res.status})`);
      }
      await res.json();
      loadFriends();
    } catch (err) {
      toast(err instanceof Error ? err.message : "删除失败", "error");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="友链管理"
        description="管理友情链接的显示、排序和启用状态。"
        actions={
          <ActionButton tone="info" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", url: "", description: "", avatar: "", theme_color: "rgba(99, 102, 241, 0.5)", sort_order: 0, is_enabled: true }); }}>
            + 添加友链
          </ActionButton>
        }
      />

      {showForm && (
        <AdminCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" required />
              <input type="text" placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" required />
              <input type="text" placeholder="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
              <input type="text" placeholder="头像URL" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
              <input type="text" placeholder="主题色" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
              <input type="number" placeholder="排序" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="rounded" />
                启用
              </label>
            </div>
            <div className="flex gap-2">
              <ActionButton tone="info" type="submit" disabled={loading}>{loading ? "保存中..." : editId ? "更新" : "添加"}</ActionButton>
              <ActionButton tone="muted" onClick={() => setShowForm(false)}>取消</ActionButton>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">名称</th>
                <th className="px-5 py-3 font-semibold">URL</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">排序</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {friends.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 flex items-center gap-3">
                    {f.avatar && <img src={f.avatar} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />}
                    <span className="font-medium text-slate-950">{f.name}</span>
                  </td>
                  <td className="px-5 py-3 text-sm truncate max-w-xs">{f.url}</td>
                  <td className="px-5 py-3">
                    <StatusBadge tone={f.is_enabled ? "success" : "muted"}>
                      {f.is_enabled ? "启用" : "禁用"}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-3">{f.sort_order}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <ActionButton tone="info" onClick={() => handleEdit(f)}>编辑</ActionButton>
                      <ActionButton tone="danger" onClick={() => handleDelete(f.id, f.name)} disabled={pendingAction?.id === f.id && pendingAction?.loading}>删除</ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <ConfirmDialog
        open={confirmOpen}
        title="确认删除"
        message={`确定删除友链「${pendingName}」？`}
        danger
        confirmText="确认"
        cancelText="取消"
        onConfirm={() => { setConfirmOpen(false); confirmDelete(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
