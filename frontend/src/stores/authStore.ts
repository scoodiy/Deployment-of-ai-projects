import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (username, password) => {
    const { data } = await authService.login(username, password);
    localStorage.setItem('token', data.access_token);
    set({ token: data.access_token, isAuthenticated: true });
    const { data: user } = await authService.getMe();
    set({ user });
  },

  register: async (username, email, password) => {
    await authService.register(username, email, password);
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const { data } = await authService.getMe();
      set({ user: data, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
