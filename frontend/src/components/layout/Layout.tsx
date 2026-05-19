import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/Toast';
import { useUIStore } from '../../stores/uiStore';
import clsx from 'clsx';

export function Layout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-dark-bg">
      <Sidebar />
      <div className={clsx('transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-56')}>
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
