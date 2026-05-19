import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Table } from '../../components/common/Table';
import { Users, Database, Server, Activity } from 'lucide-react';

const mockUsers = [
  { id: '1', username: 'admin', email: 'admin@quant.com', is_active: true, is_admin: true, trades: 156 },
  { id: '2', username: 'trader1', email: 'trader1@quant.com', is_active: true, is_admin: false, trades: 89 },
  { id: '3', username: 'trader2', email: 'trader2@quant.com', is_active: false, is_admin: false, trades: 23 },
];

const systemStatus = [
  { name: 'API 服务', status: 'running', uptime: '99.9%', latency: '12ms' },
  { name: '策略引擎', status: 'running', uptime: '99.8%', latency: '5ms' },
  { name: '风控引擎', status: 'running', uptime: '100%', latency: '3ms' },
  { name: '数据采集', status: 'running', uptime: '99.5%', latency: '45ms' },
  { name: 'QA Bot', status: 'running', uptime: '99.7%', latency: '120ms' },
];

export function Admin() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">系统管理</h1>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-profit/20"><Server className="h-6 w-6 text-profit" /></div>
          <div>
            <p className="text-xs text-gray-400">服务状态</p>
            <p className="text-lg font-bold text-profit">全部正常</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-600/20"><Users className="h-6 w-6 text-primary-400" /></div>
          <div>
            <p className="text-xs text-gray-400">活跃用户</p>
            <p className="text-lg font-bold text-white">2</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20"><Database className="h-6 w-6 text-yellow-400" /></div>
          <div>
            <p className="text-xs text-gray-400">数据库</p>
            <p className="text-lg font-bold text-white">正常</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-profit/20"><Activity className="h-6 w-6 text-profit" /></div>
          <div>
            <p className="text-xs text-gray-400">API延迟</p>
            <p className="text-lg font-bold text-white">12ms</p>
          </div>
        </Card>
      </div>

      {/* Services */}
      <Card>
        <h3 className="text-sm font-medium text-gray-300 mb-4">服务状态</h3>
        <div className="space-y-2">
          {systemStatus.map((s) => (
            <div key={s.name} className="flex items-center justify-between py-3 px-4 rounded-lg bg-dark-surface border border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
                <span className="text-sm text-white">{s.name}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xs text-gray-400">可用性: {s.uptime}</span>
                <span className="text-xs text-gray-400">延迟: {s.latency}</span>
                <Badge variant="profit">运行中</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Users */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">用户管理</h3>
          <Button size="sm">添加用户</Button>
        </div>
        <Table
          columns={[
            { key: 'username', header: '用户名' },
            { key: 'email', header: '邮箱' },
            { key: 'is_active', header: '状态', render: (r) => <Badge variant={r.is_active ? 'profit' : 'loss'}>{r.is_active ? '活跃' : '禁用'}</Badge> },
            { key: 'is_admin', header: '角色', render: (r) => <Badge variant={r.is_admin ? 'info' : 'warning'}>{r.is_admin ? '管理员' : '交易员'}</Badge> },
            { key: 'trades', header: '交易数' },
            { key: 'actions', header: '操作', render: () => <Button variant="ghost" size="sm">编辑</Button> },
          ]}
          data={mockUsers}
        />
      </Card>
    </div>
  );
}
