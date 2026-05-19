import { useEffect, useState } from 'react'
import { fetchBacktests, fetchBacktestDetail } from '../api/backtests'
import Disclaimer from '../components/Disclaimer'
import type { BacktestInfo, BacktestDetail as BtDetail, BacktestTradeItem } from '../types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '等待中', color: 'bg-yellow-100 text-yellow-700' },
  running: { label: '运行中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  failed: { label: '失败', color: 'bg-red-100 text-red-700' },
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-lg font-bold ${color || ''}`}>{value}</div>
    </div>
  )
}

export default function Backtest() {
  const [backtests, setBacktests] = useState<BacktestInfo[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<BtDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchBacktests({ page, page_size: 10 })
      .then((res) => { setBacktests(res.items); setTotal(res.total) })
      .catch(() => { setBacktests([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [page])

  function viewDetail(id: number) {
    setDetailLoading(true)
    fetchBacktestDetail(id)
      .then(setSelected)
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-4">
      {/* 回测列表 */}
      <div className="card">
        <h3 className="font-semibold mb-4">回测记录</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : backtests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无回测记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-3">名称</th>
                  <th className="px-3 py-3">策略</th>
                  <th className="px-3 py-3">时间区间</th>
                  <th className="px-3 py-3 text-right">初始资金</th>
                  <th className="px-3 py-3 text-right">总收益率</th>
                  <th className="px-3 py-3 text-right">年化收益</th>
                  <th className="px-3 py-3 text-right">最大回撤</th>
                  <th className="px-3 py-3 text-right">夏普比率</th>
                  <th className="px-3 py-3">状态</th>
                  <th className="px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backtests.map((bt) => {
                  const st = STATUS_LABELS[bt.status] || STATUS_LABELS.pending
                  return (
                    <tr key={bt.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium">{bt.name}</td>
                      <td className="px-3 py-2.5 text-gray-500">{bt.strategy_name || '-'}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{bt.start_date} ~ {bt.end_date}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{bt.initial_capital.toLocaleString()}</td>
                      <td className={`px-3 py-2.5 text-right font-mono ${(bt.total_return ?? 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
                        {bt.total_return != null ? `${bt.total_return > 0 ? '+' : ''}${bt.total_return.toFixed(2)}%` : '-'}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono ${(bt.annual_return ?? 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
                        {bt.annual_return != null ? `${bt.annual_return > 0 ? '+' : ''}${bt.annual_return.toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-fall">
                        {bt.max_drawdown != null ? `${bt.max_drawdown.toFixed(2)}%` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {bt.sharpe_ratio?.toFixed(2) ?? '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          className="text-blue-600 hover:underline text-sm"
                          onClick={() => viewDetail(bt.id)}
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
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

      {/* 回测详情 */}
      {selected && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{selected.name} - 详细结果</h3>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => setSelected(null)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 核心指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6 pb-4 border-b border-gray-100">
            <MetricCard label="初始资金" value={selected.initial_capital.toLocaleString()} />
            <MetricCard label="最终资金" value={selected.final_capital?.toLocaleString() ?? '-'} />
            <MetricCard label="总收益率" value={selected.total_return != null ? `${selected.total_return.toFixed(2)}%` : '-'} color={(selected.total_return ?? 0) >= 0 ? 'text-rise' : 'text-fall'} />
            <MetricCard label="年化收益" value={selected.annual_return != null ? `${selected.annual_return.toFixed(2)}%` : '-'} color={(selected.annual_return ?? 0) >= 0 ? 'text-rise' : 'text-fall'} />
            <MetricCard label="最大回撤" value={selected.max_drawdown != null ? `${selected.max_drawdown.toFixed(2)}%` : '-'} color="text-fall" />
            <MetricCard label="夏普比率" value={selected.sharpe_ratio?.toFixed(2) ?? '-'} />
            <MetricCard label="胜率" value={selected.win_rate != null ? `${selected.win_rate.toFixed(1)}%` : '-'} />
          </div>

          {/* 交易记录 */}
          <h4 className="text-sm font-medium text-gray-500 mb-3">交易记录 ({selected.trades.length} 笔)</h4>
          {selected.trades.length === 0 ? (
            <div className="text-center py-8 text-gray-400">无交易记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-2">日期</th>
                    <th className="px-3 py-2">代码</th>
                    <th className="px-3 py-2">方向</th>
                    <th className="px-3 py-2 text-right">价格</th>
                    <th className="px-3 py-2 text-right">数量</th>
                    <th className="px-3 py-2 text-right">金额</th>
                    <th className="px-3 py-2 text-right">盈亏</th>
                    <th className="px-3 py-2 hidden md:table-cell">原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selected.trades.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{t.trade_date}</td>
                      <td className="px-3 py-2 font-mono text-blue-600">{t.code}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          t.direction.includes('long') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {t.direction === 'open_long' ? '开多' : t.direction === 'close_long' ? '平多' : t.direction === 'open_short' ? '开空' : '平空'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{t.price.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono">{t.volume.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono">{t.amount.toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right font-mono ${(t.profit ?? 0) >= 0 ? 'text-rise' : 'text-fall'}`}>
                        {t.profit != null ? t.profit.toFixed(2) : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 hidden md:table-cell max-w-xs truncate">{t.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {detailLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      <Disclaimer />
    </div>
  )
}
