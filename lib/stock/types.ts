export type StockReportType = 'stock_analysis' | 'market_review';
export type StockReportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface StockAnalyzeRequest {
  stocks: string[];
  market?: string;
  options?: Record<string, unknown>;
}

export interface MarketReviewRequest {
  market?: string;
  date?: string;
}

export interface StockConfigCheck {
  key: string;
  title?: string;
  category?: string;
  required?: boolean;
  status?: string;
  message?: string;
  next_step?: string | null;
}

export interface StockConfigStatus {
  configured: boolean;
  is_complete?: boolean;
  ready_for_smoke?: boolean;
  required_missing_keys: string[];
  next_step_key?: string | null;
  checks: StockConfigCheck[];
  api_url: string;
}

export interface DailyStockAcceptedResponse {
  task_id?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface DailyStockTaskStatus {
  task_id?: string;
  query_id?: string;
  status?: string;
  progress?: number;
  error?: string;
  error_message?: string;
  result?: unknown;
  report?: string;
  report_markdown?: string;
  analysis_report?: string;
  market_review_report?: string;
  market_review_payload?: unknown;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface DailyStockHistoryItem {
  id: number | string;
  query_id?: string;
  stock_code?: string;
  stock_name?: string;
  report_type?: string;
  analysis_summary?: string;
  trend_prediction?: string;
  sentiment_score?: number;
  operation_advice?: string;
  current_price?: number | null;
  change_pct?: number | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface StockReport {
  id: number | string;
  user_id?: number | null;
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
  created_at: string;
  updated_at?: string;
}

export interface StockApiResult<T = unknown> {
  success: boolean;
  data?: T;
  report_markdown?: string;
  summary?: string;
  warnings?: string[];
  created_at?: string;
  error?: string;
}
