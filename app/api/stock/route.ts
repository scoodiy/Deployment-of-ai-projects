import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    deprecated: true,
    message: '旧版股票行情接口已停止直连第三方行情源，请使用 daily_stock_analysis 统一股票智能分析接口。',
    endpoints: {
      analyze: 'POST /api/stock/analyze',
      market_review: 'POST /api/stock/market-review',
      reports: 'GET /api/stock/reports',
      config_status: 'GET /api/stock/config/status',
      config_test: 'POST /api/stock/config/test',
    },
  });
}
