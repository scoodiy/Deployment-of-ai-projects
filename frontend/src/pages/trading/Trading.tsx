import { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Table } from '../../components/common/Table';
import { PriceChart } from '../../components/charts/PriceChart';
import { formatCurrency, formatPercent } from '../../utils/format';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import clsx from 'clsx';

const mockOrders = [
  { id: '1', symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', quantity: 0.5, price: 64000, status: 'PENDING', created_at: '2024-01-15 10:30' },
  { id: '2', symbol: 'ETHUSDT', side: 'SELL', type: 'LIMIT', quantity: 2, price: 3600, status: 'FILLED', created_at: '2024-01-15 09:15' },
  { id: '3', symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: 0.1, price: 65230, status: 'FILLED', created_at: '2024-01-15 08:30' },
];

const mockPositions = [
  { symbol: 'BTCUSDT', side: 'BUY', quantity: 1.5, avg_price: 63800, unrealized_pnl: 2145 },
  { symbol: 'ETHUSDT', side: 'BUY', quantity: 10, avg_price: 3450, unrealized_pnl: 700 },
  { symbol: '600519', side: 'BUY', quantity: 200, avg_price: 1750, unrealized_pnl: 6000 },
];

const mockChart = Array.from({ length: 50 }, (_, i) => ({
  time: `${i}:00`,
  price: 65000 + Math.sin(i * 0.15) * 1500 + Math.random() * 500,
}));

const mockOrderBook = {
  bids: Array.from({ length: 8 }, (_, i) => [65000 - i * 50, Math.random() * 5]),
  asks: Array.from({ length: 8 }, (_, i) => [65050 + i * 50, Math.random() * 5]),
};

export function Trading() {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState('LIMIT');

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">交易</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">BTCUSDT</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">$65,230.00</span>
                <Badge variant="profit">+2.35%</Badge>
              </div>
            </div>
          </div>
          <PriceChart data={mockChart} height={300} />
        </Card>

        {/* Order Form */}
        <Card>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSide('BUY')}
              className={clsx('flex-1 py-2 rounded-lg font-medium text-sm transition-all',
                side === 'BUY' ? 'bg-profit text-white' : 'bg-dark-surface text-gray-400 hover:text-white')}
            >
              买入
            </button>
            <button
              onClick={() => setSide('SELL')}
              className={clsx('flex-1 py-2 rounded-lg font-medium text-sm transition-all',
                side === 'SELL' ? 'bg-loss text-white' : 'bg-dark-surface text-gray-400 hover:text-white')}
            >
              卖出
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              {['LIMIT', 'MARKET', 'STOP'].map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={clsx('px-3 py-1 rounded text-xs font-medium transition-all',
                    orderType === t ? 'bg-primary-600 text-white' : 'bg-dark-surface text-gray-400')}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input label="交易对" placeholder="BTCUSDT" defaultValue="BTCUSDT" />
            {orderType === 'LIMIT' && <Input label="价格" type="number" placeholder="0.00" />}
            <Input label="数量" type="number" placeholder="0.00" />
            <div className="text-xs text-gray-400">
              <p>可用余额: $50,000.00</p>
              <p>预估金额: $0.00</p>
            </div>
            <Button variant={side === 'BUY' ? 'success' : 'danger'} className="w-full">
              {side === 'BUY' ? '买入' : '卖出'} BTCUSDT
            </Button>
          </div>

          {/* Mini Order Book */}
          <div className="mt-4 border-t border-dark-border pt-4">
            <h4 className="text-xs text-gray-400 mb-2">订单簿</h4>
            <div className="space-y-0.5">
              {mockOrderBook.asks.reverse().map(([p, q], i) => (
                <div key={`a${i}`} className="flex justify-between text-xs">
                  <span className="text-loss">{p.toFixed(0)}</span>
                  <span className="text-gray-500">{q.toFixed(4)}</span>
                </div>
              ))}
              <div className="py-1 text-center text-sm font-bold text-white border-y border-dark-border my-1">
                $65,230.00
              </div>
              {mockOrderBook.bids.map(([p, q], i) => (
                <div key={`b${i}`} className="flex justify-between text-xs">
                  <span className="text-profit">{p.toFixed(0)}</span>
                  <span className="text-gray-500">{q.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Positions & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-gray-300 mb-4">持仓</h3>
          <Table
            columns={[
              { key: 'symbol', header: '交易对' },
              { key: 'side', header: '方向', render: (r) => <Badge variant={r.side === 'BUY' ? 'profit' : 'loss'}>{r.side}</Badge> },
              { key: 'quantity', header: '数量' },
              { key: 'avg_price', header: '均价', render: (r) => formatCurrency(r.avg_price) },
              { key: 'unrealized_pnl', header: '盈亏', render: (r) => <span className={r.unrealized_pnl >= 0 ? 'text-profit' : 'text-loss'}>{formatCurrency(r.unrealized_pnl)}</span> },
            ]}
            data={mockPositions}
          />
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-300 mb-4">订单</h3>
          <Table
            columns={[
              { key: 'symbol', header: '交易对' },
              { key: 'side', header: '方向', render: (r) => <Badge variant={r.side === 'BUY' ? 'profit' : 'loss'}>{r.side}</Badge> },
              { key: 'type', header: '类型' },
              { key: 'price', header: '价格', render: (r) => formatCurrency(r.price) },
              { key: 'status', header: '状态', render: (r) => <Badge variant={r.status === 'FILLED' ? 'profit' : r.status === 'CANCELLED' ? 'loss' : 'info'}>{r.status}</Badge> },
            ]}
            data={mockOrders}
          />
        </Card>
      </div>
    </div>
  );
}
