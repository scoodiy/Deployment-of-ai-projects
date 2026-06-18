import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { runSelection } from '../api/stocks'
import type { StockListItem, SelectionParams } from '../types'

export default function Screening() {
  const navigate = useNavigate()
  const [results, setResults] = useState<StockListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [params, setParams] = useState<SelectionParams>({
    macd_golden_cross: false,
    kdj_golden_cross: false,
    rsi_oversold: false,
    above_ma5: false,
    above_ma20: false,
  })

  const toggle = (key: keyof SelectionParams) => {
    setParams((p) => ({ ...p, [key]: !p[key] }))
  }

  const handleRun = async () => {
    setLoading(true); setError('')
    try {
      const d = await runSelection(params)
      setResults(d.items)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">选股条件</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">最低价格</label>
            <input type="number" className="input-field" placeholder="0" onChange={(e) => setParams((p) => ({ ...p, min_price: Number(e.target.value) || undefined }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">最高价格</label>
            <input type="number" className="input-field" placeholder="9999" onChange={(e) => setParams((p) => ({ ...p, max_price: Number(e.target.value) || undefined }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">最大PE</label>
            <input type="number" className="input-field" placeholder="100" onChange={(e) => setParams((p) => ({ ...p, max_pe_ratio: Number(e.target.value) || undefined }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">最小市值(亿)</label>
            <input type="number" className="input-field" placeholder="0" onChange={(e) => setParams((p) => ({ ...p, min_market_cap: Number(e.target.value) * 1e8 || undefined }))} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          {([
            ['macd_golden_cross', 'MACD金叉'],
            ['kdj_golden_cross', 'KDJ金叉'],
            ['rsi_oversold', 'RSI超卖'],
            ['above_ma5', '站上MA5'],
            ['above_ma20', '站上MA20'],
          ] as [keyof SelectionParams, string][]).map(([k, label]) => (
            <button
              key={k}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${params[k] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              onClick={() => toggle(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={handleRun} disabled={loading}>
          {loading ? '筛选中...' : '开始选股'}
        </button>
      </div>

      {error && <div className="card text-center py-8 text-red-500">{error}</div>}

      {results.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="font-semibold mb-3">选股结果 ({results.length}只)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">代码</th>
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">行业</th>
                <th className="px-4 py-3 text-right">最新价</th>
                <th className="px-4 py-3 text-right">涨跌幅</th>
                <th className="px-4 py-3 text-right">PE</th>
                <th className="px-4 py-3 text-right">市值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((s) => (
                <tr key={s.code} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/stocks/${s.code}`)}>
                  <td className="px-4 py-3 font-mono text-blue-600">{s.code}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.industry || '-'}</td>
                  <td className="px-4 py-3 text-right font-mono">{s.price?.toFixed(2) ?? '-'}</td>
                  <td className={`px-4 py-3 text-right font-mono ${(s.pct_change ?? 0) > 0 ? 'text-rise' : (s.pct_change ?? 0) < 0 ? 'text-fall' : ''}`}>
                    {s.pct_change != null ? `${s.pct_change > 0 ? '+' : ''}${s.pct_change.toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{s.pe_ratio?.toFixed(1) ?? '-'}</td>
                  <td className="px-4 py-3 text-right">{s.market_cap != null ? (s.market_cap / 1e8).toFixed(0) + '亿' : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
