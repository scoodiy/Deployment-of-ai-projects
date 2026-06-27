import { NextRequest, NextResponse } from 'next/server';

const SEARCH_API = 'https://smartbox.gtimg.cn/s3/';
const QUOTE_API = 'https://qt.gtimg.cn/';
const KLINE_API = 'https://web.ifzq.gtimg.cn/appstock/app/fqkline/get';

interface StockItem {
  名称: string;
  代码: string;
  THSCODE: string;
  code: string;
  name: string;
  market: string;
  市场: string;
}

interface QuoteData {
  name: string;
  code: string;
  名称: string;
  代码: string;
  最新价: string;
  price: string;
  昨收: string;
  开盘价: string;
  最高价: string;
  最低价: string;
  成交量: string;
  成交额: string;
  涨跌额: string;
  涨跌幅: string;
  change: string;
  change_pct: string;
  换手率: string;
  振幅: string;
  市盈率: string;
  总市值: string;
  流通市值: string;
}

function normalizeCode(code: string): string {
  const clean = code.toUpperCase().replace(/^(SH|SZ)/, '');
  if (clean.length === 6) {
    if (clean.startsWith('6') || clean.startsWith('9')) return 'sh' + clean;
    return 'sz' + clean;
  }
  return code.toLowerCase();
}

function decodeUnicode(s: string): string {
  return s.replace(/\\u[\dA-Fa-f]{4}/g, (m) => String.fromCharCode(parseInt(m.slice(2), 16)));
}

function parseSearchResult(text: string): StockItem[] {
  const results: StockItem[] = [];
  const match = text.match(/v_hint="([^"]*)"/);
  if (!match) return results;

  const items = match[1].split(';').filter(Boolean);
  for (const item of items) {
    const parts = item.split('~');
    if (parts.length >= 4) {
      const [market, code, name] = parts;
      const decodedName = decodeUnicode(name);
      const prefix = market === 'sh' ? 'SH' : 'SZ';
      const fullCode = prefix + code;
      results.push({
        名称: decodedName,
        代码: fullCode,
        THSCODE: fullCode,
        code: fullCode,
        name: decodedName,
        market: market === 'sh' ? '沪市' : '深市',
        市场: market === 'sh' ? '沪市' : '深市',
      });
    }
  }
  return results;
}

function parseQuote(text: string): QuoteData {
  const match = text.match(/v_\w+?="([^"]*)"/);
  if (!match) return {} as QuoteData;

  const fields = match[1].split('~');
  const name = fields[1] || '';
  const code = fields[2] || '';
  const currentPrice = fields[3] || '0';
  const yesterdayClose = fields[4] || '0';
  const open = fields[5] || '0';
  const high = fields[33] || '0';
  const low = fields[34] || '0';
  const volume = fields[6] || '0';
  const amount = fields[37] || '0';
  const changeAmt = fields[31] || '0';
  const changePct = fields[32] || '0';
  const turnover = fields[38] || '0';
  const pe = fields[39] || '0';
  const amplitude = fields[43] || '0';
  const totalCap = fields[45] || '0';
  const floatCap = fields[46] || '0';

  return {
    name,
    code,
    名称: name,
    代码: code,
    最新价: currentPrice,
    price: currentPrice,
    昨收: yesterdayClose,
    开盘价: open,
    最高价: high,
    最低价: low,
    成交量: volume + '手',
    成交额: amount + '万',
    涨跌额: changeAmt,
    涨跌幅: changePct + '%',
    change: changePct,
    change_pct: changePct + '%',
    换手率: turnover + '%',
    振幅: amplitude + '%',
    市盈率: pe,
    总市值: totalCap,
    流通市值: floatCap,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'search';
  const keyword = searchParams.get('keyword') || '';
  const code = searchParams.get('code') || '';
  const interval = searchParams.get('interval') || 'day';
  const count = searchParams.get('count') || '30';
  const question = searchParams.get('question') || '';

  try {
    switch (action) {
      case 'search': {
        const url = `${SEARCH_API}?v=2&q=${encodeURIComponent(keyword)}&t=all`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const buffer = await res.arrayBuffer();
        const text = new TextDecoder('gbk').decode(buffer);
        return NextResponse.json({ success: true, data: parseSearchResult(text) });
      }
      case 'quote': {
        const normalized = normalizeCode(code);
        const url = `${QUOTE_API}q=${normalized}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const buffer = await res.arrayBuffer();
        const text = new TextDecoder('gbk').decode(buffer);
        const data = parseQuote(text);
        return NextResponse.json({ success: true, data });
      }
      case 'klines': {
        const normalized = normalizeCode(code);
        const url = `${KLINE_API}?param=${normalized},${interval},,,${count},qfq`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const json = await res.json();
        return NextResponse.json(json);
      }
      case 'wencai': {
        const q = question || keyword;
        const url = `${SEARCH_API}?v=2&q=${encodeURIComponent(q)}&t=all`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const buffer = await res.arrayBuffer();
        const text = new TextDecoder('gbk').decode(buffer);
        return NextResponse.json({ success: true, data: parseSearchResult(text) });
      }
      default:
        return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'stock api error' }, { status: 502 });
  }
}
