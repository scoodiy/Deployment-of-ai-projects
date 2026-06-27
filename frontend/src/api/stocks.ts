import client from './client'
import type {
  CyqData,
  IndicatorData,
  KlineData,
  MarketOverview,
  PaginatedResponse,
  PatternData,
  SelectionParams,
  StockDetail,
  StockListItem,
} from '../types'

/** 市场概览 */
export function fetchMarketOverview(): Promise<MarketOverview> {
  return client.get('/api/market/overview')
}

/** 股票列表 */
export function fetchStockList(params: {
  keyword?: string
  market?: string
  industry?: string
  sort_by?: string
  sort_order?: string
  page?: number
  page_size?: number
}): Promise<PaginatedResponse<StockListItem>> {
  return client.get('/api/stocks', { params })
}

/** 行业列表 */
export function fetchIndustries(): Promise<string[]> {
  return client.get('/api/stocks/industries')
}

/** 个股详情 */
export function fetchStockDetail(code: string): Promise<StockDetail> {
  return client.get(`/api/stocks/${code}`)
}

/** K线数据 */
export function fetchKline(
  code: string,
  params?: { start_date?: string; end_date?: string; period?: number },
): Promise<KlineData[]> {
  return client.get(`/api/stocks/${code}/kline`, { params })
}

/** 技术指标 */
export function fetchIndicators(
  code: string,
  params?: { start_date?: string; end_date?: string; period?: number },
): Promise<IndicatorData[]> {
  return client.get(`/api/stocks/${code}/indicators`, { params })
}

/** K线形态 */
export function fetchPatterns(
  code: string,
  params?: { start_date?: string; end_date?: string },
): Promise<PatternData[]> {
  return client.get(`/api/stocks/${code}/patterns`, { params })
}

/** 筹码分布 */
export function fetchCyq(
  code: string,
  params?: { trade_date?: string },
): Promise<CyqData[]> {
  return client.get(`/api/stocks/${code}/cyq`, { params })
}

/** 综合选股 */
export function runSelection(params: SelectionParams): Promise<PaginatedResponse<StockListItem>> {
  return client.post('/api/selections/run', null, { params })
}
