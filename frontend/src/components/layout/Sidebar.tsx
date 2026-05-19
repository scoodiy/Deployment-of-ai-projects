import { NavLink } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { NAV_ITEMS } from '../../utils/constants';
import {
  LayoutDashboard, TrendingUp, Brain, Shield, BarChart3, Bitcoin,
  MessageSquare, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

const ICONS: Record<string, any> = {
  LayoutDashboard, TrendingUp, Brain, Shield, BarChart3, Bitcoin, MessageSquare, Settings,
};

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-screen bg-dark-card border-r border-dark-border flex flex-col z-40 transition-all duration-300',
      sidebarCollapsed ? 'w-16' : 'w-56'
    )}>
      <div className="flex items-center h-16 px-4 border-b border-dark-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white">QuantBot</span>
          </div>
        )}
        {sidebarCollapsed && <TrendingUp className="h-5 w-5 text-primary-400 mx-auto" />}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-dark-surface'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="p-3 border-t border-dark-border hover:bg-dark-surface transition-colors flex items-center justify-center"
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronLeft className="h-4 w-4 text-gray-400" />}
      </button>
    </aside>
  );
}
