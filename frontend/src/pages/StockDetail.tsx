import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchStockDetail, fetchKline, fetchIndicators, fetchPatterns, fetchCyq } from '../api/stocks'
import Disclaimer from '../components/Disclaimer'
import KlineChart from '../components/KlineChart'
import IndicatorChart from '../components/IndicatorChart'
import type { StockDetail as StockDetailType, KlineData, IndicatorData, PatternData, CyqData } from '../types'

type Tab = 'kline' | 'indicators' | 'patterns' | 'cyq'

function fmtNum(v: number | null | undefined, d = 2) { return v != null ? v.toFixed(d) : '-' }
function fmtAmt(v: number | null | undefined) {
  if (v == null) return '-'
  if (v >= 1e12) return (v / 1e12).toFixed(2) + '万亿'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万'
  return v.toFixed(0)
}

export default function StockDetail() {
  const { code } = useParams<{ code: string }>()
  const [stock, setStock] = useState<StockDetailType | null>(null)
  const [kline, setKline] = useState<KlineData[]>([])
  const [indicators, setIndicators] = useState<IndicatorData[]>([])
  const [patterns, setPatterns] = useState<PatternData[]>([])
  const [cyq, setCyq] = useState<CyqData[]>([])
  const [tab, setTab] = useState<Tab>('kline')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) return
    setLoading(true)
    Promise.all([
      fetchStockDetail(code),
      fetchKline(code),
      fetchIndicators(code),
      fetchPatterns(code),
      fetchCyq(code),
    ])
      .then(([s, k, ind, p, c]) => {
        setStock(s)
        setKline(k)
        setIndicators(ind)
        setPatterns(p)
        setCyq(c)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  if (error) return <div className="card text-center py-12 text-red-500">{error}</div>
  if (!stock) return <div className="card text-center py-12 text-gray-400">股票不存在</div>

  const pct = stock.pct_change ?? 0
  const pctColor = pct > 0 ? 'text-rise' : pct < 0 ? 'text-fall' : ''

  return (
    <div className="space-y-4">
      {/* 股票头部信息 */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold">{stock.name}</h2>
              <span className="text-sm text-gray-500 font-mono">{stock.code}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{stock.market}</span>
              {stock.industry && <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">{stock.industry}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${pctColor}`}>{fmtNum(stock.price)}</div>
            <div className={`text-sm ${pctColor}`}>
              {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 行情数据网格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-100">
          {[
            { label: '开盘', value: fmtNum(stock.open) },
            { label: '最高', value: fmtNum(stock.high) },
            { label: '最低', value: fmtNum(stock.low) },
            { label: '昨收', value: fmtNum(stock.pre_close) },
            { label: '成交量', value: fmtAmt(stock.volume) },
            { label: '成交额', value: fmtAmt(stock.amount) },
            { label: '换手率', value: stock.turnover != null ? `${fmtNum(stock.turnover)}%` : '-' },
            { label: '市盈率', value: fmtNum(stock.pe_ratio) },
            { label: '市净率', value: fmtNum(stock.pb_ratio) },
            { label: '总市值', value: fmtAmt(stock.market_cap) },
            { label: '流通市值', value: fmtAmt(stock.float_market_cap) },
            { label: '上市日期', value: stock.list_date || '-' },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-xs text-gray-400">{item.label}</div>
              <div className="text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1">
        {([['kline', 'K线图'], ['indicators', '技术指标'], ['patterns', 'K线形态'], ['cyq', '筹码分布']] as [Tab, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              tab === k ? 'bg-white text-blue-600 font-medium shadow-sm border border-b-0 border-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div>
        {tab === 'kline' && <KlineChart data={kline} />}
        {tab === 'indicators' && <IndicatorChart kline={kline} indicators={indicators} />}
        {tab === 'patterns' && (
          <div className="card p-0">
            {patterns.length === 0 ? (
              <div className="py-12 text-center text-gray-400">暂无形态数据</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-3 py-3">日期</th>
                    <th className="px-3 py-3">形态名称</th>
                    <th className="px-3 py-3">类型</th>
                    <th className="px-3 py-3">信号</th>
                    <th className="px-3 py-3">置信度</th>
                    <th className="px-3 py-3 hidden md:table-cell">描述</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patterns.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono">{p.trade_date}</td>
                      <td className="px-3 py-2.5 font-medium">{p.pattern_name}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.pattern_type === 'bullish' ? 'bg-red-100 text-red-700' :
                          p.pattern_type === 'bearish' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {p.pattern_type === 'bullish' ? '看涨' : p.pattern_type === 'bearish' ? '看跌' : '中性'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.signal === 'buy' ? 'bg-red-100 text-red-700' :
                          p.signal === 'sell' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {p.signal === 'buy' ? '买入' : p.signal === 'sell' ? '卖出' : '持有'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{p.confidence != null ? `${(p.confidence * 100).toFixed(0)}%` : '-'}</td>
                      <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell max-w-xs truncate">{p.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {tab === 'cyq' && (
          <div className="card">
            {cyq.length === 0 ? (
              <div className="py-12 text-center text-gray-400">暂无筹码数据</div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-500">日期: {cyq[0]?.trade_date}</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-400">平均成本</div>
                    <div className="text-lg font-bold">{cyq[0]?.avg_cost?.toFixed(2) ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">90%集中度</div>
                    <div className="text-lg font-bold">{cyq[0]?.concentration_90?.toFixed(2) ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">70%集中度</div>
                    <div className="text-lg font-bold">{cyq[0]?.concentration_70?.toFixed(2) ?? '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">获利比例</div>
                    <div className="text-lg font-bold">{cyq[0]?.winner_rate?.toFixed(2) ?? '-'}%</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header">
                        <th className="px-3 py-2">价格</th>
                        <th className="px-3 py-2">筹码占比</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {cyq.slice(0, 50).map((c, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 font-mono">{c.price.toFixed(2)}</td>
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-3 max-w-xs">
                                <div
                                  className="bg-blue-500 rounded-full h-3"
                                  style={{ width: `${Math.min(c.percent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-12 text-right">{c.percent.toFixed(2)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Disclaimer />
    </div>
  )
}
