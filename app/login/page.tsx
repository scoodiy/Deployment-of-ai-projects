'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/components/UserProvider';

type Mode = 'login' | 'register' | 'reset' | 'verify';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" aria-busy="true" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUser();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', code: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSending, setCodeSending] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);

  useEffect(() => {
    if (searchParams.get('mode') === 'register') setMode('register');
  }, [searchParams]);

  const startCountdown = () => {
    setCodeCountdown(60);
    const timer = setInterval(() => {
      setCodeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCode = async () => {
    if (!form.email) {
      setError('请先输入邮箱');
      return;
    }
    const type = mode === 'reset' ? 'reset_password' : mode === 'verify' ? 'verify_email' : 'register';
    sendCodeForEmail(form.email, type);
  };

  const sendCodeForEmail = async (email: string, type: string) => {
    setCodeSending(true);
    setError('');
    try {
      const res = await fetch('/api/user/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('验证码已发送到您的邮箱');
        startCountdown();
      } else {
        setError(data.error || '发送失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setCodeSending(false);
    }
  };

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
      if (mode === 'reset') {
        // Password reset flow
        const res = await fetch('/api/user/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, code: form.code, new_password: form.password }),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess('密码重置成功，请重新登录');
          setTimeout(() => setMode('login'), 2000);
        } else {
          setError(data.error || '重置失败');
        }
      } else if (mode === 'verify') {
        // Email verification flow
        const res = await fetch('/api/user/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, code: form.code }),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccess('邮箱验证成功，请登录');
          setTimeout(() => { setMode('login'); setForm({ ...form, code: '' }); }, 2000);
        } else {
          setError(data.error || '验证失败');
        }
      } else {
        // Login or register flow
        const endpoint = mode === 'login' ? '/api/user/login' : '/api/user/register';
        const body = mode === 'login'
          ? { email: form.email, password: form.password }
          : { username: form.username, email: form.email, password: form.password, code: form.code };

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
          } else if (mode === 'register') {
            setSuccess('注册成功，请登录');
            setTimeout(() => { setMode('login'); setForm({ ...form, password: '', confirmPassword: '', code: '' }); }, 2000);
          } else if (mode === 'verify') {
            setSuccess('邮箱验证成功，请登录');
            setTimeout(() => { setMode('login'); setForm({ ...form, code: '' }); }, 2000);
          }
        } else {
          const errData = data;
          if (errData.code === 'EMAIL_NOT_VERIFIED') {
            setError('邮箱未验证，请先验证邮箱');
            setMode('verify');
          } else {
            setError(typeof errData.error === 'object' ? errData.error?.message || '操作失败' : errData.error || '操作失败');
          }
        }
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
            {mode === 'verify' && (
              <button
                className="flex-1 py-2.5 rounded-md text-sm font-bold bg-indigo-500 text-white"
              >
                验证邮箱
              </button>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">
            👤 {mode === 'login' ? '用户登录' : mode === 'register' ? '用户注册' : mode === 'verify' ? '验证邮箱' : '重置密码'}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {mode === 'login' ? '登录后可评论、互动等' : mode === 'register' ? '注册一个账号开始使用' : mode === 'verify' ? '输入邮箱验证码完成验证' : '通过邮箱验证码重置密码'}
          </p>

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

            {/* 邮箱 */}
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

            {/* 验证码 - 注册、重置密码和验证模式时显示 */}
            {(mode === 'register' || mode === 'reset' || mode === 'verify') && (
              <div>
                <label className="block text-gray-300 text-sm mb-1.5">验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    placeholder="请输入6位验证码"
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={codeSending || codeCountdown > 0}
                    className="px-4 py-2.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-sm hover:bg-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {codeSending ? '发送中...' : codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            )}

            {/* 密码 - 登录、注册和重置时显示 */}
            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div>
                <label className="block text-gray-300 text-sm mb-1.5">{mode === 'reset' ? '新密码' : '密码'}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  placeholder={mode === 'reset' ? '请输入新密码' : '请输入密码'}
                  required
                />
              </div>
            )}

            {/* 确认密码 - 仅注册时 */}
            {(mode === 'register') && (
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
              {loading ? '请稍候...' : mode === 'login' ? '登录' : mode === 'register' ? '注册' : mode === 'verify' ? '验证邮箱' : '重置密码'}
            </button>
          </form>

          {/* 忘记密码链接 - 仅登录模式显示 */}
          {mode === 'login' && (
            <div className="mt-3 text-center">
              <button
                onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                忘记密码？
              </button>
            </div>
          )}

          {/* 返回登录 - 重置密码和验证模式显示 */}
          {(mode === 'reset' || mode === 'verify') && (
            <div className="mt-3 text-center">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                ← 返回登录
              </button>
            </div>
          )}

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
