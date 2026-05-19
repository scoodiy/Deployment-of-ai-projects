import { Bell, Search, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export function Header() {
  const { user, logout } = useAuthStore();
  const { notifications } = useUIStore();

  return (
    <header className="h-16 bg-dark-card/50 backdrop-blur-md border-b border-dark-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            placeholder="搜索..."
            className="w-full bg-dark-surface border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-dark-surface rounded-lg transition-colors">
          <Bell className="h-5 w-5 text-gray-400" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-loss rounded-full" />
          )}
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-dark-border">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">{user?.username || '用户'}</p>
            <p className="text-xs text-gray-400">{user?.email || ''}</p>
          </div>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-white transition-colors ml-2">
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
