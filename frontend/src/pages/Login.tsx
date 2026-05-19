import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuthStore } from '../stores/authStore';
import { TrendingUp, Lock, User, Mail } from 'lucide-react';
import clsx from 'clsx';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, email, password);
        await login(username, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-profit/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 glow-blue">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">QuantBot</h1>
            <p className="text-sm text-gray-400 mt-1">智能量化交易平台</p>
          </div>

          {/* Toggle */}
          <div className="flex bg-dark-surface rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsRegister(false)}
              className={clsx('flex-1 py-2 rounded-md text-sm font-medium transition-all',
                !isRegister ? 'bg-primary-600 text-white' : 'text-gray-400')}
            >
              登录
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={clsx('flex-1 py-2 rounded-md text-sm font-medium transition-all',
                isRegister ? 'bg-primary-600 text-white' : 'text-gray-400')}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-9 h-4 w-4 text-gray-500" />
              <Input
                label="用户名"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            {isRegister && (
              <div className="relative">
                <Mail className="absolute left-3 top-9 h-4 w-4 text-gray-500" />
                <Input
                  label="邮箱"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            )}
            <div className="relative">
              <Lock className="absolute left-3 top-9 h-4 w-4 text-gray-500" />
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>

            {error && <p className="text-sm text-loss text-center">{error}</p>}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {isRegister ? '注册' : '登录'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            默认账号: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
