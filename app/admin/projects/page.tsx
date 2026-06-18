"use client";

import { useState, useEffect } from "react";

interface Project {
  id: number;
  name: string;
  description: string;
  icon: string;
  github_url: string;
  tags: string;
  sort_order: number;
  is_enabled: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", icon: "🚀", github_url: "", tags: "", sort_order: 0, is_enabled: true });
  const [editId, setEditId] = useState<number | null>(null);

  const loadProjects = async () => {
    const res = await fetch("/api/admin/projects");
    const data = await res.json();
    setProjects(data.projects || []);
  };

  useEffect(() => { loadProjects(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/admin/projects/${editId}` : "/api/admin/projects";
    const method = editId ? "PUT" : "POST";

    // Ensure tags is valid JSON
    let tagsStr = form.tags.trim();
    if (!tagsStr.startsWith('[')) {
      tagsStr = JSON.stringify(tagsStr.split(',').map(t => t.trim()).filter(Boolean));
    }

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: tagsStr }),
    });

    setShowForm(false);
    setEditId(null);
    setForm({ name: "", description: "", icon: "🚀", github_url: "", tags: "", sort_order: 0, is_enabled: true });
    loadProjects();
  };

  const handleEdit = (p: Project) => {
    let tagsDisplay = p.tags;
    try {
      const arr = JSON.parse(p.tags);
      if (Array.isArray(arr)) tagsDisplay = arr.join(', ');
    } catch {}

    setForm({
      name: p.name,
      description: p.description,
      icon: p.icon,
      github_url: p.github_url,
      tags: tagsDisplay,
      sort_order: p.sort_order,
      is_enabled: !!p.is_enabled,
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除项目「${name}」？`)) return;
    await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    loadProjects();
  };

  const parseTags = (tagsStr: string): string[] => {
    try {
      const arr = JSON.parse(tagsStr);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">项目管理</h2>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", description: "", icon: "🚀", github_url: "", tags: "", sort_order: 0, is_enabled: true }); }} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
          + 添加项目
        </button>
      </div>

      {showForm && (
        <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="项目名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" required />
              <input type="text" placeholder="图标 (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
              <input type="text" placeholder="GitHub URL" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
              <input type="text" placeholder="标签 (逗号分隔)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
              <input type="number" placeholder="排序" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" />
            </div>
            <textarea placeholder="项目描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white h-24" />
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
              <th className="p-4">项目</th>
              <th className="p-4">描述</th>
              <th className="p-4">标签</th>
              <th className="p-4">状态</th>
              <th className="p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.icon}</span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm truncate max-w-xs">{p.description}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {parseTags(p.tags).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${p.is_enabled ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-400"}`}>
                    {p.is_enabled ? "启用" : "禁用"}
                  </span>
                </td>
                <td className="p-4 space-x-2">
                  <button onClick={() => handleEdit(p)} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">编辑</button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
