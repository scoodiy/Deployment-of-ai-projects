import type { MarketReviewRequest, StockAnalyzeRequest } from './types';

const STOCK_CODE_PATTERN = /^(hk\d{5}|\d{6}|[a-z]{1,6}(?:\.[a-z]{1,3})?)$/i;
const MARKET_PATTERN = /^(auto|cn|a|ashare|hk|us|global)$/i;

export function normalizeStockCode(value: string): string {
  const code = value.trim();
  if (!code) return '';
  if (/^hk/i.test(code)) return `hk${code.replace(/^hk/i, '').padStart(5, '0')}`;
  if (/^\d{6}$/.test(code)) return code;
  return code.toUpperCase();
}

export function parseStockList(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .flatMap((item) => String(item).split(/[\s,，;；]+/))
      .map(normalizeStockCode)
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    return input
      .split(/[\s,，;；]+/)
      .map(normalizeStockCode)
      .filter(Boolean);
  }

  return [];
}

export function validateStockAnalyzeInput(body: unknown): StockAnalyzeRequest {
  const data = (body || {}) as Record<string, unknown>;
  const stocks = parseStockList(data.stocks ?? data.stock_codes ?? data.stock_code);
  const invalid = stocks.filter((code) => !STOCK_CODE_PATTERN.test(code));

  if (stocks.length === 0) {
    throw new Error('请至少输入 1 个股票代码');
  }

  if (stocks.length > 20) {
    throw new Error('一次最多分析 20 个股票代码');
  }

  if (invalid.length > 0) {
    throw new Error(`股票代码格式不正确：${invalid.join('、')}`);
  }

  const market = typeof data.market === 'string' && data.market.trim()
    ? data.market.trim().toLowerCase()
    : 'auto';

  if (!MARKET_PATTERN.test(market)) {
    throw new Error('市场参数只支持 auto/cn/a/hk/us/global');
  }

  return {
    stocks,
    market,
    options: typeof data.options === 'object' && data.options ? data.options as Record<string, unknown> : {},
  };
}

export function validateMarketInput(body: unknown): MarketReviewRequest {
  const data = (body || {}) as Record<string, unknown>;
  const market = typeof data.market === 'string' && data.market.trim()
    ? data.market.trim().toLowerCase()
    : 'cn';

  if (!MARKET_PATTERN.test(market)) {
    throw new Error('市场参数只支持 auto/cn/a/hk/us/global');
  }

  const date = typeof data.date === 'string' && data.date.trim() ? data.date.trim() : undefined;

  return { market, date };
}
