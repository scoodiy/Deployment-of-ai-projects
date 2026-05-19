import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../api/watchlist'
import Disclaimer from '../components/Disclaimer'
import type { WatchlistItem } from '../types'

function fmtAmt(v: number | null | undefined) {
  if (v == null) return '-'
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
  if (v >= 1e4) return (v / 1e4).toFixed(2) + '万'
  return v.toFixed(0)
}

export default function Watchlist() {
  const navigate = useNavigate()
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addCode, setAddCode] = useState('')
  const [addRemark, setAddRemark] = useState('')
  const [adding, setAdding] = useState(false)

  function load() {
    setLoading(true)
    fetchWatchlist()
      .then((res) => setItems(res.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleAdd() {
    if (!addCode.trim()) return
    setAdding(true)
    try {
      await addToWatchlist({ code: addCode.trim(), remark: addRemark.trim() || undefined })
      setAddCode('')
      setAddRemark('')
      load()
    } catch {
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(code: string) {
    if (!confirm(`确定取消关注 ${code}？`)) return
    try {
      await removeFromWatchlist(code)
      setItems((prev) => prev.filter((i) => i.code !== code))
    } catch {}
  }

  return (
    <div className="space-y-4">
      {/* 添加关注 */}
      <div className="card">
        <h3 className="font-semibold mb-3">添加关注</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">股票代码</label>
            <input
              type="text"
              className="input-field"
              placeholder="如 600519"
              value={addCode}
              onChange={(e) => setAddCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">备注（可选）</label>
            <input
              type="text"
              className="input-field"
              placeholder="添加备注..."
              value={addRemark}
              onChange={(e) => setAddRemark(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
          </div>
          <button className="btn-primary" onClick={handleAdd} disabled={adding || !addCode.trim()}>
            {adding ? '添加中...' : '添加'}
          </button>
        </div>
      </div>

      {/* 关注列表 */}
      <div className="card p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">暂无关注股票，请在上方添加</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-3">代码</th>
                  <th className="px-3 py-3">名称</th>
                  <th className="px-3 py-3 text-right">最新价</th>
                  <th className="px-3 py-3 text-right">涨跌幅</th>
                  <th className="px-3 py-3 text-right">成交量</th>
                  <th className="px-3 py-3 text-right">成交额</th>
                  <th className="px-3 py-3 hidden md:table-cell">备注</th>
                  <th className="px-3 py-3 hidden md:table-cell">分组</th>
                  <th className="px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td
                      className="px-3 py-2.5 font-mono text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/stocks/${item.code}`)}
                    >
                      {item.code}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{item.name || '-'}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{item.price?.toFixed(2) ?? '-'}</td>
                    <td className={`px-3 py-2.5 text-right font-mono font-medium ${
                      (item.pct_change ?? 0) > 0 ? 'text-rise' : (item.pct_change ?? 0) < 0 ? 'text-fall' : ''
                    }`}>
                      {item.pct_change != null ? `${item.pct_change > 0 ? '+' : ''}${item.pct_change.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtAmt(item.volume)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmtAmt(item.amount)}</td>
                    <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell">{item.remark || '-'}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      {item.group_name ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{item.group_name}</span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        className="text-red-500 hover:text-red-700 text-sm"
                        onClick={() => handleRemove(item.code)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Disclaimer />
    </div>
  )
}
