import { NextResponse } from 'next/server';
import { getStockConfigStatus } from '@/lib/stock/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getStockConfigStatus();
  return NextResponse.json({
    success: true,
    data,
  });
}
