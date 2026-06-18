import { NextRequest, NextResponse } from 'next/server';

const HOTLIST_API = 'http://192.168.16.7:8005';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  try {
    const res = await fetch(`${HOTLIST_API}/api/hotlist?type=${encodeURIComponent(type)}`, {
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'hotlist api error' }, { status: 502 });
  }
}
