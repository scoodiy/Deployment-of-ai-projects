import { NextRequest, NextResponse } from 'next/server';

const STOCK_API = 'http://192.168.16.3:8003';
const API_KEY = process.env.STOCK_API_KEY || 'd3cb64bd1112b6eecb1c2bd4418efd29';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'search';
  const keyword = searchParams.get('keyword') || '';
  const code = searchParams.get('code') || '';
  const interval = searchParams.get('interval') || 'day';
  const count = searchParams.get('count') || '30';
  const question = searchParams.get('question') || '';

  try {
    let url = '';
    switch (action) {
      case 'search':
        url = `${STOCK_API}/api/stock/search?keyword=${encodeURIComponent(keyword)}`;
        break;
      case 'quote':
        url = `${STOCK_API}/api/stock/quote?code=${encodeURIComponent(code)}&query_key=汇总`;
        break;
      case 'klines':
        url = `${STOCK_API}/api/stock/klines?code=${encodeURIComponent(code)}&interval=${interval}&count=${count}`;
        break;
      case 'wencai':
        url = `${STOCK_API}/api/stock/wencai?question=${encodeURIComponent(question)}`;
        break;
      default:
        return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { 'X-API-Key': API_KEY },
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'stock api error' }, { status: 502 });
  }
}
