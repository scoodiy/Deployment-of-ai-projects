import { getDb } from '@/lib/db';
import {
  getDailyStockConfigStatus,
  getDailyStockHistoryDetail,
  getDailyStockMarkdown,
  getDailyStockTaskStatus,
  listDailyStockHistory,
  triggerMarketReview,
  triggerStockAnalysis,
} from './daily-stock-adapter';
import type {
  DailyStockHistoryItem,
  DailyStockTaskStatus,
  MarketReviewRequest,
  StockAnalyzeRequest,
  StockApiResult,
  StockReport,
  StockReportStatus,
  StockReportType,
} from './types';
import { validateMarketInput, validateStockAnalyzeInput } from './validation';

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function stringify(value: unknown) {
  return JSON.stringify(value ?? null);
}

function toStatus(value: unknown): StockReportStatus {
  const status = String(value || '').toLowerCase();
  if (['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
    return status as StockReportStatus;
  }
  if (status === 'cancel_requested') return 'cancelled';
  return 'completed';
}

function getNestedRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function formatReportValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => typeof item === 'object' ? JSON.stringify(item) : String(item))
      .join('；');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function appendRecordSection(lines: string[], title: string, value: unknown, maxItems = 8) {
  const record = getNestedRecord(value);
  const entries = Object.entries(record)
    .map(([key, item]) => [key, formatReportValue(item)] as const)
    .filter(([, item]) => item)
    .slice(0, maxItems);

  if (entries.length === 0) return;

  lines.push(`## ${title}`);
  for (const [key, item] of entries) {
    lines.push(`- **${key}**：${item}`);
  }
  lines.push('');
}

function reportObjectToMarkdown(value: unknown): string {
  const report = getNestedRecord(value);
  if (Object.keys(report).length === 0) return '';

  const meta = getNestedRecord(report.meta);
  const summary = getNestedRecord(report.summary);
  const strategy = getNestedRecord(report.strategy);
  const details = getNestedRecord(report.details);
  const title = `${pickString(meta.stock_name, meta.stock_code, '股票')} 智能分析报告`;
  const lines: string[] = [`# ${title}`, ''];

  const overview = pickString(summary.analysis_summary);
  if (overview) {
    lines.push('## 核心结论', overview, '');
  }

  const decisionItems = [
    ['当前价格', meta.current_price],
    ['涨跌幅', meta.change_pct],
    ['趋势判断', summary.trend_prediction],
    ['综合评分', summary.sentiment_score],
    ['情绪标签', summary.sentiment_label],
    ['操作建议', summary.operation_advice || summary.action_label],
    ['模型', meta.model_used],
  ]
    .map(([key, item]) => [key, formatReportValue(item)] as const)
    .filter(([, item]) => item);

  if (decisionItems.length > 0) {
    lines.push('## 决策面板');
    for (const [key, item] of decisionItems) {
      lines.push(`- **${key}**：${item}`);
    }
    lines.push('');
  }

  appendRecordSection(lines, '操作计划', strategy);
  appendRecordSection(lines, '财务与分红', {
    financial_report: details.financial_report,
    dividend_metrics: details.dividend_metrics,
  }, 4);
  appendRecordSection(lines, '板块与概念', {
    belong_boards: details.belong_boards,
    sector_rankings: details.sector_rankings,
    concept_rankings: details.concept_rankings,
  }, 4);

  const rawResult = pickString(details.raw_result);
  if (rawResult) {
    lines.push('## 原始模型分析', rawResult, '');
  }

  return lines.join('\n').trim();
}

function extractMarkdown(task: DailyStockTaskStatus): string {
  const result = getNestedRecord(task.result);
  const nested = getNestedRecord(result.data);
  const reportMarkdown = reportObjectToMarkdown(result.report);

  return pickString(
    task.report_markdown,
    task.market_review_report,
    task.analysis_report,
    task.report,
    result.report_markdown,
    result.market_review_report,
    result.analysis_report,
    result.report,
    nested.report_markdown,
    nested.markdown,
    reportMarkdown,
  );
}

