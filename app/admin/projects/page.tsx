"use client";

import { useState, useEffect, useCallback } from "react";
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from "../../../components/admin/AdminUI";
import ConfirmDialog from "../../../components/admin/ConfirmDialog";
import { useToast } from "../../../components/admin/Toast";

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
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; id: number; loading?: boolean } | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { toast } = useToast();

  const loadProjects = useCallback(async () => {
    const res = await fetch("/api/admin/projects");
    const data = await res.json();
    setProjects(data.projects || []);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editId ? `/api/admin/projects/${editId}` : "/api/admin/projects";
      const method = editId ? "PUT" : "POST";

      let tagsStr = form.tags.trim();
      if (!tagsStr.startsWith('[')) {
        tagsStr = JSON.stringify(tagsStr.split(',').map(t => t.trim()).filter(Boolean));
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags: tagsStr }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error || "操作失败", "error");
        return;
      }

      setShowForm(false);
      setEditId(null);
      setForm({ name: "", description: "", icon: "🚀", github_url: "", tags: "", sort_order: 0, is_enabled: true });
      loadProjects();
    } finally {
      setLoading(false);
    }
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
      const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `删除失败 (${res.status})`);
      }
      await res.json();
      loadProjects();
    } catch (err) {
      toast(err instanceof Error ? err.message : "删除失败", "error");
    } finally {
      setPendingAction(null);
    }
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
      <AdminPageHeader
        title="项目管理"
        description="管理展示的项目列表、标签、排序和启用状态。"
        actions={
          <ActionButton tone="info" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", description: "", icon: "🚀", github_url: "", tags: "", sort_order: 0, is_enabled: true }); }}>
            + 添加项目
          </ActionButton>
        }
      />

      {showForm && (
        <AdminCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="项目名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" required />
              <input type="text" placeholder="图标 (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
              <input type="text" placeholder="GitHub URL" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
              <input type="text" placeholder="标签 (逗号分隔)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
              <input type="number" placeholder="排序" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400" />
            </div>
            <textarea placeholder="项目描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 h-24" />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={form.is_enabled} onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })} className="rounded" />
                启用
              </label>
            </div>
            <div className="flex gap-2">
              <ActionButton tone="info" type="submit" disabled={loading}>{editId ? "更新" : "添加"}</ActionButton>
              <ActionButton tone="muted" onClick={() => setShowForm(false)}>取消</ActionButton>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">项目</th>
                <th className="px-5 py-3 font-semibold">描述</th>
                <th className="px-5 py-3 font-semibold">标签</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.icon}</span>
                      <span className="font-medium text-slate-950">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 truncate max-w-xs">{p.description}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {parseTags(p.tags).map(tag => (
                        <StatusBadge key={tag} tone="info">{tag}</StatusBadge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge tone={p.is_enabled ? "success" : "muted"}>
                      {p.is_enabled ? "启用" : "禁用"}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <ActionButton tone="info" onClick={() => handleEdit(p)}>编辑</ActionButton>
                      <ActionButton tone="danger" onClick={() => handleDelete(p.id, p.name)} disabled={pendingAction?.id === p.id && pendingAction?.loading}>删除</ActionButton>
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
        message={`确定删除项目「${pendingName}」？`}
        danger
        confirmText="确认"
        cancelText="取消"
        onConfirm={() => { setConfirmOpen(false); confirmDelete(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
