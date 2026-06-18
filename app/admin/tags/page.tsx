'use client';

import { useState, useEffect } from 'react';

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">标签管理</h2>
        <button onClick={() => setShowCreateDialog(true)} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
          新建标签
        </button>
      </div>

      {/* 标签列表 */}
      <div className="bg-black/30 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-white/10 bg-white/5">
                <th className="p-4">ID</th>
                <th className="p-4">标签</th>
                <th className="p-4">颜色</th>
                <th className="p-4">创建时间</th>
                <th className="p-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">加载中...</td></tr>
              ) : tags.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">暂无标签</td></tr>
              ) : (
                tags.map(tag => (
                  <tr key={tag.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5">
                    <td className="p-4 text-gray-500">{tag.id}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-white text-sm" style={{ backgroundColor: tag.color + '33', borderColor: tag.color, borderWidth: 1 }}>
                        {tag.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: tag.color }}></div>
                        <span className="text-sm text-gray-400">{tag.color}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{new Date(tag.created_at).toLocaleString('zh-CN')}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        className="px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 创建标签对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl border border-white/10 p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-4">新建标签</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">标签名</label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  placeholder="请输入标签名"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={e => setNewTagColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-400">{newTagColor}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowCreateDialog(false); setNewTagName(''); setNewTagColor('#3B82F6'); }} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20">
                取消
              </button>
              <button onClick={handleCreateTag} disabled={!newTagName.trim()} className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}