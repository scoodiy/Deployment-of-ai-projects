import { NextResponse } from 'next/server';
import { getStockReport } from '@/lib/stock/service';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await getStockReport(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : '报告不存在';
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }
}
