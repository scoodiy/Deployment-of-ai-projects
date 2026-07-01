'use client';

import { useEffect, useState } from 'react';
import { InputDialog } from '../../../components/admin/ConfirmDialog';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../components/admin/Toast';
import Pagination from '../../../components/admin/Pagination';
import { ActionButton, AdminCard, AdminPageHeader, AdminToolbar, StatusBadge } from '../../../components/admin/AdminUI';
import ConfirmDialog from '../../../components/admin/ConfirmDialog';

interface User {
  id: number;
  username: string;
  email: string;
  nickname: string;
  avatar: string;
  bio: string;
  signature: string;
  role: string;
  status: string;
  ban_reason: string;
  admin_remark: string;
  ai_daily_limit: number;
  must_change_password: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(null!);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [inputOpen, setInputOpen] = useState(false);
  const [pendingBanUser, setPendingBanUser] = useState<User | null>(null);

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (roleFilter) params.set('role', roleFilter);

    try {
      const res = await fetch(`/api/admin/users/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        toast(data.error || '导出失败', 'error');
      }
    } catch {
      toast('导出失败', 'error');
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      sort: sortBy,
      order: sortOrder,
    });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (roleFilter) params.set('role', roleFilter);

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data?.data?.users || []);
      setTotalPages(data?.data?.pagination?.totalPages || 1);
      setTotal(data?.data?.pagination?.total || 0);
    } catch {
      console.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, statusFilter, roleFilter, sortBy, sortOrder]);

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleBan = (user: User) => {
    setPendingBanUser(user);
    setInputOpen(true);
  };

  const handleBanConfirm = async (reason: string) => {
    setInputOpen(false);
    const user = pendingBanUser;
    if (!user) return;
    const res = await fetch(`/api/admin/users/${user.id}/ban`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (res.ok) {
      loadUsers();
      toast('用户已封禁', 'success');
    } else {
      toast(data.error || '封禁失败', 'error');
    }
  };

  const handleUnban = async (user: User) => {
    setConfirmMessage(`确定解封 ${user.username}？`);
    setPendingAction(async () => {
      const res = await fetch(`/api/admin/users/${user.id}/unban`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        loadUsers();
      } else {
        toast(data.error || '解封失败', 'error');
      }
    });
    setConfirmOpen(true);
  };

  const handleResetPassword = async (user: User) => {
    setConfirmMessage(`确定重置 ${user.username} 的密码？`);
    setPendingAction(async () => {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) {
        if (data.temp_password) {
          toast(`密码已重置\n临时密码: ${data.temp_password}\n请妥善保管，用户下次登录需修改密码`, 'success');
        } else {
          toast('密码已重置', 'success');
        }
      } else {
        toast(data.error || '重置失败', 'error');
      }
    });
    setConfirmOpen(true);
  };

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <StatusBadge tone="danger">超级管理员</StatusBadge>;
      case 'admin':
        return <StatusBadge tone="info">管理员</StatusBadge>;
      default:
        return <StatusBadge tone="muted">普通用户</StatusBadge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? <StatusBadge tone="success">正常</StatusBadge> : <StatusBadge tone="danger">已封禁</StatusBadge>;
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="用户管理"
        description={`管理注册用户、账号状态、角色和登录信息。当前共 ${total} 人。`}
        actions={<ActionButton onClick={handleExport} tone="success">导出CSV</ActionButton>}
      />

      <AdminToolbar>
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-[220px] flex-1 gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索用户名、邮箱、昵称..."
              className="min-h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-400"
            />
            <ActionButton onClick={handleSearch} tone="default">搜索</ActionButton>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="banned">已封禁</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
          >
            <option value="">全部角色</option>
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
            <option value="super_admin">超级管理员</option>
          </select>
        </div>
      </AdminToolbar>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-sm text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">用户</th>
                <th className="px-5 py-3 font-semibold">邮箱</th>
                <th className="px-5 py-3 font-semibold">角色</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="cursor-pointer px-5 py-3 font-semibold hover:text-slate-950" onClick={() => toggleSort('created_at')}>
                  注册时间 {sortBy === 'created_at' && (sortOrder === 'DESC' ? '↓' : '↑')}
                </th>
                <th className="cursor-pointer px-5 py-3 font-semibold hover:text-slate-950" onClick={() => toggleSort('last_login_at')}>
                  最后登录 {sortBy === 'last_login_at' && (sortOrder === 'DESC' ? '↓' : '↑')}
                </th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">加载中...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">暂无用户</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">{user.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-indigo-50">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-indigo-600">{(user.nickname || user.username).charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-950">{user.nickname || user.username}</div>
                          <div className="text-xs text-slate-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">{user.email}</td>
                    <td className="px-5 py-3">{getRoleBadge(user.role)}</td>
                    <td className="px-5 py-3">{getStatusBadge(user.status)}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(user.created_at).toLocaleDateString('zh-CN')}</td>
                    <td className="px-5 py-3 text-slate-500">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('zh-CN') : '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton onClick={() => router.push(`/admin/users/${user.id}`)} tone="info" disabled={loading}>详情</ActionButton>
                        {user.status === 'active' ? (
                          <ActionButton onClick={() => handleBan(user)} tone="danger">封禁</ActionButton>
                        ) : (
                          <ActionButton onClick={() => handleUnban(user)} tone="success">解封</ActionButton>
                        )}
                        <ActionButton onClick={() => handleResetPassword(user)} tone="warning">重置密码</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} onPageChange={setPage} /> : null}

      <ConfirmDialog
        open={confirmOpen}
        title="确认操作"
        message={confirmMessage}
        danger
        confirmText="确认"
        cancelText="取消"
        onConfirm={() => { setConfirmOpen(false); pendingAction?.(); }}
        onCancel={() => setConfirmOpen(false)}
      />

      <InputDialog
        open={inputOpen}
        title="封禁用户"
        message={pendingBanUser ? `请输入封禁 ${pendingBanUser.username} 的原因：` : ''}
        placeholder="封禁原因"
        confirmText="确认"
        cancelText="取消"
        danger
        onConfirm={handleBanConfirm}
        onCancel={() => setInputOpen(false)}
      />
    </div>
  );
}
