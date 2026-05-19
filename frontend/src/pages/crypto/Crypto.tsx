import { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { PriceChart } from '../../components/charts/PriceChart';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent, formatCompact } from '../../utils/format';
import clsx from 'clsx';

const mockCrypto = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', price: 65230, change: 2.35, volume: 2.8e10, exchange: 'Binance' },
  { symbol: 'ETHUSDT', name: 'Ethereum', price: 3520, change: -1.20, volume: 1.5e10, exchange: 'Binance' },
  { symbol: 'BNBUSDT', name: 'BNB', price: 605, change: 0.85, volume: 2.1e9, exchange: 'Binance' },
  { symbol: 'SOLUSDT', name: 'Solana', price: 152, change: 5.20, volume: 4.5e9, exchange: 'Binance' },
  { symbol: 'XRPUSDT', name: 'XRP', price: 0.62, change: -0.45, volume: 1.8e9, exchange: 'Binance' },
  { symbol: 'ADAUSDT', name: 'Cardano', price: 0.45, change: 1.80, volume: 8.5e8, exchange: 'Binance' },
];

const exchanges = ['Binance', 'OKX', 'Bybit'];

export function Crypto() {
  const [selected, setSelected] = useState(mockCrypto[0]);
  const [activeExchange, setActiveExchange] = useState('Binance');

  const mockChart = Array.from({ length: 50 }, (_, i) => ({
    time: `${i}:00`,
    price: selected.price * (1 + Math.sin(i * 0.15) * 0.03 + (Math.random() - 0.5) * 0.01),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">加密货币</h1>
        <div className="flex gap-2">
          {exchanges.map((ex) => (
            <button
              key={ex}
              onClick={() => setActiveExchange(ex)}
              className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                activeExchange === ex ? 'bg-primary-600 text-white' : 'bg-dark-surface text-gray-400 hover:text-white')}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Ticker Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {mockCrypto.map((c) => (
          <button
            key={c.symbol}
            onClick={() => setSelected(c)}
            className={clsx(
              'glass-card p-3 text-left transition-all',
              selected.symbol === c.symbol ? 'border-primary-500 glow-blue' : 'hover:border-gray-600'
            )}
          >
            <p className="text-xs text-gray-400">{c.symbol.replace('USDT', '')}</p>
            <p className="text-sm font-bold text-white mt-1">{formatCurrency(c.price)}</p>
            <p className={clsx('text-xs mt-1', c.change >= 0 ? 'text-profit' : 'text-loss')}>
              {formatPercent(c.change)}
            </p>
          </button>
        ))}
      </div>

      {/* Chart + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{selected.name} ({selected.symbol})</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-bold text-white">{formatCurrency(selected.price)}</span>
                <Badge variant={selected.change >= 0 ? 'profit' : 'loss'}>
                  {selected.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {formatPercent(selected.change)}
                </Badge>
              </div>
            </div>
          </div>
          <PriceChart data={mockChart} height={350} />
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-gray-300 mb-4">市场信息</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-dark-border">
              <span className="text-sm text-gray-400">24h成交量</span>
              <span className="text-sm text-white">{formatCompact(selected.volume)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-border">
              <span className="text-sm text-gray-400">交易所</span>
              <span className="text-sm text-white">{selected.exchange}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-border">
              <span className="text-sm text-gray-400">交易对</span>
              <span className="text-sm text-white">{selected.symbol}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-400">24h涨跌</span>
              <span className={clsx('text-sm font-medium', selected.change >= 0 ? 'text-profit' : 'text-loss')}>
                {formatPercent(selected.change)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
