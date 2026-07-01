import { NextResponse } from 'next/server';
import { checkRequestRateLimit } from '@/lib/rate-limit';
import { testStockIntegration } from '@/lib/stock/service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rateLimit = checkRequestRateLimit(request, {
    namespace: 'stock:config-test',
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: `检测请求过于频繁，请 ${rateLimit.retryAfterSeconds} 秒后再试` },
      { status: 429, headers: rateLimit.headers },
    );
  }

  const result = await testStockIntegration();
  return NextResponse.json(result, { status: result.success ? 200 : 502, headers: rateLimit.headers });
}
