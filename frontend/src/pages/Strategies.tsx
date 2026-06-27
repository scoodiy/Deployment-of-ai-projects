import { useEffect, useState } from 'react'
import { fetchStrategies, fetchStrategyResults } from '../api/strategies'
import type { StrategyInfo, StrategyResultItem } from '../types'

export default function Strategies() {
  const [strategies, setStrategies] = useState<StrategyInfo[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [results, setResults] = useState<StrategyResultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStrategies()
      .then((d) => { setStrategies(d.items); if (d.items.length > 0) setSelected(d.items[0].id) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    fetchStrategyResults(selected)
      .then((d) => setResults(d.items))
      .catch(() => setResults([]))
  }, [selected])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  if (error || strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="text-4xl">💡</div>
        <p className="text-gray-500">后端服务未连接或暂无策略数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {strategies.map((s) => (
          <button
            key={s.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selected === s.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setSelected(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>

      {strategies.find((s) => s.id === selected) && (
        <div className="card">
          <h3 className="font-semibold">{strategies.find((s) => s.id === selected)?.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{strategies.find((s) => s.id === selected)?.description || '暂无描述'}</p>
        </div>
      )}

      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-3">选股结果</h3>
        {results.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无选股结果</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-2 md:px-4 py-3">代码</th>
                <th className="px-2 md:px-4 py-3">名称</th>
                <th className="px-2 md:px-4 py-3 hidden sm:table-cell">日期</th>
                <th className="px-2 md:px-4 py-3 text-right">评分</th>
                <th className="px-2 md:px-4 py-3 text-right hidden sm:table-cell">价格</th>
                <th className="px-2 md:px-4 py-3 hidden md:table-cell">原因</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-2 md:px-4 py-3 font-mono text-blue-600">{r.code}</td>
                  <td className="px-2 md:px-4 py-3">{r.name || '-'}</td>
                  <td className="px-2 md:px-4 py-3 text-gray-500 hidden sm:table-cell">{r.trade_date}</td>
                  <td className="px-2 md:px-4 py-3 text-right font-mono">{r.score?.toFixed(1) ?? '-'}</td>
                  <td className="px-2 md:px-4 py-3 text-right font-mono hidden sm:table-cell">{r.price?.toFixed(2) ?? '-'}</td>
                  <td className="px-2 md:px-4 py-3 text-gray-500 max-w-[200px] truncate hidden md:table-cell">{r.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
