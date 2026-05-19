import api from './api';
import type { TradeOrder, Position, Portfolio } from '../types';

export const tradingService = {
  createOrder: (order: Partial<TradeOrder>) => api.post<TradeOrder>('/trades/orders', order),
  getOrders: () => api.get<TradeOrder[]>('/trades/orders'),
  cancelOrder: (id: string) => api.delete(`/trades/orders/${id}`),
  getPositions: () => api.get<Position[]>('/trades/positions'),
  getPortfolio: () => api.get<Portfolio>('/trades/portfolio'),
};
