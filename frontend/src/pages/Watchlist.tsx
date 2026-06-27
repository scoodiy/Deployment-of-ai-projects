import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../api/watchlist'
import type { WatchlistItem } from '../types'

export default function Watchlist() {
  const navigate = useNavigate()
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [remark, setRemark] = useState('')

  const load = () => {
    fetchWatchlist()
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!code.trim()) return
    try {
      await addToWatchlist({ code: code.trim(), remark: remark.trim() || undefined })
      setCode(''); setRemark('')
      load()
    } catch (e: any) { alert(e.message) }
  }

  const handleRemove = async (c: string) => {
    if (!confirm(`确定取消关注 ${c}？`)) return
    try { await removeFromWatchlist(c); load() } catch (e: any) { alert(e.message) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">添加关注</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-500 mb-1">股票代码</label>
            <input className="input-field" placeholder="如 000001" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">备注</label>
            <input className="input-field" placeholder="可选" value={remark} onChange={(e) => setRemark(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleAdd}>添加</button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-3">关注列表 ({items.length})</h3>
        {items.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无关注股票</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-2 md:px-4 py-3">代码</th>
                <th className="px-2 md:px-4 py-3">名称</th>
                <th className="px-2 md:px-4 py-3 text-right">最新价</th>
                <th className="px-2 md:px-4 py-3 text-right">涨跌幅</th>
                <th className="px-2 md:px-4 py-3 text-right hidden sm:table-cell">成交额</th>
                <th className="px-2 md:px-4 py-3 hidden md:table-cell">备注</th>
                <th className="px-2 md:px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-2 md:px-4 py-3 font-mono text-blue-600 cursor-pointer" onClick={() => navigate(`/stocks/${w.code}`)}>{w.code}</td>
                  <td className="px-2 md:px-4 py-3">{w.name || '-'}</td>
                  <td className="px-2 md:px-4 py-3 text-right font-mono">{w.price?.toFixed(2) ?? '-'}</td>
                  <td className={`px-2 md:px-4 py-3 text-right font-mono ${(w.pct_change ?? 0) > 0 ? 'text-rise' : (w.pct_change ?? 0) < 0 ? 'text-fall' : ''}`}>
                    {w.pct_change != null ? `${w.pct_change > 0 ? '+' : ''}${w.pct_change.toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-2 md:px-4 py-3 text-right hidden sm:table-cell">{w.amount != null ? (w.amount / 1e8).toFixed(2) + '亿' : '-'}</td>
                  <td className="px-2 md:px-4 py-3 text-gray-500 hidden md:table-cell">{w.remark || '-'}</td>
                  <td className="px-2 md:px-4 py-3">
                    <button className="text-red-500 hover:underline text-sm py-2 min-h-[36px]" onClick={() => handleRemove(w.code)}>取消关注</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
