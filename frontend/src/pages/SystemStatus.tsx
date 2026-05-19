import { useEffect, useState } from 'react'
import { fetchHealth } from '../api/system'
import Disclaimer from '../components/Disclaimer'
import type { HealthStatus } from '../types'

export default function SystemStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card">
        <h3 className="font-semibold mb-4">后端服务状态</h3>
        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-gray-500">正在检查...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 py-4">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-red-600 font-medium">服务不可用</span>
            <span className="text-sm text-gray-500">{error}</span>
          </div>
        ) : health ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-600 font-medium">服务正常运行</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <div className="text-xs text-gray-400">服务名称</div>
                <div className="font-medium">{health.service}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">版本</div>
                <div className="font-medium">{health.version}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">状态</div>
                <div className="font-medium">{health.status}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">系统信息</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">前端版本</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">技术栈</span>
            <span className="font-medium">React + TypeScript + Vite + Tailwind CSS</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">图表引擎</span>
            <span className="font-medium">Apache ECharts</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">后端框架</span>
            <span className="font-medium">FastAPI + SQLAlchemy</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">数据库</span>
            <span className="font-medium">MySQL</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">安全声明</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">●</span>
            本平台不包含任何自动交易功能
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">●</span>
            不导入 easytrader 等交易库
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">●</span>
            不提供买卖下单、委托交易接口
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-500 mt-0.5">●</span>
            所有数据仅用于分析研究和回测展示
          </li>
        </ul>
      </div>

      <Disclaimer />
    </div>
  )
}
