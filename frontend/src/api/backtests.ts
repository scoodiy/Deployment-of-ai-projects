import client from './client'
import type { BacktestDetail, BacktestListResponse } from '../types'

/** 回测列表 */
export function fetchBacktests(params?: {
  strategy_id?: number
  status?: string
  page?: number
  page_size?: number
}): Promise<BacktestListResponse> {
  return client.get('/api/backtests', { params })
}

/** 回测详情 */
export function fetchBacktestDetail(id: number): Promise<BacktestDetail> {
  return client.get(`/api/backtests/${id}`)
}
