"use client";

import { useState, useEffect, useCallback } from "react";
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";

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

  const loadFriends = useCallback(async () => {
    const res = await fetch("/api/admin/friends");
    const data = await res.json();
    setFriends(data.friends || []);
  }, []);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/admin/friends/${editId}` : "/api/admin/friends";
    const method = editId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

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

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除友链「${name}」？`)) return;
    await fetch(`/api/admin/friends/${id}`, { method: "DELETE" });
    loadFriends();
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
              <ActionButton tone="info" type="submit">{editId ? "更新" : "添加"}</ActionButton>
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
                      <ActionButton tone="danger" onClick={() => handleDelete(f.id, f.name)}>删除</ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
