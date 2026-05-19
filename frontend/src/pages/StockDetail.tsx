import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchStockDetail, fetchKline, fetchIndicators } from '../api/stocks'
import type { StockDetail as StockDetailType, KlineData, IndicatorData } from '../types'

function OfflineNotice({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="text-4xl">📈</div>
      <p className="text-gray-500">{name} — 后端服务未连接，请稍后再试</p>
      <Link to="/stocks" className="btn-primary">返回列表</Link>
    </div>
  )
}

export default function StockDetail() {
  const { code } = useParams<{ code: string }>()
  const [stock, setStock] = useState<StockDetailType | null>(null)
  const [kline, setKline] = useState<KlineData[]>([])
  const [indicators, setIndicators] = useState<IndicatorData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) return
    setLoading(true)
    Promise.all([
      fetchStockDetail(code),
      fetchKline(code, { period: 120 }),
      fetchIndicators(code, { period: 120 }),
    ])
      .then(([d, k, i]) => { setStock(d); setKline(k); setIndicators(i) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  if (error || !stock) {
    return <OfflineNotice name={code || ''} />
  }

  const isUp = (stock.pct_change ?? 0) >= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/stocks" className="text-blue-600 hover:underline text-sm">← 返回列表</Link>
        <h2 className="text-xl font-bold">{stock.name} <span className="text-gray-400 font-mono">{stock.code}</span></h2>
      </div>

      {/* 行情概要 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card">
          <div className="text-xs text-gray-500">最新价</div>
          <div className={`text-xl font-bold ${isUp ? 'text-rise' : 'text-fall'}`}>{stock.price?.toFixed(2) ?? '-'}</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500">涨跌幅</div>
          <div className={`text-xl font-bold ${isUp ? 'text-rise' : 'text-fall'}`}>
            {stock.pct_change != null ? `${stock.pct_change > 0 ? '+' : ''}${stock.pct_change.toFixed(2)}%` : '-'}
          </div>
        </div>
        <div className="card"><div className="text-xs text-gray-500">开盘</div><div className="font-mono">{stock.open?.toFixed(2) ?? '-'}</div></div>
        <div className="card"><div className="text-xs text-gray-500">最高</div><div className="font-mono text-rise">{stock.high?.toFixed(2) ?? '-'}</div></div>
        <div className="card"><div className="text-xs text-gray-500">最低</div><div className="font-mono text-fall">{stock.low?.toFixed(2) ?? '-'}</div></div>
        <div className="card"><div className="text-xs text-gray-500">昨收</div><div className="font-mono">{stock.pre_close?.toFixed(2) ?? '-'}</div></div>
      </div>

      {/* 基本面 */}
      <div className="card">
        <h3 className="font-semibold mb-3">基本信息</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-gray-500">行业：</span>{stock.industry || '-'}</div>
          <div><span className="text-gray-500">PE：</span>{stock.pe_ratio?.toFixed(1) ?? '-'}</div>
          <div><span className="text-gray-500">PB：</span>{stock.pb_ratio?.toFixed(2) ?? '-'}</div>
          <div><span className="text-gray-500">市值：</span>{stock.market_cap != null ? (stock.market_cap / 1e8).toFixed(0) + '亿' : '-'}</div>
          <div><span className="text-gray-500">成交额：</span>{stock.amount != null ? (stock.amount / 1e8).toFixed(2) + '亿' : '-'}</div>
          <div><span className="text-gray-500">换手率：</span>{stock.turnover != null ? stock.turnover.toFixed(2) + '%' : '-'}</div>
          <div><span className="text-gray-500">总股本：</span>{stock.total_share != null ? (stock.total_share / 1e4).toFixed(0) + '万' : '-'}</div>
          <div><span className="text-gray-500">流通股：</span>{stock.float_share != null ? (stock.float_share / 1e4).toFixed(0) + '万' : '-'}</div>
        </div>
      </div>

      {/* K线数据表 */}
      {kline.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="font-semibold mb-3">K线数据（近{kline.length}日）</h3>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="table-header">
                <th className="px-3 py-2">日期</th>
                <th className="px-3 py-2 text-right">开盘</th>
                <th className="px-3 py-2 text-right">最高</th>
                <th className="px-3 py-2 text-right">最低</th>
                <th className="px-3 py-2 text-right">收盘</th>
                <th className="px-3 py-2 text-right">涨跌</th>
                <th className="px-3 py-2 text-right">成交量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kline.slice(-20).reverse().map((k) => (
                <tr key={k.trade_date}>
                  <td className="px-3 py-1.5">{k.trade_date}</td>
                  <td className="px-3 py-1.5 text-right">{k.open.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right text-rise">{k.high.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right text-fall">{k.low.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-right">{k.close.toFixed(2)}</td>
                  <td className={`px-3 py-1.5 text-right ${(k.pct_change ?? 0) > 0 ? 'text-rise' : (k.pct_change ?? 0) < 0 ? 'text-fall' : ''}`}>
                    {k.pct_change != null ? `${k.pct_change > 0 ? '+' : ''}${k.pct_change.toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-3 py-1.5 text-right">{k.volume.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 技术指标 */}
      {indicators.length > 0 && (
        <div className="card overflow-x-auto">
          <h3 className="font-semibold mb-3">技术指标（近{indicators.length}日）</h3>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="table-header">
                <th className="px-3 py-2">日期</th>
                <th className="px-3 py-2 text-right">MA5</th>
                <th className="px-3 py-2 text-right">MA20</th>
                <th className="px-3 py-2 text-right">MACD</th>
                <th className="px-3 py-2 text-right">KDJ-K</th>
                <th className="px-3 py-2 text-right">RSI6</th>
                <th className="px-3 py-2 text-right">BOLL上</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {indicators.slice(-20).reverse().map((i) => (
                <tr key={i.trade_date}>
                  <td className="px-3 py-1.5">{i.trade_date}</td>
                  <td className="px-3 py-1.5 text-right">{i.ma5?.toFixed(2) ?? '-'}</td>
                  <td className="px-3 py-1.5 text-right">{i.ma20?.toFixed(2) ?? '-'}</td>
                  <td className={`px-3 py-1.5 text-right ${(i.macd_hist ?? 0) > 0 ? 'text-rise' : 'text-fall'}`}>{i.macd_hist?.toFixed(3) ?? '-'}</td>
                  <td className="px-3 py-1.5 text-right">{i.kdj_k?.toFixed(1) ?? '-'}</td>
                  <td className="px-3 py-1.5 text-right">{i.rsi6?.toFixed(1) ?? '-'}</td>
                  <td className="px-3 py-1.5 text-right">{i.boll_upper?.toFixed(2) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
