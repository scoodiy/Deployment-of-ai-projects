import api from './api';
import type { Strategy } from '../types';

export const strategyService = {
  getAll: () => api.get<Strategy[]>('/strategies/'),
  create: (data: Partial<Strategy>) => api.post<Strategy>('/strategies/', data),
  update: (id: string, data: Partial<Strategy>) => api.put<Strategy>(`/strategies/${id}`, data),
  delete: (id: string) => api.delete(`/strategies/${id}`),
  activate: (id: string) => api.post(`/strategies/${id}/activate`),
  deactivate: (id: string) => api.post(`/strategies/${id}/deactivate`),
};
