import type {
  DailyStockAcceptedResponse,
  DailyStockHistoryItem,
  DailyStockTaskStatus,
  StockAnalyzeRequest,
  StockConfigStatus,
} from './types';

function getApiBaseUrl() {
  return (process.env.DAILY_STOCK_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function dailyStockFetch<T>(path: string, init: RequestInit = {}, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) as T : {} as T;

    if (!res.ok) {
      const errorData = data as Record<string, unknown>;
      const detail = pickString(errorData.detail) || pickString(errorData.message) || pickString(errorData.error) || text;
      throw new Error(detail || `daily_stock_analysis HTTP ${res.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('股票分析服务响应超时，请稍后重试');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function getDailyStockConfigStatus(): Promise<StockConfigStatus> {
  try {
    const status = await dailyStockFetch<Omit<StockConfigStatus, 'configured' | 'api_url'>>(
      '/api/v1/system/config/setup/status',
      {},
      10000,
    );

    return {
      configured: Boolean(status.is_complete || status.ready_for_smoke),
      is_complete: status.is_complete,
      ready_for_smoke: status.ready_for_smoke,
      required_missing_keys: Array.isArray(status.required_missing_keys) ? status.required_missing_keys : [],
      next_step_key: status.next_step_key,
      checks: Array.isArray(status.checks) ? status.checks : [],
      api_url: getApiBaseUrl(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '股票分析服务不可用';
    return {
      configured: false,
      is_complete: false,
      ready_for_smoke: false,
      required_missing_keys: ['daily_stock_api'],
      next_step_key: 'daily_stock_api',
      checks: [{
        key: 'daily_stock_api',
        title: 'daily_stock_analysis 服务',
        required: true,
        status: 'failed',
        message,
        next_step: '确认 Python 服务正在 127.0.0.1:8000 运行，或配置 DAILY_STOCK_API_URL。',
      }],
      api_url: getApiBaseUrl(),
    };
  }
}

export async function getDailyStockTaskStatus(taskId: string): Promise<DailyStockTaskStatus> {
  return dailyStockFetch<DailyStockTaskStatus>(
    `/api/v1/analysis/status/${encodeURIComponent(taskId)}`,
    {},
    12000,
  );
}

async function pollDailyStockTask(taskId: string, timeoutMs = 50000): Promise<DailyStockTaskStatus> {
  const startedAt = Date.now();
  let lastStatus: DailyStockTaskStatus | null = null;

  while (Date.now() - startedAt < timeoutMs) {
    lastStatus = await getDailyStockTaskStatus(taskId);
    const status = String(lastStatus.status || '').toLowerCase();

    if (['completed', 'failed', 'cancelled', 'cancel_requested'].includes(status)) {
      return lastStatus;
    }

    await sleep(2500);
  }

  return lastStatus || {
    task_id: taskId,
    status: 'processing',
    progress: 0,
  };
}

export async function triggerStockAnalysis(input: StockAnalyzeRequest): Promise<DailyStockTaskStatus> {
  const payload = {
    stock_code: input.stocks[0],
    stock_codes: input.stocks,
    market: input.market,
    report_type: 'detailed',
    async_mode: true,
    notify: false,
    report_language: 'zh',
    ...(input.options || {}),
  };

  const accepted = await dailyStockFetch<DailyStockAcceptedResponse>(
    '/api/v1/analysis/analyze',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    30000,
  );

  const taskId = pickString(accepted.task_id) || pickString(accepted.query_id);
  const status = String(accepted.status || '').toLowerCase();

  if (taskId && status !== 'completed') {
    return pollDailyStockTask(taskId, 115000);
  }

  return accepted as DailyStockTaskStatus;
}

export async function triggerMarketReview(): Promise<DailyStockTaskStatus> {
  const accepted = await dailyStockFetch<DailyStockAcceptedResponse>(
    '/api/v1/analysis/market-review',
    {
      method: 'POST',
      body: JSON.stringify({
        send_notification: false,
        report_language: 'zh',
      }),
    },
    30000,
  );

  const taskId = pickString(accepted.task_id) || pickString(accepted.query_id);
  const status = String(accepted.status || '').toLowerCase();

  if (taskId && status !== 'completed') {
    return pollDailyStockTask(taskId, 65000);
  }

  return accepted as DailyStockTaskStatus;
}

export async function listDailyStockHistory(params: { page?: number; limit?: number; report_type?: string } = {}) {
  const search = new URLSearchParams();
  search.set('page', String(params.page || 1));
  search.set('limit', String(params.limit || 20));
  if (params.report_type) search.set('report_type', params.report_type);

  return dailyStockFetch<{ total?: number; items?: DailyStockHistoryItem[] }>(
    `/api/v1/history?${search.toString()}`,
    {},
    12000,
  );
}

export async function getDailyStockHistoryDetail(id: string) {
  return dailyStockFetch<DailyStockHistoryItem>(
    `/api/v1/history/${encodeURIComponent(id)}`,
    {},
    12000,
  );
}

export async function getDailyStockMarkdown(id: string) {
  return dailyStockFetch<{ markdown?: string; content?: string; report_markdown?: string }>(
    `/api/v1/history/${encodeURIComponent(id)}/markdown`,
    {},
    12000,
  );
}
