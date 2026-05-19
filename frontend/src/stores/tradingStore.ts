import { create } from 'zustand';
import type { TradeOrder, Position, Portfolio } from '../types';
import { tradingService } from '../services/trading';

interface TradingState {
  orders: TradeOrder[];
  positions: Position[];
  portfolio: Portfolio | null;
  loading: boolean;
  fetchOrders: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchPortfolio: () => Promise<void>;
  createOrder: (order: Partial<TradeOrder>) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  orders: [],
  positions: [],
  portfolio: null,
  loading: false,

  fetchOrders: async () => {
    set({ loading: true });
    const { data } = await tradingService.getOrders();
    set({ orders: data, loading: false });
  },

  fetchPositions: async () => {
    const { data } = await tradingService.getPositions();
    set({ positions: data });
  },

  fetchPortfolio: async () => {
    const { data } = await tradingService.getPortfolio();
    set({ portfolio: data });
  },

  createOrder: async (order) => {
    await tradingService.createOrder(order);
    await get().fetchOrders();
  },

  cancelOrder: async (id) => {
    await tradingService.cancelOrder(id);
    await get().fetchOrders();
  },
}));
