import { Metadata } from 'next';
import DailyStockPageClient from './DailyStockPageClient';

export const metadata: Metadata = {
  title: '每日行情 | y悠悠',
  description: '每日股票市场行情，涨跌停排行榜，实时掌握市场动态',
};

export default function DailyStockPage() {
  return <DailyStockPageClient />;
}
