import { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Brain, Play, Pause, Settings, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

const mockStrategies = [
  { id: '1', name: '网格交易-BTC', type: 'GridStrategy', pnl: 5230, trades: 142, winRate: 68, is_active: true },
  { id: '2', name: '趋势跟踪-ETH', type: 'TrendFollowing', pnl: -1200, trades: 23, winRate: 43, is_active: false },
  { id: '3', name: '马丁格尔-股票', type: 'MartingaleStrategy', pnl: 8900, trades: 67, winRate: 72, is_active: true },
  { id: '4', name: 'EMA交叉-BTC', type: 'TrendFollowing', pnl: 3400, trades: 45, winRate: 55, is_active: true },
];

export function Strategies() {
  const [showCreate, setShowCreate] = useState(false);
  const [strategies, setStrategies] = useState(mockStrategies);

  const toggleStrategy = (id: string) => {
    setStrategies(strategies.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">策略管理</h1>
        <Button onClick={() => setShowCreate(true)}>创建策略</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((s) => (
          <Card key={s.id} className={clsx(s.is_active && 'border-profit/30')}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={clsx('p-3 rounded-xl', s.is_active ? 'bg-profit/20' : 'bg-dark-surface')}>
                  <Brain className={clsx('h-6 w-6', s.is_active ? 'text-profit' : 'text-gray-500')} />
                </div>
                <div>
                  <h3 className="font-medium text-white">{s.name}</h3>
                  <p className="text-xs text-gray-400">{s.type}</p>
                </div>
              </div>
              <Badge variant={s.is_active ? 'profit' : 'info'}>{s.is_active ? '运行中' : '已停止'}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-dark-border">
              <div>
                <p className="text-xs text-gray-400">累计盈亏</p>
                <p className={clsx('text-lg font-bold', s.pnl >= 0 ? 'text-profit' : 'text-loss')}>
                  {s.pnl >= 0 ? '+' : ''}{s.pnl.toLocaleString()} USDT
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">交易次数</p>
                <p className="text-lg font-bold text-white">{s.trades}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">胜率</p>
                <p className="text-lg font-bold text-white">{s.winRate}%</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant={s.is_active ? 'danger' : 'success'}
                size="sm"
                onClick={() => toggleStrategy(s.id)}
              >
                {s.is_active ? <><Pause className="h-4 w-4 mr-1" />停止</> : <><Play className="h-4 w-4 mr-1" />启动</>}
              </Button>
              <Button variant="ghost" size="sm"><Settings className="h-4 w-4 mr-1" />配置</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="创建策略">
        <div className="space-y-4">
          <Input label="策略名称" placeholder="我的策略" />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">策略类型</label>
            <select className="w-full bg-dark-surface border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="GridStrategy">网格策略</option>
              <option value="TrendFollowing">趋势跟踪</option>
              <option value="MartingaleStrategy">马丁格尔</option>
            </select>
          </div>
          <Input label="投资金额" type="number" placeholder="10000" />
          <Input label="交易对" placeholder="BTCUSDT" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={() => setShowCreate(false)}>创建</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
