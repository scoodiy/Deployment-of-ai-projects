import { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { PriceChart } from '../../components/charts/PriceChart';
import { PnLChart } from '../../components/charts/PnLChart';
import { AllocationPie } from '../../components/charts/AllocationPie';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, Shield } from 'lucide-react';
import { formatCurrency, formatPercent, formatCompact } from '../../utils/format';

const mockTicker = Array.from({ length: 30 }, (_, i) => ({
  time: `${i + 1}日`,
  price: 100 + Math.sin(i * 0.3) * 15 + Math.random() * 5,
}));

const mockPnl = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}日`,
  pnl: Math.sin(i * 0.2) * 5000 + Math.random() * 2000 - 1000,
}));

const mockAllocation = [
  { name: 'BTC', value: 40 }, { name: 'ETH', value: 25 },
  { name: '股票', value: 20 }, { name: '现金', value: 15 },
];

const mockTrades = [
  { id: '1', symbol: 'BTCUSDT', side: 'BUY', price: 65230, quantity: 0.5, status: 'FILLED', time: '10:30' },
  { id: '2', symbol: 'ETHUSDT', side: 'SELL', price: 3520, quantity: 2, status: 'FILLED', time: '10:15' },
  { id: '3', symbol: '600519', side: 'BUY', price: 1780, quantity: 100, status: 'FILLED', time: '09:45' },
  { id: '4', symbol: 'BTCUSDT', side: 'SELL', price: 64800, quantity: 0.3, status: 'CANCELLED', time: '09:30' },
];

export function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">仪表盘</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-600/20">
            <DollarSign className="h-6 w-6 text-primary-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">总资产</p>
            <p className="text-xl font-bold text-white">{formatCurrency(125680)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-profit/20">
            <TrendingUp className="h-6 w-6 text-profit" />
          </div>
          <div>
            <p className="text-xs text-gray-400">今日盈亏</p>
            <p className="text-xl font-bold text-profit">{formatCurrency(2350)}</p>
            <p className="text-xs text-profit">{formatPercent(1.9)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20">
            <Activity className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">持仓数</p>
            <p className="text-xl font-bold text-white">8</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-profit/20">
            <Shield className="h-6 w-6 text-profit" />
          </div>
          <div>
            <p className="text-xs text-gray-400">胜率</p>
            <p className="text-xl font-bold text-white">62.5%</p>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-300 mb-4">价格走势</h3>
          <PriceChart data={mockTicker} height={280} />
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-300 mb-4">资产配置</h3>
          <AllocationPie data={mockAllocation} />
          <div className="mt-2 space-y-1">
            {mockAllocation.map((a, i) => (
              <div key={a.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{a.name}</span>
                <span className="text-white">{a.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* PnL + Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-gray-300 mb-4">累计盈亏</h3>
          <PnLChart data={mockPnl} />
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-300 mb-4">最近交易</h3>
          <div className="space-y-2">
            {mockTrades.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                <div className="flex items-center gap-3">
                  <Badge variant={t.side === 'BUY' ? 'profit' : 'loss'}>{t.side}</Badge>
                  <div>
                    <p className="text-sm font-medium text-white">{t.symbol}</p>
                    <p className="text-xs text-gray-500">{t.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{formatCurrency(t.price)}</p>
                  <p className="text-xs text-gray-400">{t.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
