// 生产环境使用 quant.ayuu.fun 的后端 API，开发环境使用 localhost:8000
const isProd = window.location.hostname === 'ayuu.fun' || window.location.hostname === 'quant.ayuu.fun' || window.location.hostname.endsWith('.netlify.app');
export const API_BASE_URL = isProd ? 'https://quant.ayuu.fun/api/v1' : '/api/v1';
export const WS_URL = isProd ? 'wss://quant.ayuu.fun/ws' : 'ws://localhost:8000/ws';

export const CHART_COLORS = {
  profit: '#00C853',
  loss: '#FF1744',
  primary: '#3b82f6',
  grid: '#21262D',
  text: '#8b949e',
};

export const NAV_ITEMS = [
  { path: '/', label: '仪表盘', icon: 'LayoutDashboard' },
  { path: '/trading', label: '交易', icon: 'TrendingUp' },
  { path: '/strategies', label: '策略', icon: 'Brain' },
  { path: '/risk', label: '风控', icon: 'Shield' },
  { path: '/stocks', label: '股票', icon: 'BarChart3' },
  { path: '/crypto', label: '加密货币', icon: 'Bitcoin' },
  { path: '/qa-bot', label: '智能问答', icon: 'MessageSquare' },
  { path: '/admin', label: '管理', icon: 'Settings' },
];
