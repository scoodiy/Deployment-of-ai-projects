import type { Metadata } from 'next';
import ToolPageClient from '../ToolPageClient';

export const metadata: Metadata = {
  title: '大盘复盘 | 工具箱 | y悠悠',
  description: '基于 daily_stock_analysis 的市场复盘与 AI 总结',
};

export default function MarketReviewPage() {
  return <ToolPageClient slug="market-review" />;
}
