import { useEffect, useState } from 'react'
import { fetchBacktests, fetchBacktestDetail } from '../api/backtests'
import type { BacktestInfo, BacktestTradeItem } from '../types'

export default function Backtest() {
  const [backtests, setBacktests] = useState<BacktestInfo[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [trades, setTrades] = useState<BacktestTradeItem[]>([])
  const [detail, setDetail] = useState<BacktestInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBacktests()
      .then((d) => { setBacktests(d.items); if (d.items.length > 0) setSelected(d.items[0].id) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    fetchBacktestDetail(selected)
      .then((d) => { setDetail(d); setTrades(d.trades || []) })
      .catch(() => { setDetail(null); setTrades([]) })
  }, [selected])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  if (error || backtests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="text-4xl">⏱️</div>
        <p className="text-gray-500">后端服务未连接或暂无回测数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 回测列表 */}
      <div className="flex flex-wrap gap-2">
        {backtests.map((b) => (
          <button
            key={b.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selected === b.id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setSelected(b.id)}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* 回测详情 */}
      {detail && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center">
            <div className="text-xs text-gray-500">总收益</div>
            <div className={`text-base md:text-lg font-bold ${(detail.total_return ?? 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
              {detail.total_return != null ? `${detail.total_return > 0 ? '+' : ''}${detail.total_return.toFixed(2)}%` : '-'}
            </div>
          </div>
          <div className="card text-center">
            <div className="text-xs text-gray-500">年化收益</div>
            <div className={`text-base md:text-lg font-bold ${(detail.annual_return ?? 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
              {detail.annual_return != null ? `${detail.annual_return > 0 ? '+' : ''}${detail.annual_return.toFixed(2)}%` : '-'}
            </div>
          </div>
          <div className="card text-center">
            <div className="text-xs text-gray-500">最大回撤</div>
            <div className="text-base md:text-lg font-bold text-fall">{detail.max_drawdown != null ? `-${detail.max_drawdown.toFixed(2)}%` : '-'}</div>
          </div>
          <div className="card text-center">
            <div className="text-xs text-gray-500">夏普比率</div>
            <div className="text-base md:text-lg font-bold">{detail.sharpe_ratio?.toFixed(2) ?? '-'}</div>
          </div>
          <div className="card text-center">
            <div className="text-xs text-gray-500">胜率</div>
            <div className="text-base md:text-lg font-bold">{detail.win_rate != null ? `${detail.win_rate.toFixed(1)}%` : '-'}</div>
          </div>
        </div>
      )}

      {/* 交易明细 */}
      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-3">交易明细</h3>
        {trades.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无交易记录</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-2 md:px-3 py-2">日期</th>
                <th className="px-2 md:px-3 py-2">代码</th>
                <th className="px-2 md:px-3 py-2">方向</th>
                <th className="px-2 md:px-3 py-2 text-right hidden sm:table-cell">价格</th>
                <th className="px-2 md:px-3 py-2 text-right hidden sm:table-cell">数量</th>
                <th className="px-2 md:px-3 py-2 text-right hidden md:table-cell">金额</th>
                <th className="px-2 md:px-3 py-2 text-right">盈亏</th>
                <th className="px-2 md:px-3 py-2 hidden md:table-cell">原因</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trades.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-2 md:px-3 py-2 text-gray-500">{t.trade_date}</td>
                  <td className="px-2 md:px-3 py-2 font-mono text-blue-600">{t.code}</td>
                  <td className={`px-2 md:px-3 py-2 font-medium ${t.direction === 'buy' ? 'text-rise' : 'text-fall'}`}>
                    {t.direction === 'buy' ? '买入' : '卖出'}
                  </td>
                  <td className="px-2 md:px-3 py-2 text-right font-mono hidden sm:table-cell">{t.price.toFixed(2)}</td>
                  <td className="px-2 md:px-3 py-2 text-right hidden sm:table-cell">{t.volume.toLocaleString()}</td>
                  <td className="px-2 md:px-3 py-2 text-right hidden md:table-cell">{t.amount.toLocaleString()}</td>
                  <td className={`px-2 md:px-3 py-2 text-right font-mono ${(t.profit ?? 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
                    {t.profit != null ? `${t.profit > 0 ? '+' : ''}${t.profit.toFixed(0)}` : '-'}
                  </td>
                  <td className="px-2 md:px-3 py-2 text-gray-500 max-w-[150px] truncate hidden md:table-cell">{t.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
