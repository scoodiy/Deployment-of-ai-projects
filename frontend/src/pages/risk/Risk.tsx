import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { RiskGauge } from '../../components/charts/RiskGauge';
import { Shield, AlertTriangle, TrendingDown, Activity } from 'lucide-react';

const mockMetrics = { max_drawdown: 12.5, sharpe_ratio: 1.85, win_rate: 62.5, profit_factor: 1.65, var_95: 4.2, total_trades: 234, consecutive_losses: 2 };

const mockAlerts = [
  { id: '1', level: 'CRITICAL', rule: 'circuit_breaker', message: '日内亏损达到15%触发熔断', value: 15.2, threshold: 15 },
  { id: '2', level: 'WARNING', rule: 'daily_loss', message: '日内亏损接近上限', value: 8500, threshold: 10000 },
  { id: '3', level: 'INFO', rule: 'position_limit', message: 'BTC仓位接近上限', value: 95000, threshold: 100000 },
  { id: '4', level: 'WARNING', rule: 'consecutive_loss', message: '连续亏损3次', value: 3, threshold: 5 },
];

export function Risk() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">风险管理</h1>

      {/* Risk Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center py-6">
          <RiskGauge value={mockMetrics.max_drawdown} max={30} label="最大回撤 %" />
        </Card>
        <Card className="flex flex-col items-center py-6">
          <RiskGauge value={mockMetrics.var_95} max={10} label="VaR 95%" />
        </Card>
        <Card className="flex flex-col items-center py-6">
          <RiskGauge value={mockMetrics.consecutive_losses} max={10} label="连续亏损" />
        </Card>
        <Card className="flex flex-col items-center py-6">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-profit">{mockMetrics.win_rate}%</span>
            <span className="text-xs text-gray-400 mt-1">胜率</span>
          </div>
        </Card>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-600/20"><TrendingDown className="h-6 w-6 text-primary-400" /></div>
          <div>
            <p className="text-xs text-gray-400">夏普比率</p>
            <p className="text-xl font-bold text-white">{mockMetrics.sharpe_ratio}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-profit/20"><Activity className="h-6 w-6 text-profit" /></div>
          <div>
            <p className="text-xs text-gray-400">盈亏比</p>
            <p className="text-xl font-bold text-white">{mockMetrics.profit_factor}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20"><Shield className="h-6 w-6 text-yellow-400" /></div>
          <div>
            <p className="text-xs text-gray-400">总交易数</p>
            <p className="text-xl font-bold text-white">{mockMetrics.total_trades}</p>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <h3 className="text-sm font-medium text-gray-300 mb-4">风险告警</h3>
        <div className="space-y-3">
          {mockAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-dark-surface border border-dark-border">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${alert.level === 'CRITICAL' ? 'text-loss' : alert.level === 'WARNING' ? 'text-yellow-400' : 'text-primary-400'}`} />
                <div>
                  <p className="text-sm text-white">{alert.message}</p>
                  <p className="text-xs text-gray-500">{alert.rule}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={alert.level === 'CRITICAL' ? 'critical' : alert.level === 'WARNING' ? 'warning' : 'info'}>{alert.level}</Badge>
                <p className="text-xs text-gray-500 mt-1">{alert.value} / {alert.threshold}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
