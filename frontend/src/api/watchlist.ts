import client from './client'
import type { WatchlistAddRequest, WatchlistItem, WatchlistResponse } from '../types'

/** 获取关注列表 */
export function fetchWatchlist(): Promise<WatchlistResponse> {
  return client.get('/api/watchlist')
}

/** 添加关注 */
export function addToWatchlist(data: WatchlistAddRequest): Promise<WatchlistItem> {
  return client.post('/api/watchlist', data)
}

/** 取消关注 */
export function removeFromWatchlist(code: string): Promise<void> {
  return client.delete(`/api/watchlist/${code}`)
}
