'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserProvider';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('两次密码不一致');
      setLoading(false);
      return;
    }

    try {
      const endpoint = mode === 'login' ? '/api/user/login' : '/api/user/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        if (mode === 'login') {
          setUser({
            username: data.user.username,
            email: data.user.email,
            avatar: data.user.avatar || '',
          });
          router.push('/');
        } else {
          setSuccess('注册成功，请登录');
          setMode('login');
        }
      } else {
        setError(typeof data.error === 'object' ? data.error?.message || '操作失败' : data.error || '操作失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          {/* 返回按钮 */}
          <button
            onClick={() => router.back()}
            className="mb-4 text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← 返回
          </button>

          {/* 标签切换 */}
          <div className="flex mb-6 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all ${mode === 'login' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              登录
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all ${mode === 'register' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              注册
            </button>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">👤 {mode === 'login' ? '用户登录' : '用户注册'}</h1>
          <p className="text-gray-400 text-sm mb-6">{mode === 'login' ? '登录后可评论、互动等' : '注册一个账号开始使用'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-gray-300 text-sm mb-1.5">用户名</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-gray-300 text-sm mb-1.5">邮箱</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1.5">密码</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                placeholder="请输入密码"
                required
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-gray-300 text-sm mb-1.5">确认密码</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  placeholder="再次输入密码"
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-blue-600 transition-all disabled:opacity-50"
            >
              {loading ? '请稍候...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          {/* 分隔线 */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-gray-500 text-xs">或</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* 管理员入口 - 仅登录模式显示 */}
          {mode === 'login' && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full py-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg font-medium hover:bg-purple-500/20 transition-all text-sm"
            >
              ⚙️ 管理员登录
            </button>
          )}

          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-400 text-sm">
              ← 返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
