import { NextResponse } from 'next/server';
import { listStockReports } from '@/lib/stock/service';
import type { StockReportType } from '@/lib/stock/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('report_type') as StockReportType | null;
    const limit = Number(searchParams.get('limit') || 20);
    const result = await listStockReports({
      report_type: reportType || undefined,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取股票报告失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
