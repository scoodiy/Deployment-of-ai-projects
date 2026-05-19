import api from './api';
import type { RiskMetrics, RiskAlert } from '../types';

export const riskService = {
  getMetrics: () => api.get<RiskMetrics>('/risk/metrics'),
  getAlerts: () => api.get<RiskAlert[]>('/risk/alerts'),
  getRules: () => api.get('/risk/rules'),
  createRule: (data: any) => api.post('/risk/rules', data),
};
