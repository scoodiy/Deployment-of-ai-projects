import { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { PriceChart } from '../../components/charts/PriceChart';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent, formatCompact } from '../../utils/format';
import clsx from 'clsx';

const mockStocks = [
  { symbol: '600519', name: '贵州茅台', price: 1780.50, change: 2.35, volume: 3.2e8 },
  { symbol: '000858', name: '五粮液', price: 152.30, change: -1.20, volume: 5.8e8 },
  { symbol: '601318', name: '中国平安', price: 48.50, change: 0.85, volume: 1.2e9 },
  { symbol: '000333', name: '美的集团', price: 62.80, change: -0.45, volume: 8.5e8 },
  { symbol: '600036', name: '招商银行', price: 35.20, change: 1.50, volume: 9.3e8 },
  { symbol: '002594', name: '比亚迪', price: 228.60, change: 3.20, volume: 6.1e8 },
  { symbol: '601012', name: '隆基绿能', price: 22.15, change: -2.10, volume: 4.5e8 },
  { symbol: '300750', name: '宁德时代', price: 185.40, change: 1.80, volume: 7.2e8 },
];

const mockChart = Array.from({ length: 30 }, (_, i) => ({
  time: `${i + 1}日`,
  price: 1780 + Math.sin(i * 0.3) * 80 + Math.random() * 30,
}));

export function Stocks() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(mockStocks[0]);

  const filtered = mockStocks.filter(s =>
    s.symbol.includes(search) || s.name.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">股票市场</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock List */}
        <Card className="lg:col-span-1 max-h-[600px] overflow-y-auto">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索股票..."
              className="w-full bg-dark-surface border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="space-y-1">
            {filtered.map((s) => (
              <button
                key={s.symbol}
                onClick={() => setSelected(s)}
                className={clsx(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-all text-left',
                  selected.symbol === s.symbol ? 'bg-primary-600/20 border border-primary-500/30' : 'hover:bg-dark-surface'
                )}
              >
                <div>
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{formatCurrency(s.price, 'CNY')}</p>
                  <p className={clsx('text-xs flex items-center gap-1', s.change >= 0 ? 'text-profit' : 'text-loss')}>
                    {s.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {formatPercent(s.change)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{selected.name} ({selected.symbol})</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">{formatCurrency(selected.price, 'CNY')}</span>
                <Badge variant={selected.change >= 0 ? 'profit' : 'loss'}>{formatPercent(selected.change)}</Badge>
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>成交量: {formatCompact(selected.volume)}</p>
            </div>
          </div>
          <PriceChart data={mockChart} height={350} />
        </Card>
      </div>
    </div>
  );
}
