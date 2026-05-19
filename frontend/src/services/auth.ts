import api from './api';
import type { User, Token } from '../types';

export const authService = {
  login: (username: string, password: string) => api.post<Token>('/users/login', { username, password }),
  register: (username: string, email: string, password: string) => api.post<User>('/users/register', { username, email, password }),
  getMe: () => api.get<User>('/users/me'),
};
