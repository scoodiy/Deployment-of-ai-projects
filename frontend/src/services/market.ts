import api from './api';
import type { Ticker, Kline } from '../types';

export const marketService = {
  getStockTicker: (symbol: string) => api.get<Ticker>(`/stocks/market/${symbol}`),
  getStockKlines: (symbol: string, interval = '1d', limit = 100) => api.get<Kline[]>(`/stocks/klines/${symbol}`, { params: { interval, limit } }),
  searchStocks: (q: string) => api.get('/stocks/search', { params: { q } }),
  getCryptoTicker: (symbol: string) => api.get<Ticker>(`/crypto/market/${symbol}`),
  getCryptoKlines: (symbol: string, interval = '1h', limit = 100) => api.get<Kline[]>(`/crypto/klines/${symbol}`, { params: { interval, limit } }),
  getOrderbook: (symbol: string) => api.get(`/crypto/orderbook/${symbol}`),
};
