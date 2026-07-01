export type ToolCategory = '查询' | '工具' | '效率' | '游戏';

export interface ToolMeta {
  id: string;
  slug: string;
  href: string;
  name: string;
  desc: string;
  icon: string;
  cat: ToolCategory;
  wide?: boolean;
  legacySlugs?: string[];
}

export const TOOL_CATEGORIES = ['全部', '查询', '工具', '效率', '游戏'] as const;

export const TOOL_CATALOG: ToolMeta[] = [
  { id: 'weather', slug: 'weather', href: '/tools/weather', name: '天气', desc: '实时天气查询，支持全国城市', icon: '🌤️', cat: '查询' },
  { id: 'map', slug: 'map', href: '/tools/map', name: '地图', desc: '地点搜索、地图预览、一键导航', icon: '🗺️', cat: '查询', wide: true },
  { id: 'stock', slug: 'stock-analysis', href: '/tools/stock-analysis', name: '股票智能分析', desc: '股票搜索、行情查看，后续统一接入 AI 分析', icon: '📈', cat: '查询', wide: true, legacySlugs: ['stock'] },
  { id: 'daily-stock', slug: 'market-review', href: '/tools/market-review', name: '大盘复盘', desc: '每日市场涨跌停一览，后续升级为市场智能复盘', icon: '📊', cat: '查询', wide: true, legacySlugs: ['daily-stock'] },
  { id: 'hotlist', slug: 'hotlist', href: '/tools/hotlist', name: '热榜', desc: '多平台热搜聚合，一站速览', icon: '🔥', cat: '查询', wide: true },
  { id: 'ip', slug: 'ip', href: '/tools/ip', name: 'IP 查询', desc: '查询 IP 归属地、运营商', icon: '🌐', cat: '查询' },
  { id: 'translate', slug: 'translate', href: '/tools/translate', name: '翻译', desc: '多语言互译，中英日韩法', icon: '💬', cat: '工具' },
  { id: 'camera-ocr', slug: 'camera-ocr', href: '/tools/camera-ocr', name: '拍照识图', desc: '摄像头拍照、框选区域识别文字并翻译', icon: '📸', cat: '工具', wide: true },
  { id: 'calc', slug: 'calculator', href: '/tools/calculator', name: '计算器', desc: '快捷计算，支持基本运算', icon: '🧮', cat: '工具', legacySlugs: ['calc'] },
  { id: 'json', slug: 'json', href: '/tools/json', name: 'JSON', desc: 'JSON 格式化、压缩、校验', icon: '📋', cat: '工具' },
  { id: 'qrcode', slug: 'qrcode', href: '/tools/qrcode', name: '二维码', desc: '文本、链接生成二维码', icon: '📱', cat: '工具' },
  { id: 'pomodoro', slug: 'pomodoro', href: '/tools/pomodoro', name: '番茄钟', desc: '25分钟专注 + 5分钟休息', icon: '🍅', cat: '效率' },
  { id: '2048', slug: '2048', href: '/tools/2048', name: '2048', desc: '经典数字合并游戏', icon: '🎲', cat: '游戏' },
  { id: 'snake', slug: 'snake', href: '/tools/snake', name: '贪吃蛇', desc: '经典贪吃蛇小游戏', icon: '🐍', cat: '游戏' },
  { id: 'minesweeper', slug: 'minesweeper', href: '/tools/minesweeper', name: '扫雷', desc: '经典扫雷，9×9 十颗雷', icon: '💣', cat: '游戏' },
  { id: 'sudoku', slug: 'sudoku', href: '/tools/sudoku', name: '数独', desc: '逻辑数独，锻炼大脑', icon: '🧩', cat: '游戏' },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOL_CATALOG.find((tool) => tool.slug === slug || tool.legacySlugs?.includes(slug));
}

export function getToolById(id: string): ToolMeta | undefined {
  return TOOL_CATALOG.find((tool) => tool.id === id);
}
