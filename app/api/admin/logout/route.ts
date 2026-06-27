import { NextResponse } from 'next/server';
import { clearTokenCookie } from '@/lib/auth/utils';

// POST /api/admin/logout - 管理员登出
export async function POST() {
  const response = NextResponse.json({ success: true, message: '已退出登录' });
  response.headers.set('Set-Cookie', clearTokenCookie());
  return response;
}
