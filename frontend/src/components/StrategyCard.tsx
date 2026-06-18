import type { StrategyInfo } from '../types'

interface Props {
  strategy: StrategyInfo
  selected?: boolean
  onClick?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  turtle: '海龟交易',
  low_atr: '低ATR',
  breakout: '突破平台',
  momentum: '动量选股',
  value: '价值投资',
  mean_reversion: '均值回归',
  volume_price: '量价关系',
  ma_system: '均线系统',
  pattern: 'K线形态',
  composite: '综合策略',
}

export default function StrategyCard({ strategy, selected, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{strategy.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          strategy.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {strategy.is_active ? '启用' : '停用'}
        </span>
      </div>
      <span className="inline-block text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 mb-2">
        {TYPE_LABELS[strategy.strategy_type] || strategy.strategy_type}
      </span>
      {strategy.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{strategy.description}</p>
      )}
    </div>
  )
}