function extractSummary(task: DailyStockTaskStatus, markdown: string, fallback: string): string {
  const result = getNestedRecord(task.result);
  const report = getNestedRecord(result.report);
  const reportSummary = getNestedRecord(report.summary);
  const payload = getNestedRecord(task.market_review_payload);
  const direct = pickString(
    task.analysis_summary,
    result.analysis_summary,
    reportSummary.analysis_summary,
    result.summary,
    payload.summary,
  );

  if (direct) return direct;

  const line = markdown
    .split('\n')
    .map((item) => item.replace(/^#+\s*/, '').trim())
    .find((item) => item && !item.startsWith('|') && !item.startsWith('-'));

  return line || fallback;
}

function mapTaskData(task: DailyStockTaskStatus) {
  const result = getNestedRecord(task.result);
  const report = getNestedRecord(result.report);
  const reportSummary = getNestedRecord(report.summary);
  return {
    task_id: task.task_id || task.query_id || '',
    status: task.status || 'completed',
    progress: task.progress ?? null,
    market_review_payload: task.market_review_payload ?? result.market_review_payload ?? null,
    result: task.result ?? null,
    report: result.report ?? null,
    report_summary: reportSummary,
    raw: task,
  };
}

function rowToReport(row: Record<string, unknown>): StockReport {
  return {
    id: Number(row.id),
    user_id: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
    stocks: safeJsonParse<string[]>(String(row.stocks || '[]'), []),
    market: String(row.market || ''),
    report_type: String(row.report_type || 'stock_analysis') as StockReportType,
    summary: String(row.summary || ''),
    report_markdown: String(row.report_markdown || ''),
    raw_data: safeJsonParse<unknown>(String(row.raw_data || '{}'), {}),
    status: toStatus(row.status),
    error_message: String(row.error_message || ''),
    external_report_id: String(row.external_report_id || ''),
    external_task_id: String(row.external_task_id || ''),
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  };
}

function saveTask(taskType: StockReportType, inputParams: unknown, status: StockReportStatus, externalTaskId = '') {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO stock_tasks (task_type, input_params, status, progress, external_task_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(taskType, stringify(inputParams), status, status === 'completed' ? 100 : 0, externalTaskId);

  return Number(result.lastInsertRowid);
}

function updateTask(id: number, status: StockReportStatus, reportId?: number, errorMessage = '', externalTaskId = '') {
  const db = getDb();
  db.prepare(`
    UPDATE stock_tasks
    SET status = ?,
        progress = ?,
        result_report_id = COALESCE(?, result_report_id),
        error_message = ?,
        external_task_id = CASE WHEN ? != '' THEN ? ELSE external_task_id END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, status === 'completed' ? 100 : status === 'failed' ? 0 : 50, reportId || null, errorMessage, externalTaskId, externalTaskId, id);
}

function createStockAnalysisReport(params: {
  stocks: string[];
  market?: string;
  report_type: StockReportType;
  summary: string;
  report_markdown: string;
  raw_data: unknown;
  status: StockReportStatus;
  error_message?: string;
  external_report_id?: string;
  external_task_id?: string;
}) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO stock_analysis_reports (
      stocks, market, report_type, summary, report_markdown, raw_data, status,
      error_message, external_report_id, external_task_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    stringify(params.stocks),
    params.market || '',
    params.report_type,
    params.summary,
    params.report_markdown,
    stringify(params.raw_data),
    params.status,
    params.error_message || '',
    params.external_report_id || '',
    params.external_task_id || '',
  );

  return getLocalReport(Number(result.lastInsertRowid));
}

function updateStockAnalysisReport(id: number, params: {
  summary: string;
  report_markdown: string;
  raw_data: unknown;
  status: StockReportStatus;
  error_message?: string;
}) {
  const db = getDb();
  db.prepare(`
    UPDATE stock_analysis_reports
    SET summary = ?, report_markdown = ?, raw_data = ?, status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    params.summary,
    params.report_markdown,
    stringify(params.raw_data),
    params.status,
    params.error_message || '',
    id,
  );

  return getLocalReport(id);
}

function getLocalReport(id: number): StockReport | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM stock_analysis_reports WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToReport(row) : null;
}

function historyItemToReport(item: DailyStockHistoryItem): StockReport {
  const reportType = item.report_type === 'market_review' ? 'market_review' : 'stock_analysis';
  const stockCode = item.stock_code && item.stock_code !== 'MARKET' ? String(item.stock_code) : '';

  return {
    id: `external:${item.id}`,
    stocks: stockCode ? [stockCode] : [],
    market: reportType === 'market_review' ? 'cn' : '',
    report_type: reportType,
    summary: pickString(item.analysis_summary, item.trend_prediction, item.operation_advice, '历史报告'),
    report_markdown: '',
    raw_data: item,
    status: 'completed',
    external_report_id: String(item.id),
    external_task_id: String(item.query_id || ''),
    created_at: String(item.created_at || ''),
  };
}

function configWarnings(config: Awaited<ReturnType<typeof getDailyStockConfigStatus>>) {
  if (config.configured) return [];
  const missing = config.required_missing_keys.length ? config.required_missing_keys.join('、') : '模型或数据源';
  return [`股票分析模块配置未完整：${missing}。部分分析可能降级或失败。`];
}

export async function getStockConfigStatus() {
  return getDailyStockConfigStatus();
}

export async function runStockAnalysis(body: unknown): Promise<StockApiResult> {
  const input: StockAnalyzeRequest = validateStockAnalyzeInput(body);
  const taskId = saveTask('stock_analysis', input, 'processing');
  const warnings = configWarnings(await getDailyStockConfigStatus());

  try {
    const task = await triggerStockAnalysis(input);
    const status = toStatus(task.status);
    const markdown = extractMarkdown(task);
    const summary = extractSummary(task, markdown, `${input.stocks.join('、')} 智能分析`);
    const externalTaskId = String(task.task_id || task.query_id || '');

    const report = createStockAnalysisReport({
      stocks: input.stocks,
      market: input.market,
      report_type: 'stock_analysis',
      summary,
      report_markdown: markdown,
      raw_data: mapTaskData(task),
      status,
      error_message: pickString(task.error_message, task.error),
      external_task_id: externalTaskId,
    });

    updateTask(taskId, status, typeof report?.id === 'number' ? report.id : undefined, report?.error_message || '', externalTaskId);

    return {
      success: status !== 'failed',
      data: {
        report,
        analysis: mapTaskData(task),
      },
      report_markdown: markdown,
      summary,
      warnings,
      created_at: report?.created_at,
      error: status === 'failed' ? report?.error_message || '股票分析失败' : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '股票分析失败';
    const report = createStockAnalysisReport({
      stocks: input.stocks,
      market: input.market,
      report_type: 'stock_analysis',
      summary: `${input.stocks.join('、')} 分析失败`,
      report_markdown: '',
      raw_data: { error: message },
      status: 'failed',
      error_message: message,
    });

    updateTask(taskId, 'failed', typeof report?.id === 'number' ? report.id : undefined, message);

    return {
      success: false,
      data: { report },
      warnings,
      error: message,
      created_at: report?.created_at,
    };
  }
}

export async function runMarketReview(body: unknown): Promise<StockApiResult> {
  const input: MarketReviewRequest = validateMarketInput(body);
  const taskId = saveTask('market_review', input, 'processing');
  const warnings = configWarnings(await getDailyStockConfigStatus());

  try {
    const task = await triggerMarketReview();
    const status = toStatus(task.status);
    const markdown = extractMarkdown(task);
    const summary = extractSummary(task, markdown, '大盘复盘 / 市场分析');
    const externalTaskId = String(task.task_id || task.query_id || '');

    const report = createStockAnalysisReport({
      stocks: [],
      market: input.market,
      report_type: 'market_review',
      summary,
      report_markdown: markdown,
      raw_data: mapTaskData(task),
      status,
      error_message: pickString(task.error_message, task.error),
      external_task_id: externalTaskId,
    });

    updateTask(taskId, status, typeof report?.id === 'number' ? report.id : undefined, report?.error_message || '', externalTaskId);

    return {
      success: status !== 'failed',
      data: {
        report,
        review: mapTaskData(task),
      },
      report_markdown: markdown,
      summary,
      warnings,
      created_at: report?.created_at,
      error: status === 'failed' ? report?.error_message || '市场复盘失败' : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '市场复盘失败';
    const report = createStockAnalysisReport({
      stocks: [],
      market: input.market,
      report_type: 'market_review',
      summary: '市场复盘失败',
      report_markdown: '',
      raw_data: { error: message },
      status: 'failed',
      error_message: message,
    });

    updateTask(taskId, 'failed', typeof report?.id === 'number' ? report.id : undefined, message);

    return {
      success: false,
      data: { report },
      warnings,
      error: message,
      created_at: report?.created_at,
    };
  }
}

export async function listStockReports(params: { report_type?: StockReportType; limit?: number } = {}) {
  const limit = Math.min(Math.max(params.limit || 20, 1), 50);
  const db = getDb();
  const rows = params.report_type
    ? db.prepare('SELECT * FROM stock_analysis_reports WHERE report_type = ? ORDER BY created_at DESC LIMIT ?').all(params.report_type, limit)
    : db.prepare('SELECT * FROM stock_analysis_reports ORDER BY created_at DESC LIMIT ?').all(limit);

  const localReports = (rows as Record<string, unknown>[]).map(rowToReport);

  try {
    const history = await listDailyStockHistory({ page: 1, limit, report_type: params.report_type });
    const external = (history.items || [])
      .map(historyItemToReport)
      .filter((item) => !localReports.some((report) => report.external_report_id && report.external_report_id === item.external_report_id));

    return {
      success: true,
      data: [...localReports, ...external].slice(0, limit),
    };
  } catch {
    return {
      success: true,
      data: localReports,
      warnings: ['历史报告服务暂时不可用，已显示本地记录。'],
    };
  }
}

export async function getStockReport(id: string) {
  const normalizedId = id.replace(/^external%3A/i, 'external:');

  if (normalizedId.startsWith('external:')) {
    const externalId = normalizedId.slice('external:'.length);
    const [detail, markdownData] = await Promise.all([
      getDailyStockHistoryDetail(externalId),
      getDailyStockMarkdown(externalId).catch(() => ({ markdown: '', report_markdown: '', content: '' })),
    ]);
    const report = historyItemToReport(detail);
    report.report_markdown = pickString(markdownData.markdown, markdownData.report_markdown, markdownData.content);
    report.raw_data = detail;

    return {
      success: true,
      data: report,
      report_markdown: report.report_markdown,
      summary: report.summary,
      created_at: report.created_at,
    };
  }

  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    throw new Error('报告 ID 不正确');
  }

  let report = getLocalReport(numericId);
  if (!report) {
    throw new Error('报告不存在');
  }

  if ((report.status === 'processing' || report.status === 'pending') && report.external_task_id) {
    try {
      const task = await getDailyStockTaskStatus(report.external_task_id);
      const status = toStatus(task.status);
      const markdown = extractMarkdown(task);
      const summary = extractSummary(task, markdown, report.summary || '股票分析报告');
      report = updateStockAnalysisReport(numericId, {
        summary,
        report_markdown: markdown,
        raw_data: mapTaskData(task),
        status,
        error_message: pickString(task.error_message, task.error),
      }) || report;
    } catch {
      report = updateStockAnalysisReport(numericId, {
        summary: report.summary,
        report_markdown: report.report_markdown,
        raw_data: report.raw_data,
        status: report.status,
        error_message: report.error_message || '外部任务状态刷新失败，请稍后重试',
      }) || report;
    }
  }

  return {
    success: true,
    data: report,
    report_markdown: report.report_markdown,
    summary: report.summary,
    created_at: report.created_at,
  };
}

export async function testStockIntegration() {
  const status = await getDailyStockConfigStatus();
  let historyAvailable = false;

  try {
    await listDailyStockHistory({ page: 1, limit: 1 });
    historyAvailable = true;
  } catch {
    historyAvailable = false;
  }

  return {
    success: status.required_missing_keys[0] !== 'daily_stock_api',
    data: {
      config: status,
      history_available: historyAvailable,
      database_tables: ['stock_analysis_reports', 'stock_tasks'],
    },
    warnings: configWarnings(status),
  };
}
