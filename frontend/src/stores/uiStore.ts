import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  notifications: { id: string; message: string; type: string }[];
  addNotification: (msg: string, type?: string) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  notifications: [],
  addNotification: (message, type = 'info') => set((s) => ({
    notifications: [...s.notifications, { id: Date.now().toString(), message, type }],
  })),
  removeNotification: (id) => set((s) => ({
    notifications: s.notifications.filter((n) => n.id !== id),
  })),
}));
