import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchStockList, fetchIndustries } from '../api/stocks'
import type { StockListItem, PaginatedResponse } from '../types'

export default function StockList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<PaginatedResponse<StockListItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [industry, setIndustry] = useState(searchParams.get('industry') || '')
  const [industries, setIndustries] = useState<string[]>([])
  const page = parseInt(searchParams.get('page') || '1')

  useEffect(() => {
    fetchIndustries().then(setIndustries).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchStockList({ keyword, industry, page, page_size: 20 })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [keyword, industry, page])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (industry) params.set('industry', industry)
    params.set('page', '1')
    setSearchParams(params)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="text-4xl">📋</div>
        <p className="text-gray-500">后端服务未连接，请稍后再试</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-500 mb-1">搜索</label>
            <input
              className="input-field"
              placeholder="股票代码或名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm text-gray-500 mb-1">行业</label>
            <select className="select-field w-full" value={industry} onChange={(e) => { setIndustry(e.target.value); }}>
              <option value="">全部</option>
              {industries.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={handleSearch}>搜索</button>
        </div>
      </div>

      {/* 股票列表 */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3">代码</th>
              <th className="px-4 py-3">名称</th>
              <th className="px-4 py-3">行业</th>
              <th className="px-4 py-3 text-right">最新价</th>
              <th className="px-4 py-3 text-right">涨跌幅</th>
              <th className="px-4 py-3 text-right">成交额</th>
              <th className="px-4 py-3 text-right">换手率</th>
              <th className="px-4 py-3 text-right">PE</th>
              <th className="px-4 py-3 text-right">市值</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.map((s) => (
              <tr key={s.code} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/stocks/${s.code}`)}>
                <td className="px-4 py-3 font-mono text-blue-600">{s.code}</td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.industry || '-'}</td>
                <td className="px-4 py-3 text-right font-mono">{s.price?.toFixed(2) ?? '-'}</td>
                <td className={`px-4 py-3 text-right font-mono ${(s.pct_change ?? 0) > 0 ? 'text-rise' : (s.pct_change ?? 0) < 0 ? 'text-fall' : ''}`}>
                  {s.pct_change != null ? `${s.pct_change > 0 ? '+' : ''}${s.pct_change.toFixed(2)}%` : '-'}
                </td>
                <td className="px-4 py-3 text-right font-mono">{s.amount != null ? (s.amount / 1e8).toFixed(2) + '亿' : '-'}</td>
                <td className="px-4 py-3 text-right font-mono">{s.turnover != null ? s.turnover.toFixed(2) + '%' : '-'}</td>
                <td className="px-4 py-3 text-right font-mono">{s.pe_ratio?.toFixed(1) ?? '-'}</td>
                <td className="px-4 py-3 text-right font-mono">{s.market_cap != null ? (s.market_cap / 1e8).toFixed(0) + '亿' : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {data.total > 20 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}>上一页</button>
          <span className="py-2 px-4 text-sm text-gray-500">第 {page} 页 / 共 {Math.ceil(data.total / 20)} 页</span>
          <button className="btn-secondary" disabled={page * 20 >= data.total} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}>下一页</button>
        </div>
      )}
    </div>
  )
}
