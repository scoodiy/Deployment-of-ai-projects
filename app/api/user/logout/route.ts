import { NextResponse } from 'next/server';
import { clearUserTokenCookie } from '@/lib/auth/user-cookie';

// POST /api/user/logout - 用户登出
export async function POST() {
  const response = NextResponse.json({ success: true, message: '已退出登录' });
  response.headers.set('Set-Cookie', clearUserTokenCookie());
  return response;
}
