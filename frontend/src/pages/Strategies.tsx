import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchStrategies, fetchStrategyResults } from '../api/strategies'
import Disclaimer from '../components/Disclaimer'
import StrategyCard from '../components/StrategyCard'
import type { StrategyInfo, StrategyResultItem } from '../types'

export default function Strategies() {
  const navigate = useNavigate()
  const [strategies, setStrategies] = useState<StrategyInfo[]>([])
  const [selected, setSelected] = useState<StrategyInfo | null>(null)
  const [results, setResults] = useState<StrategyResultItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchStrategies()
      .then((res) => {
        setStrategies(res.items)
        if (res.items.length > 0) setSelected(res.items[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setResultsLoading(true)
    fetchStrategyResults(selected.id, { page, page_size: 20 })
      .then((res) => { setResults(res.items); setTotal(res.total) })
      .catch(() => { setResults([]); setTotal(0) })
      .finally(() => setResultsLoading(false))
  }, [selected, page])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      {/* 策略卡片 */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">选择策略</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {strategies.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              selected={selected?.id === s.id}
              onClick={() => { setSelected(s); setPage(1) }}
            />
          ))}
        </div>
        {strategies.length === 0 && (
          <div className="card text-center py-8 text-gray-400">暂无策略数据</div>
        )}
      </div>

      {/* 选股结果 */}
      {selected && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{selected.name} - 选股结果</h3>
            <span className="text-sm text-gray-500">共 {total} 条</span>
          </div>

          {resultsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无选股结果</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-3">代码</th>
                    <th className="px-3 py-3">名称</th>
                    <th className="px-3 py-3">选股日期</th>
                    <th className="px-3 py-3 text-right">评分</th>
                    <th className="px-3 py-3 text-right">入选价格</th>
                    <th className="px-3 py-3 text-right">涨跌幅</th>
                    <th className="px-3 py-3 hidden md:table-cell">入选原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/stocks/${r.code}`)}
                    >
                      <td className="px-3 py-2.5 font-mono text-blue-600">{r.code}</td>
                      <td className="px-3 py-2.5">{r.name || '-'}</td>
                      <td className="px-3 py-2.5 font-mono">{r.trade_date}</td>
                      <td className="px-3 py-2.5 text-right">{r.score?.toFixed(1) ?? '-'}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{r.price?.toFixed(2) ?? '-'}</td>
                      <td className={`px-3 py-2.5 text-right font-mono ${
                        (r.pct_change ?? 0) > 0 ? 'text-rise' : (r.pct_change ?? 0) < 0 ? 'text-fall' : ''
                      }`}>
                        {r.pct_change != null ? `${r.pct_change > 0 ? '+' : ''}${r.pct_change.toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell max-w-xs truncate">{r.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <button className="btn-secondary text-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button className="btn-secondary text-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </div>
      )}

      <Disclaimer />
    </div>
  )
}
