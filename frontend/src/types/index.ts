export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface TradeOrder {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price: number;
  stop_price?: number;
  status: OrderStatus;
  created_at: string;
  strategy_id?: string;
}

export interface Position {
  symbol: string;
  side: OrderSide;
  quantity: number;
  avg_price: number;
  unrealized_pnl: number;
}

export interface Portfolio {
  total_value: number;
  total_pnl: number;
  trade_count: number;
}

export interface Strategy {
  id: string;
  name: string;
  type: string;
  params: Record<string, any>;
  is_active: boolean;
}

export interface RiskMetrics {
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  profit_factor: number;
  var_95: number;
  total_trades: number;
  consecutive_losses: number;
}

export interface RiskAlert {
  id: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  rule: string;
  message: string;
  value: number;
  threshold: number;
}

export interface Ticker {
  symbol: string;
  price: number;
  volume: number;
  change_24h: number;
  timestamp: string;
}

export interface Kline {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: string;
  timestamp: string;
}

export interface QAResponse {
  answer: string;
  sources: string[];
  confidence: number;
}

export interface RiskRule {
  id: string;
  user_id: string;
  rule_type: string;
  params: Record<string, any>;
  is_active: boolean;
}
