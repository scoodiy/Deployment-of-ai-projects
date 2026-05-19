import api from './api';
import type { QAResponse } from '../types';

export const qaService = {
  ask: (question: string) => api.post<QAResponse>('/qa/ask', { question }),
};
