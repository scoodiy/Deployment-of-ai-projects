'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserProvider';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  nickname: string;
  avatar: string;
  bio: string;
  signature: string;
  status: string;
  created_at: string;
}

export default function UserSettingsPage() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ nickname: '', bio: '', signature: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setProfile(data.user);
        setForm({
          nickname: data.user.nickname || '',
          bio: data.user.bio || '',
          signature: data.user.signature || '',
          email: data.user.email || '',
        });
        setAvatarPreview(data.user.avatar || '');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/user/avatar', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok) {
        setAvatarPreview(data.url);
        setMessage({ type: 'success', text: '头像上传成功' });
        // Update user context
        if (user) setUser({ ...user, avatar: data.url });
      } else {
        setMessage({ type: 'error', text: data.error || '上传失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '上传失败' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || '保存成功' });
        if (user) setUser({ ...user, nickname: form.nickname });
      } else {
        setMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '保存失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: '两次密码不一致' });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordMessage({ type: 'error', text: '新密码至少6位' });
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({ type: 'success', text: data.message || '密码修改成功' });
        setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      } else {
        setPasswordMessage({ type: 'error', text: data.error || '修改失败' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: '修改失败' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-20 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 返回按钮 */}
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors text-sm">
          ← 返回
        </button>

        <h1 className="text-3xl font-bold text-white">个人设置</h1>

        {/* 头像和基本资料 */}
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-6">👤 基本资料</h2>

          {/* 头像 */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-indigo-300">{profile.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            <div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/jpeg,image/png,image/webp" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm"
              >
                📷 上传头像
              </button>
              <p className="text-gray-500 text-xs mt-1">支持 jpg、png、webp，最大 2MB</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1.5">用户名</label>
              <input
                type="text"
                value={profile.username}
                disabled
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1.5">邮箱</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                placeholder="请输入邮箱"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1.5">昵称</label>
              <input
                type="text"
                value={form.nickname}
                onChange={e => setForm({ ...form, nickname: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                placeholder="设置你的昵称"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1.5">个人简介</label>
              <textarea
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 h-24"
                placeholder="介绍一下自己"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1.5">个性签名</label>
              <input
                type="text"
                value={form.signature}
                onChange={e => setForm({ ...form, signature: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                placeholder="写一句个性签名"
              />
            </div>

            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                  : 'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-blue-600 transition-all disabled:opacity-50"
            >
              {loading ? '保存中...' : '💾 保存资料'}
            </button>
          </form>
        </div>

        {/* 修改密码 */}
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-6">🔐 修改密码</h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1.5">旧密码</label>
              <input
                type="password"
                value={passwordForm.old_password}
                onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1.5">新密码</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1.5">确认新密码</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                required
                minLength={6}
              />
            </div>

            {passwordMessage.text && (
              <div className={`p-3 rounded-lg text-sm ${
                passwordMessage.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                  : 'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}>
                {passwordMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 bg-purple-500/20 text-purple-300 rounded-lg font-medium hover:bg-purple-500/30 transition-all disabled:opacity-50"
            >
              {passwordLoading ? '修改中...' : '🔑 修改密码'}
            </button>
          </form>
        </div>

        {/* 账号信息 */}
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4">ℹ️ 账号信息</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-gray-400">用户ID</div>
            <div className="text-white">{profile.id}</div>
            <div className="text-gray-400">注册时间</div>
            <div className="text-white">{new Date(profile.created_at).toLocaleDateString('zh-CN')}</div>
            <div className="text-gray-400">账号状态</div>
            <div className="text-green-300">{profile.status === 'active' ? '正常' : '已封禁'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
