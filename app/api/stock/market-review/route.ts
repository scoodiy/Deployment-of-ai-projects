import { NextResponse } from 'next/server';
import { runMarketReview } from '@/lib/stock/service';
import { checkRequestRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rateLimit = checkRequestRateLimit(request, {
      namespace: 'stock:market-review',
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: `大盘复盘请求过于频繁，请 ${rateLimit.retryAfterSeconds} 秒后再试` },
        { status: 429, headers: rateLimit.headers },
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = await runMarketReview(body);
    return NextResponse.json(result, { status: result.success ? 200 : 502, headers: rateLimit.headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : '市场复盘请求失败';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
