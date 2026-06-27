'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ToastProvider } from '../../components/admin/Toast';

const menuGroups = [
  {
    title: '总览',
    items: [{ path: '/admin/dashboard', label: '仪表盘', icon: '📊', description: '站点概况' }],
  },
  {
    title: '内容管理',
    items: [
      { path: '/admin/blogs', label: '博客管理', icon: '📝', description: '文章发布' },
      { path: '/admin/images', label: '图片管理', icon: '🖼️', description: '媒体资源' },
      { path: '/admin/music', label: '音乐管理', icon: '🎵', description: '歌单内容' },
      { path: '/admin/projects', label: '项目管理', icon: '🚀', description: '项目展示' },
      { path: '/admin/tags', label: '标签管理', icon: '🏷️', description: '内容标签' },
    ],
  },
  {
    title: '互动管理',
    items: [
      { path: '/admin/comments', label: '评论管理', icon: '💬', description: '留言审核' },
      { path: '/admin/ai', label: 'AI猫猫', icon: '🐾', description: '助理模型' },
      { path: '/admin/users', label: '用户管理', icon: '👥', description: '账号状态' },
      { path: '/admin/friends', label: '友链管理', icon: '🔗', description: '站点伙伴' },
    ],
  },
  {
    title: '站点配置',
    items: [
      { path: '/admin/site', label: '首页配置', icon: '🏠', description: '首页资料' },
      { path: '/admin/about', label: '关于页面', icon: '👤', description: '个人介绍' },
      { path: '/admin/announcements', label: '公告管理', icon: '📢', description: '站内通知' },
      { path: '/admin/settings', label: '系统设置', icon: '⚙️', description: '运行配置' },
      { path: '/admin/logs', label: '操作日志', icon: '📋', description: '审计记录' },
    ],
  },
];

type MenuItem = (typeof menuGroups)[number]['items'][number];

function isActivePath(pathname: string, path: string) {
  if (path === '/admin/dashboard') return pathname === path || pathname === '/admin';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<{ nickname?: string; username?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentItem = useMemo<MenuItem | undefined>(() => {
    return menuGroups.flatMap((group) => group.items).find((item) => isActivePath(pathname, item.path));
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/admin/login') return;

    fetch('/api/admin/profile')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => setAdmin(data.admin))
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
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-100 text-slate-900">
        {sidebarOpen ? (
          <button
            type="button"
            aria-label="关闭后台菜单"
            className="fixed inset-0 z-40 bg-slate-950 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-300 shadow-2xl transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
            <Link href="/admin/dashboard" className="min-w-0">
              <div className="truncate text-lg font-black text-white">y悠悠 Admin</div>
              <div className="text-xs text-slate-500">内容与站点控制台</div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-700 hover:text-white lg:hidden"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {menuGroups.map((group) => (
              <section key={group.title}>
                <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-sky-300/80">{group.title}</div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActivePath(pathname, item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex min-h-[46px] items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                          active
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-950/30'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-base">{item.icon}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{item.label}</span>
                          <span className={`block truncate text-xs ${active ? 'text-indigo-100' : 'text-slate-500'}`}>{item.description}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <div className="rounded-lg bg-slate-800 p-3">
              <div className="text-sm font-semibold text-white">{admin?.nickname || admin?.username || '管理员'}</div>
              <button type="button" onClick={handleLogout} className="mt-2 text-sm font-semibold text-rose-300 hover:text-rose-200">
                退出登录
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
                  aria-label="打开后台菜单"
                >
                  ☰
                </button>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-950">{currentItem?.label || '后台管理'}</h2>
                  <p className="hidden truncate text-sm text-slate-500 sm:block">{currentItem?.description || '管理站点内容与配置'}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  访问前台
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  退出
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
