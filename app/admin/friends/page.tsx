"use client";

import { useState, useEffect } from "react";

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

  const loadFriends = async () => {
    const res = await fetch("/api/admin/friends");
    const data = await res.json();
    setFriends(data.friends || []);
  };

  useEffect(() => { loadFriends(); }, []);

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">友链管理</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", url: "", description: "", avatar: "", theme_color: "rgba(99, 102, 241, 0.5)", sort_order: 0, is_enabled: true }); }} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
          + 添加友链
        </button>
      </div>

      {showForm && (
        <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" required />
              <input type="text" placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" required />
              <input type="text" placeholder="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
              <input type="text" placeholder="头像URL" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
              <input type="text" placeholder="主题色" value={form.theme_color} onChange={(e) => setForm({ ...form, theme_color: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
              <input type="number" placeholder="排序" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="rounded" />
                启用
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">{editId ? "更新" : "添加"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-gray-400 hover:text-white">取消</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-white/10 bg-white/5">
              <th className="p-4">名称</th>
              <th className="p-4">URL</th>
              <th className="p-4">状态</th>
              <th className="p-4">排序</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {friends.map((f) => (
              <tr key={f.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5">
                <td className="p-4 flex items-center gap-3">
                  {f.avatar && <img src={f.avatar} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />}
                  {f.name}
                </td>
                <td className="p-4 text-sm truncate max-w-xs">{f.url}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${f.is_enabled ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-400"}`}>
                    {f.is_enabled ? "启用" : "禁用"}
                  </span>
                </td>
                <td className="p-4">{f.sort_order}</td>
                <td className="p-4 space-x-2">
                  <button onClick={() => handleEdit(f)} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">编辑</button>
                  <button onClick={() => handleDelete(f.id, f.name)} className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
