import { NextResponse } from 'next/server';

// POST /api/user/logout - 用户登出
export async function POST() {
  const response = NextResponse.json({ success: true, message: '已退出登录' });
  response.headers.set('Set-Cookie', 'user_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  return response;
}
