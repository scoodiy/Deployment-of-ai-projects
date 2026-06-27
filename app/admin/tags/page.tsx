'use client';

import { useState, useEffect } from 'react';
import { ActionButton, AdminCard, AdminPageHeader, StatusBadge } from '../../../components/admin/AdminUI';

interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  const loadTags = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tags');
      const data = await res.json();
      setTags(data.tags || []);
    } catch {
      console.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTags(); }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const res = await fetch('/api/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName, color: newTagColor }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowCreateDialog(false);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      loadTags();
    } else {
      alert(data.error || '创建失败');
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!confirm(`确定删除标签 "${tag.name}"？关联的用户标签也会被移除。`)) return;

    const res = await fetch(`/api/admin/tags/${tag.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      loadTags();
    } else {
      alert(data.error || '删除失败');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="标签管理"
        description="创建和管理用户标签，用于标记和归类用户。"
        actions={
          <ActionButton tone="info" onClick={() => setShowCreateDialog(true)}>
            新建标签
          </ActionButton>
        }
      />

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">标签</th>
                <th className="px-5 py-3 font-semibold">颜色</th>
                <th className="px-5 py-3 font-semibold">创建时间</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">加载中...</td></tr>
              ) : tags.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">暂无标签</td></tr>
              ) : (
                tags.map(tag => (
                  <tr key={tag.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">{tag.id}</td>
                    <td className="px-5 py-3">
                      <StatusBadge tone="info">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: tag.color }} />
                          {tag.name}
                        </span>
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: tag.color }}></div>
                        <span className="text-slate-500">{tag.color}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{new Date(tag.created_at).toLocaleString('zh-CN')}</td>
                    <td className="px-5 py-3">
                      <ActionButton tone="danger" onClick={() => handleDeleteTag(tag)}>
                        删除
                      </ActionButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-slate-950 mb-4">新建标签</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-500 mb-1">标签名</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
                  placeholder="请输入标签名"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={e => setNewTagColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-500">{newTagColor}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <ActionButton tone="muted" onClick={() => { setShowCreateDialog(false); setNewTagName(''); setNewTagColor('#3B82F6'); }}>
                取消
              </ActionButton>
              <ActionButton tone="info" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                创建
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
