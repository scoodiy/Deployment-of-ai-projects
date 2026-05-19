import api from './api';
import type { RiskMetrics, RiskAlert, RiskRule } from '../types';

export const riskService = {
  getMetrics: () => api.get<RiskMetrics>('/risk/metrics'),
  getAlerts: () => api.get<RiskAlert[]>('/risk/alerts'),
  getRules: () => api.get<RiskRule[]>('/risk/rules'),
  createRule: (data: Partial<RiskRule>) => api.post<RiskRule>('/risk/rules', data),
  updateRule: (id: string, data: Partial<RiskRule>) => api.put<RiskRule>(`/risk/rules/${id}`, data),
};
