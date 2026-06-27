import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth/utils';
import { apiError } from '@/lib/api/response';
import { safeError } from '@/lib/api/error-handler';

/**
 * Wraps an admin API route with authentication.
 * Returns the admin payload if authenticated, or a 401 response.
 * 
 * Usage:
 *   export const GET = withAdminAuth(async (request, admin) => {
 *     return apiSuccess(data);
 *   });
 */
export function withAdminAuth<T = Record<string, unknown>>(
  handler: (request: Request, admin: Record<string, unknown>, context: T) => Promise<NextResponse | Response | undefined>
) {
  return async (request: Request, context: T) => {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return apiError('UNAUTHORIZED', '请先登录管理后台', 401);
    }
    try {
      return await handler(request, admin, context);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Admin API Error]', error);
      }
      return safeError('服务器内部错误', 500, error);
    }
  };
}
