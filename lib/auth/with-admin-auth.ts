import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth/utils';
import { apiError } from '@/lib/api/response';

type RouteHandler = (
  request: Request,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wraps an admin API route with authentication.
 * Returns the admin payload if authenticated, or a 401 response.
 * 
 * Usage:
 *   export const GET = withAdminAuth(async (request, admin) => {
 *     return apiSuccess(data);
 *   });
 */
export function withAdminAuth(
  handler: (request: Request, admin: Record<string, unknown>, context?: { params?: Promise<Record<string, string>> }) => Promise<NextResponse>
): RouteHandler {
  return async (request: Request, context?: { params?: Promise<Record<string, string>> }) => {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError('UNAUTHORIZED', '请先登录管理后台', 401);
    }
    try {
      return await handler(request, admin, context);
    } catch (error) {
      console.error('[Admin API Error]', error);
      return apiError('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  };
}
