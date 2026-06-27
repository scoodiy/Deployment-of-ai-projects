import { NextResponse } from 'next/server';

/**
 * 统一错误处理 — 生产环境不泄露内部细节
 */
export function safeError(message: string, status = 500, details?: unknown) {
  const isDev = process.env.NODE_ENV !== 'production';

  // 生产环境只返回通用消息
  if (!isDev && status >= 500) {
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status }
    );
  }

  // 开发环境或客户端错误返回详细信息
  const body: Record<string, unknown> = { error: message };
  if (isDev && details) {
    body.details = typeof details === 'string' ? details : String(details);
  }
  return NextResponse.json(body, { status });
}
