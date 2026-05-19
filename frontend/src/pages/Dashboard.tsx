import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMarketOverview } from '../api/stocks'
import Disclaimer from '../components/Disclaimer'
import type { MarketOverview, StockListItem } from '../types'

function fmtAmount(v: number): string {
  if (v >= 1e12) return (v / 1e12).toFixed(2) + '万亿'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  return v.toFixed(0)
}

function IndexCard({ name, price, pct_change, change_amount }: { name: string; price: number; pct_change: number; change_amount: number }) {
  const isUp = pct_change >= 0
  return (
    <div className="card">
      <div className="text-sm text-gray-500 mb-1">{name}</div>
      <div className={`text-2xl font-bold ${isUp ? 'text-rise' : 'text-fall'}`}>{price.toFixed(2)}</div>
      <div className={`text-sm ${isUp ? 'text-rise' : 'text-fall'}`}>
        {isUp ? '+' : ''}{change_amount.toFixed(2)} ({isUp ? '+' : ''}{pct_change.toFixed(2)}%)
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="card text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color || ''}`}>{value}</div>
    </div>
  )
}

function TopTable({ title, stocks, field, fieldLabel }: { title: string; stocks: StockListItem[]; field: keyof StockListItem; fieldLabel: string }) {
  const navigate = useNavigate()
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b">
            <th className="pb-2 text-left">#</th>
            <th className="pb-2 text-left">代码</th>
            <th className="pb-2 text-left">名称</th>
            <th className="pb-2 text-right">{fieldLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {stocks.slice(0, 5).map((s, i) => (
            <tr
              key={s.code}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/stocks/${s.code}`)}
            >
              <td className="py-2 text-gray-400">{i + 1}</td>
              <td className="py-2 font-mono text-blue-600">{s.code}</td>
              <td className="py-2">{s.name}</td>
              <td className={`py-2 text-right font-mono ${
                (s[field] as number ?? 0) > 0 ? 'text-rise' : (s[field] as number ?? 0) < 0 ? 'text-fall' : ''
              }`}>
                {field === 'pct_change'
                  ? `${(s.pct_change ?? 0) > 0 ? '+' : ''}${(s.pct_change ?? 0).toFixed(2)}%`
                  : field === 'amount'
                  ? fmtAmount(s.amount ?? 0)
                  : s[field]?.toString() ?? '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<MarketOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMarketOverview()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  if (error) {
    return <div className="card text-center py-12 text-red-500">{error}</div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* 大盘指数 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.market_indices.map((idx) => (
          <IndexCard key={idx.code} {...idx} />
        ))}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="总股票数" value={data.total_stocks} />
        <StatCard label="总成交额" value={fmtAmount(data.total_amount)} />
        <StatCard label="上涨家数" value={data.up_count} color="text-rise" />
        <StatCard label="下跌家数" value={data.down_count} color="text-fall" />
      </div>

      {/* 涨跌 Top */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopTable title="涨幅榜" stocks={data.top_gainers} field="pct_change" fieldLabel="涨跌幅" />
        <TopTable title="跌幅榜" stocks={data.top_losers} field="pct_change" fieldLabel="涨跌幅" />
        <TopTable title="成交额榜" stocks={data.top_volume} field="amount" fieldLabel="成交额" />
      </div>

      <Disclaimer />
    </div>
  )
}
