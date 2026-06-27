import { useEffect, useState } from 'react'
import { fetchHealth } from '../api/system'
import type { HealthStatus } from '../types'

export default function SystemStatus() {
  const [status, setStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHealth()
      .then(setStatus)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="font-semibold mb-4">系统状态</h3>
        {error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div>
              <div className="font-medium text-red-700">后端服务未连接</div>
              <div className="text-sm text-red-500 mt-1">请确认后端服务已启动并正常运行</div>
            </div>
          </div>
        ) : status ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div>
              <div className="font-medium text-green-700">{status.service} v{status.version}</div>
              <div className="text-sm text-green-500 mt-1">状态: {status.status}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">功能模块</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: '数据抓取', desc: '从东方财富获取股票数据', icon: '📊' },
            { name: '技术指标', desc: 'MACD/KDJ/RSI/BOLL等32种指标', icon: '📈' },
            { name: 'K线形态', desc: '61种K线形态识别', icon: '🕯️' },
            { name: '选股策略', desc: '海龟/低ATR/突破平台等10种策略', icon: '💡' },
            { name: '策略回测', desc: '历史数据回测验证', icon: '⏱️' },
            { name: '综合选股', desc: '多维度条件筛选', icon: '🔍' },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">{m.icon}</span>
              <div>
                <div className="font-medium text-sm">{m.name}</div>
                <div className="text-xs text-gray-500">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card text-center text-sm text-gray-400 py-4">
        本网站仅用于股票数据分析、策略研究和回测展示，不构成任何投资建议，不提供自动交易或委托下单服务。
      </div>
    </div>
  )
}
