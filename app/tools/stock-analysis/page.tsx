import type { Metadata } from 'next';
import ToolPageClient from '../ToolPageClient';

export const metadata: Metadata = {
  title: '股票智能分析 | 工具箱 | y悠悠',
  description: '基于 daily_stock_analysis 的多市场股票 AI 分析',
};

export default function StockAnalysisPage() {
  return <ToolPageClient slug="stock-analysis" />;
}
