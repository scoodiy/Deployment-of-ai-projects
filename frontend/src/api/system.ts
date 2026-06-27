import client from './client'
import type { HealthStatus } from '../types'

/** 健康检查 */
export function fetchHealth(): Promise<HealthStatus> {
  return client.get('/api/health')
}
