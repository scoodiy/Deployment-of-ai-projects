import { useEffect, useState } from 'react'
import { fetchIndustries, runSelection } from '../api/stocks'
import Disclaimer from '../components/Disclaimer'
import StockTable from '../components/StockTable'
import type { SelectionParams, StockListItem } from '../types'

export default function Screening() {
  const [industries, setIndustries] = useState<string[]>([])
  const [stocks, setStocks] = useState<StockListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [searched, setSearched] = useState(false)

  // 筛选条件
  const [market, setMarket] = useState('')
  const [industry, setIndustry] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minPct, setMinPct] = useState('')
  const [maxPct, setMaxPct] = useState('')
  const [minTurnover, setMinTurnover] = useState('')
  const [maxPe, setMaxPe] = useState('')
  const [maxPb, setMaxPb] = useState('')
  const [macdCross, setMacdCross] = useState(false)
  const [kdjCross, setKdjCross] = useState(false)
  const [rsiOversold, setRsiOversold] = useState(false)
  const [aboveMa5, setAboveMa5] = useState(false)
  const [aboveMa20, setAboveMa20] = useState(false)

  useEffect(() => { fetchIndustries().then(setIndustries).catch(() => {}) }, [])

  function doSearch(p = 1) {
    const params: SelectionParams = { page, page_size: 20 }
    if (market) params.market = market
    if (industry) params.industry = industry
    if (minPrice) params.min_price = Number(minPrice)
    if (maxPrice) params.max_price = Number(maxPrice)
    if (minPct) params.min_pct_change = Number(minPct)
    if (maxPct) params.max_pct_change = Number(maxPct)
    if (minTurnover) params.min_turnover = Number(minTurnover)
    if (maxPe) params.max_pe_ratio = Number(maxPe)
    if (maxPb) params.max_pb_ratio = Number(maxPb)
    if (macdCross) params.macd_golden_cross = true
    if (kdjCross) params.kdj_golden_cross = true
    if (rsiOversold) params.rsi_oversold = true
    if (aboveMa5) params.above_ma5 = true
    if (aboveMa20) params.above_ma20 = true
    params.page = p

    setLoading(true)
    setSearched(true)
    runSelection(params)
      .then((res) => { setStocks(res.items); setTotal(res.total); setPage(p) })
      .catch(() => { setStocks([]); setTotal(0) })
      .finally(() => setLoading(false))
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-4">筛选条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 基本面 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">市场</label>
            <select className="select-field w-full" value={market} onChange={(e) => setMarket(e.target.value)}>
              <option value="">全部</option>
              <option value="SH">上交所</option>
              <option value="SZ">深交所</option>
              <option value="BJ">北交所</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">行业</label>
            <select className="select-field w-full" value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">全部</option>
              {industries.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最低价</label>
              <input type="number" className="input-field" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最高价</label>
              <input type="number" className="input-field" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="∞" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最小涨跌幅(%)</label>
              <input type="number" className="input-field" value={minPct} onChange={(e) => setMinPct(e.target.value)} placeholder="-10" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最大涨跌幅(%)</label>
              <input type="number" className="input-field" value={maxPct} onChange={(e) => setMaxPct(e.target.value)} placeholder="10" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">最小换手率(%)</label>
            <input type="number" className="input-field" value={minTurnover} onChange={(e) => setMinTurnover(e.target.value)} placeholder="0" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最大市盈率</label>
              <input type="number" className="input-field" value={maxPe} onChange={(e) => setMaxPe(e.target.value)} placeholder="不限" />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">最大市净率</label>
              <input type="number" className="input-field" value={maxPb} onChange={(e) => setMaxPb(e.target.value)} placeholder="不限" />
            </div>
          </div>
        </div>

        {/* 技术指标条件 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">技术指标条件</div>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'MACD 金叉', checked: macdCross, onChange: setMacdCross },
              { label: 'KDJ 金叉', checked: kdjCross, onChange: setKdjCross },
              { label: 'RSI 超卖(<30)', checked: rsiOversold, onChange: setRsiOversold },
              { label: '站上5日线', checked: aboveMa5, onChange: setAboveMa5 },
              { label: '站上20日线', checked: aboveMa20, onChange: setAboveMa20 },
            ].map((cb) => (
              <label key={cb.label} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={cb.checked} onChange={(e) => cb.onChange(e.target.checked)} className="rounded border-gray-300" />
                {cb.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <button className="btn-primary" onClick={() => doSearch(1)}>开始选股</button>
        </div>
      </div>

      {searched && (
        <>
          <div className="text-sm text-gray-500">共筛选出 {total} 只股票</div>
          <StockTable stocks={stocks} loading={loading} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button className="btn-secondary text-sm" disabled={page <= 1} onClick={() => doSearch(page - 1)}>上一页</button>
              <span className="text-sm text-gray-600">{page} / {totalPages}</span>
              <button className="btn-secondary text-sm" disabled={page >= totalPages} onClick={() => doSearch(page + 1)}>下一页</button>
            </div>
          )}
        </>
      )}

      <Disclaimer />
    </div>
  )
}
