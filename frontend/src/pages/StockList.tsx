import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchIndustries, fetchStockList } from '../api/stocks'
import Disclaimer from '../components/Disclaimer'
import StockTable from '../components/StockTable'
import type { StockListItem } from '../types'

const MARKETS = ['', 'SH', 'SZ', 'BJ']
const MARKET_LABELS: Record<string, string> = { '': '全部市场', SH: '上交所', SZ: '深交所', BJ: '北交所' }
const SORT_OPTIONS = [
  { value: 'code', label: '代码' },
  { value: 'pct_change', label: '涨跌幅' },
  { value: 'amount', label: '成交额' },
  { value: 'volume', label: '成交量' },
  { value: 'turnover', label: '换手率' },
  { value: 'market_cap', label: '总市值' },
]

export default function StockList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [stocks, setStocks] = useState<StockListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [industries, setIndustries] = useState<string[]>([])

  const keyword = searchParams.get('keyword') || ''
  const market = searchParams.get('market') || ''
  const industry = searchParams.get('industry') || ''
  const sortBy = searchParams.get('sort_by') || 'code'
  const sortOrder = searchParams.get('sort_order') || 'asc'
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('page_size')) || 20

  const load = useCallback(() => {
    setLoading(true)
    fetchStockList({ keyword: keyword || undefined, market: market || undefined, industry: industry || undefined, sort_by: sortBy, sort_order: sortOrder, page, page_size: pageSize })
      .then((res) => { setStocks(res.items); setTotal(res.total) })
      .catch(() => { setStocks([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [keyword, market, industry, sortBy, sortOrder, page, pageSize])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetchIndustries().then(setIndustries).catch(() => {}) }, [])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.set('page', '1')
    setSearchParams(next)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">搜索</label>
            <input
              type="text"
              className="input-field"
              placeholder="输入股票代码或名称..."
              defaultValue={keyword}
              onKeyDown={(e) => { if (e.key === 'Enter') updateParam('keyword', (e.target as HTMLInputElement).value) }}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">市场</label>
            <select className="select-field" value={market} onChange={(e) => updateParam('market', e.target.value)}>
              {MARKETS.map((m) => <option key={m} value={m}>{MARKET_LABELS[m]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">行业</label>
            <select className="select-field" value={industry} onChange={(e) => updateParam('industry', e.target.value)}>
              <option value="">全部行业</option>
              {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">排序</label>
            <select className="select-field" value={sortBy} onChange={(e) => updateParam('sort_by', e.target.value)}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">方向</label>
            <select className="select-field" value={sortOrder} onChange={(e) => updateParam('sort_order', e.target.value)}>
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </select>
          </div>
        </div>
      </div>

      {/* 结果统计 */}
      <div className="text-sm text-gray-500">
        共 {total} 只股票
      </div>

      {/* 股票表格 */}
      <StockTable stocks={stocks} loading={loading} />

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="btn-secondary text-sm"
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            className="btn-secondary text-sm"
            disabled={page >= totalPages}
            onClick={() => updateParam('page', String(page + 1))}
          >
            下一页
          </button>
        </div>
      )}

      <Disclaimer />
    </div>
  )
}
