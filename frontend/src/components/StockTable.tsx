import { useNavigate } from 'react-router-dom'
import type { StockListItem } from '../types'

interface Props {
  stocks: StockListItem[]
  loading?: boolean
  showRank?: boolean
}

function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v == null) return '-'
  return v.toFixed(digits)
}

function fmtAmount(v: number | null | undefined): string {
  if (v == null) return '-'
  if (v >= 1e12) return (v / 1e12).toFixed(2) + '万亿'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万'
  return v.toFixed(0)
}

function fmtMarketCap(v: number | null | undefined): string {
  if (v == null) return '-'
  if (v >= 1e12) return (v / 1e12).toFixed(2) + '万亿'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  return v.toFixed(0)
}

export default function StockTable({ stocks, loading, showRank }: Props) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-2 text-gray-500">加载中...</span>
      </div>
    )
  }

  if (!stocks.length) {
    return (
      <div className="card text-center py-12 text-gray-400">暂无数据</div>
    )
  }

  return (
    <div className="overflow-x-auto card p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="table-header">
            {showRank && <th className="px-3 py-3 text-center w-10">#</th>}
            <th className="px-3 py-3">代码</th>
            <th className="px-3 py-3">名称</th>
            <th className="px-3 py-3 text-right">最新价</th>
            <th className="px-3 py-3 text-right">涨跌幅</th>
            <th className="px-3 py-3 text-right">成交量</th>
            <th className="px-3 py-3 text-right">成交额</th>
            <th className="px-3 py-3 text-right hidden md:table-cell">换手率</th>
            <th className="px-3 py-3 text-right hidden lg:table-cell">市盈率</th>
            <th className="px-3 py-3 text-right hidden xl:table-cell">总市值</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {stocks.map((s, i) => (
            <tr
              key={s.code}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/stocks/${s.code}`)}
            >
              {showRank && <td className="px-3 py-3 text-center text-gray-400">{i + 1}</td>}
              <td className="px-3 py-3 font-mono text-blue-600">{s.code}</td>
              <td className="px-3 py-3 font-medium">{s.name}</td>
              <td className="px-3 py-3 text-right font-mono">{fmtNum(s.price)}</td>
              <td className={`px-3 py-3 text-right font-mono font-medium ${
                (s.pct_change ?? 0) > 0 ? 'text-rise' : (s.pct_change ?? 0) < 0 ? 'text-fall' : ''
              }`}>
                {s.pct_change != null ? `${s.pct_change > 0 ? '+' : ''}${fmtNum(s.pct_change)}%` : '-'}
              </td>
              <td className="px-3 py-3 text-right font-mono">{fmtAmount(s.volume)}</td>
              <td className="px-3 py-3 text-right font-mono">{fmtAmount(s.amount)}</td>
              <td className="px-3 py-3 text-right font-mono hidden md:table-cell">
                {s.turnover != null ? `${fmtNum(s.turnover)}%` : '-'}
              </td>
              <td className="px-3 py-3 text-right font-mono hidden lg:table-cell">{fmtNum(s.pe_ratio)}</td>
              <td className="px-3 py-3 text-right font-mono hidden xl:table-cell">{fmtMarketCap(s.market_cap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
