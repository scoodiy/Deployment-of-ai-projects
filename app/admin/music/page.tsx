"use client";

import { useState, useEffect } from "react";

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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", artist: "", url: "", cover_image: "", is_background: false, is_enabled: true });
  const [editId, setEditId] = useState<number | null>(null);

  const loadMusic = async () => {
    const res = await fetch("/api/admin/music");
    const data = await res.json();
    setMusic(data.music);
  };

  useEffect(() => { loadMusic(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/admin/music/${editId}` : "/api/admin/music";
    const method = editId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setShowForm(false);
    setEditId(null);
    setForm({ title: "", artist: "", url: "", cover_image: "", is_background: false, is_enabled: true });
    loadMusic();
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

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定删除「${title}」？`)) return;
    await fetch(`/api/admin/music/${id}`, { method: "DELETE" });
    loadMusic();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">音乐管理</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ title: "", artist: "", url: "", cover_image: "", is_background: false, is_enabled: true }); }} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
          + 添加音乐
        </button>
      </div>

      {showForm && (
        <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="歌曲名称" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" required />
              <input type="text" placeholder="歌手" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
              <input type="text" placeholder="音乐URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" required />
              <input type="text" placeholder="封面图URL" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={form.is_background} onChange={(e) => setForm({ ...form, is_background: e.target.checked })} className="rounded" />
                设为背景音乐
              </label>
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
              <th className="p-4">歌曲</th>
              <th className="p-4">歌手</th>
              <th className="p-4">状态</th>
              <th className="p-4">类型</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {music.map((m) => (
              <tr key={m.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5">
                <td className="p-4 flex items-center gap-3">
                  {m.cover_image && <img src={m.cover_image} className="w-10 h-10 rounded object-cover" />}
                  {m.title}
                </td>
                <td className="p-4">{m.artist || "-"}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${m.is_enabled ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-400"}`}>
                    {m.is_enabled ? "启用" : "禁用"}
                  </span>
                </td>
                <td className="p-4">
                  {m.is_background && <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">背景音乐</span>}
                </td>
                <td className="p-4 space-x-2">
                  <button onClick={() => handleEdit(m)} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">编辑</button>
                  <button onClick={() => handleDelete(m.id, m.title)} className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
