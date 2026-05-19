import client from './client'
import type { StrategyListResponse, StrategyResultResponse } from '../types'

/** 策略列表 */
export function fetchStrategies(params?: {
  strategy_type?: string
  is_active?: boolean
}): Promise<StrategyListResponse> {
  return client.get('/api/strategies', { params })
}

/** 策略选股结果 */
export function fetchStrategyResults(
  strategyId: number,
  params?: { trade_date?: string; page?: number; page_size?: number },
): Promise<StrategyResultResponse> {
  return client.get(`/api/strategies/${strategyId}/results`, { params })
}
