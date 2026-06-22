import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createUserToken } from '@/lib/auth/user';

import { rateLimitMiddleware, getClientIp } from '@/lib/rate-limit';
import { setUserTokenCookie } from '@/lib/auth/user-cookie';

export async function POST(request: Request) {
  // 限流检查
  const ip = getClientIp(request);
  const rateCheck = rateLimitMiddleware('login', request, ip);
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as Record<string, unknown> | undefined;

    if (!user) {
      return NextResponse.json({ error: '该邮箱未注册' }, { status: 401 });
    }

    if (user.status === 'banned') {
      return NextResponse.json({ error: '账号已被封禁' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const token = await createUserToken({ userId: user.id, username: user.username, email: user.email });

    const response = NextResponse.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });

    response.headers.set('Set-Cookie', setUserTokenCookie(token));
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
