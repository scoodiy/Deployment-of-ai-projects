'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const menuItems = [
  { path: '/admin/dashboard', label: '仪表盘', icon: '📊' },
  { path: '/admin/blogs', label: '博客管理', icon: '📝' },
  { path: '/admin/images', label: '图片管理', icon: '🖼️' },
  { path: '/admin/music', label: '音乐管理', icon: '🎵' },
  { path: '/admin/friends', label: '友链管理', icon: '🔗' },
  { path: '/admin/projects', label: '项目管理', icon: '🚀' },
  { path: '/admin/comments', label: '评论管理', icon: '💬' },
  { path: '/admin/users', label: '用户管理', icon: '👥' },
  { path: '/admin/tags', label: '标签管理', icon: '🏷️' },
  { path: '/admin/site', label: '首页配置', icon: '🏠' },
  { path: '/admin/about', label: '关于页面', icon: '👤' },
  { path: '/admin/settings', label: '系统设置', icon: '⚙️' },
  { path: '/admin/logs', label: '操作日志', icon: '📋' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<{ nickname?: string; username?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    
    fetch('/api/admin/profile')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => setAdmin(data.admin))
      .catch(() => router.push('/admin/login'));
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col`}>
        <div className="p-4 border-b border-white/10">
          <h1 className={`font-bold text-white ${sidebarOpen ? 'text-xl' : 'text-center text-sm'}`}>
            {sidebarOpen ? '☁️ y悠悠后台' : '☁️'}
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                pathname.startsWith(item.path)
                  ? 'bg-purple-500/30 text-white border border-purple-400/50'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
          >
            {sidebarOpen ? '◀ 收起' : '▶'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-lg font-semibold">
            {menuItems.find(item => pathname.startsWith(item.path))?.label || '后台管理'}
          </h2>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-300">
              👤 {admin?.nickname || admin?.username || '管理员'}
            </span>
            <Link
              href="/"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              target="_blank"
            >
              🏠 查看网站
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              退出登录
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
