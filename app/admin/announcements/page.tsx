'use client';

import { useState, useEffect, useCallback } from 'react';
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from '../../../components/admin/AdminUI';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';
import { useToast } from '../../../components/admin/Toast';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  is_important: number;
  is_pinned: number;
  status: string;
  display_scope: string;
  publish_at: string | null;
  end_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

const defaultForm = {
  title: '',
  content: '',
  type: 'notice',
  is_important: false,
  is_pinned: false,
  status: 'draft',
  display_scope: 'all',
  publish_at: '',
  end_at: '',
};

const typeLabels: Record<string, string> = {
  notice: '普通通知',
  important: '重要公告',
  maintenance: '维护通知',
};

const statusLabels: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  offline: '已下线',
};

function getStatusTone(status: string): 'warning' | 'success' | 'danger' | 'muted' {
  if (status === 'draft') return 'warning';
  if (status === 'published') return 'success';
  if (status === 'offline') return 'danger';
  return 'muted';
}

export default function AnnouncementsAdminPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(null!);
  const [pendingTitle, setPendingTitle] = useState('');
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('loadAnnouncements error:', err);
    }
  }, []);

  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editId ? `/api/admin/announcements/${editId}` : '/api/admin/announcements';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          publish_at: form.publish_at || null,
          end_at: form.end_at || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `操作失败 (${res.status})`);
      }
      setShowForm(false);
      setEditId(null);
      setForm(defaultForm);
      loadAnnouncements();
    } catch (err) {
      toast(err instanceof Error ? err.message : "操作失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (a: Announcement) => {
    setForm({
      title: a.title,
      content: a.content,
      type: a.type,
      is_important: !!a.is_important,
      is_pinned: !!a.is_pinned,
      status: a.status,
      display_scope: a.display_scope || 'all',
      publish_at: a.publish_at ? a.publish_at.slice(0, 16) : '',
      end_at: a.end_at ? a.end_at.slice(0, 16) : '',
    });
    setEditId(a.id);
    setShowForm(true);
  };

  const handleDelete = (id: number, title: string) => {
    setPendingTitle(title);
    setPendingDelete(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/announcements/${pendingDelete}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `删除失败 (${res.status})`);
      }
      loadAnnouncements();
    } catch (err) {
      toast(err instanceof Error ? err.message : "删除失败", "error");
    } finally {
      setLoading(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="公告管理"
        description="发布和管理站点公告，支持置顶、定时发布和重要公告弹窗提醒。"
        actions={
          <ActionButton tone="info" onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm); }}>
            + 添加公告
          </ActionButton>
        }
      />

      {showForm && (
        <AdminCard className="p-6">
          <h3 className="text-lg font-semibold text-slate-950 mb-4">{editId ? '编辑公告' : '添加公告'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="公告标题" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 md:col-span-2" required />
              <textarea placeholder="公告内容（支持换行）" value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 md:col-span-2 min-h-[120px]" />
              <select value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="min-h-12 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-400">
                <option value="notice">普通通知</option>
                <option value="important">重要公告</option>
                <option value="maintenance">维护通知</option>
              </select>
              <select value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="min-h-12 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-400">
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="offline">已下线</option>
              </select>
              <select value={form.display_scope}
                onChange={(e) => setForm({ ...form, display_scope: e.target.value })}
                className="min-h-12 px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-400">
                <option value="all">全站显示</option>
                <option value="homepage_only">仅首页显示</option>
              </select>
              <div>
                <label className="text-slate-500 text-sm block mb-1">发布时间</label>
                <input type="datetime-local" value={form.publish_at}
                  onChange={(e) => setForm({ ...form, publish_at: e.target.value })}
                  className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 w-full focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-slate-500 text-sm block mb-1">结束时间</label>
                <input type="datetime-local" value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  className="px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 w-full focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={form.is_important}
                  onChange={(e) => setForm({ ...form, is_important: e.target.checked })} className="rounded" />
                重要公告（弹窗提醒）
              </label>
              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })} className="rounded" />
                置顶显示
              </label>
            </div>
            <div className="flex gap-2">
              <ActionButton tone="info" type="submit" disabled={loading}>
                {editId ? '更新' : '添加'}
              </ActionButton>
              <ActionButton tone="muted" onClick={() => setShowForm(false)} disabled={loading}>
                取消
              </ActionButton>
            </div>
          </form>
        </AdminCard>
      )}

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">标题</th>
                <th className="px-5 py-3 font-semibold">类型</th>
                <th className="px-5 py-3 font-semibold">范围</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">重要</th>
                <th className="px-5 py-3 font-semibold">置顶</th>
                <th className="px-5 py-3 font-semibold">版本</th>
                <th className="px-5 py-3 font-semibold">创建时间</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {announcements.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-500">暂无公告</td></tr>
              ) : (
                announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-950 max-w-[200px] truncate">{a.title}</td>
                    <td className="px-5 py-3">{typeLabels[a.type] || a.type}</td>
                    <td className="px-5 py-3">{a.display_scope === 'homepage_only' ? '仅首页' : '全站'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={getStatusTone(a.status)}>
                        {statusLabels[a.status] || a.status}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3">{a.is_important ? '✅' : '—'}</td>
                    <td className="px-5 py-3">{a.is_pinned ? '📌' : '—'}</td>
                    <td className="px-5 py-3">v{a.version}</td>
                    <td className="px-5 py-3 text-slate-500">{a.created_at?.slice(0, 16)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <ActionButton tone="info" onClick={() => handleEdit(a)} disabled={loading}>编辑</ActionButton>
                        <ActionButton tone="danger" onClick={() => handleDelete(a.id, a.title)} disabled={pendingDelete === a.id}>删除</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <ConfirmDialog
        open={confirmOpen}
        title="确认删除"
        message={`确定删除公告「${pendingTitle}」？`}
        danger
        confirmText="确认"
        cancelText="取消"
        onConfirm={() => { setConfirmOpen(false); confirmDelete(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
