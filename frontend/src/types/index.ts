// 股票基本信息
export interface StockBase {
  code: string
  name: string
  market: string
  industry?: string | null
  sector?: string | null
  is_active: boolean
}

// 股票列表项（含实时行情）
export interface StockListItem extends StockBase {
  price?: number | null
  pct_change?: number | null
  volume?: number | null
  amount?: number | null
  turnover?: number | null
  pe_ratio?: number | null
  market_cap?: number | null
}

// 股票详情
export interface StockDetail extends StockBase {
  list_date?: string | null
  total_share?: number | null
  float_share?: number | null
  price?: number | null
  pct_change?: number | null
  open?: number | null
  high?: number | null
  low?: number | null
  pre_close?: number | null
  volume?: number | null
  amount?: number | null
  turnover?: number | null
  pe_ratio?: number | null
  pb_ratio?: number | null
  market_cap?: number | null
  float_market_cap?: number | null
}

// K线数据
export interface KlineData {
  trade_date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  amount?: number | null
  turnover?: number | null
  pct_change?: number | null
}

// 技术指标
export interface IndicatorData {
  trade_date: string
  ma5?: number | null
  ma10?: number | null
  ma20?: number | null
  ma60?: number | null
  ma120?: number | null
  ma250?: number | null
  macd_dif?: number | null
  macd_dea?: number | null
  macd_hist?: number | null
  kdj_k?: number | null
  kdj_d?: number | null
  kdj_j?: number | null
  rsi6?: number | null
  rsi12?: number | null
  rsi24?: number | null
  boll_upper?: number | null
  boll_mid?: number | null
  boll_lower?: number | null
  vol_ma5?: number | null
  vol_ma10?: number | null
  atr?: number | null
  cci?: number | null
  wr?: number | null
  obv?: number | null
}

// K线形态
export interface PatternData {
  trade_date: string
  pattern_name: string
  pattern_type: string
  signal: string
  confidence?: number | null
  description?: string | null
}

// 筹码分布
export interface CyqData {
  trade_date: string
  price: number
  percent: number
  avg_cost?: number | null
  concentration_90?: number | null
  concentration_70?: number | null
  winner_rate?: number | null
}

// 市场概览
export interface MarketOverview {
  total_stocks: number
  up_count: number
  down_count: number
  flat_count: number
  total_amount: number
  avg_pct_change: number
  top_gainers: StockListItem[]
  top_losers: StockListItem[]
  top_volume: StockListItem[]
  market_indices: MarketIndex[]
}

export interface MarketIndex {
  code: string
  name: string
  price: number
  pct_change: number
  change_amount: number
  volume: number
  amount: number
}

// 分页响应
export interface PaginatedResponse<T> {
  total: number
  items: T[]
  page: number
  page_size: number
}

// 策略
export interface StrategyInfo {
  id: number
  name: string
  description?: string | null
  strategy_type: string
  parameters?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StrategyResultItem {
  id: number
  strategy_id: number
  code: string
  name?: string | null
  trade_date: string
  score?: number | null
  reason?: string | null
  price?: number | null
  pct_change?: number | null
}

export interface StrategyListResponse {
  total: number
  items: StrategyInfo[]
}

export interface StrategyResultResponse {
  strategy: StrategyInfo
  total: number
  items: StrategyResultItem[]
}

// 回测
export interface BacktestInfo {
  id: number
  name: string
  strategy_id?: number | null
  strategy_name?: string | null
  start_date: string
  end_date: string
  initial_capital: number
  final_capital?: number | null
  total_return?: number | null
  annual_return?: number | null
  max_drawdown?: number | null
  sharpe_ratio?: number | null
  win_rate?: number | null
  total_trades: number
  parameters?: string | null
  status: string
  created_at: string
  completed_at?: string | null
}

export interface BacktestTradeItem {
  id: number
  backtest_id: number
  code: string
  name?: string | null
  direction: string
  trade_date: string
  price: number
  volume: number
  amount: number
  commission?: number | null
  profit?: number | null
  profit_pct?: number | null
  reason?: string | null
}

export interface BacktestDetail extends BacktestInfo {
  trades: BacktestTradeItem[]
}

export interface BacktestListResponse {
  total: number
  items: BacktestInfo[]
}

// 关注列表
export interface WatchlistItem {
  id: number
  code: string
  name?: string | null
  remark?: string | null
  group_name?: string | null
  created_at: string
  price?: number | null
  pct_change?: number | null
  volume?: number | null
  amount?: number | null
}

export interface WatchlistAddRequest {
  code: string
  name?: string | null
  remark?: string | null
  group_name?: string | null
}

export interface WatchlistResponse {
  total: number
  items: WatchlistItem[]
}

// 综合选股请求参数
export interface SelectionParams {
  market?: string
  industry?: string
  min_price?: number
  max_price?: number
  min_pct_change?: number
  max_pct_change?: number
  min_volume?: number
  min_turnover?: number
  max_pe_ratio?: number
  max_pb_ratio?: number
  min_market_cap?: number
  max_market_cap?: number
  macd_golden_cross?: boolean
  kdj_golden_cross?: boolean
  rsi_oversold?: boolean
  rsi_overbought?: boolean
  above_ma5?: boolean
  above_ma20?: boolean
  min_winner_rate?: number
  max_concentration?: number
  page?: number
  page_size?: number
}

// 系统状态
export interface HealthStatus {
  status: string
  service: string
  version: string
}
