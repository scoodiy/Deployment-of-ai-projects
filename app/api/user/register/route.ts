import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, createUserToken } from '@/lib/auth/user';

import { rateLimitMiddleware, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // 限流检查
  const ip = getClientIp(request);
  const rateCheck = rateLimitMiddleware('register', request, ip);
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  try {
    const body = await request.json();
    const { username, email, password } = body;

    // 只提取需要的字段，忽略其他所有字段（如 role、status 等）
    if (!username || !email || !password) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    // 验证用户名格式
    if (username.length < 2 || username.length > 50) {
      return NextResponse.json({ error: '用户名长度2-50个字符' }, { status: 400 });
    }

    const db = getDb();

    // Check if username or email exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return NextResponse.json({ error: '用户名或邮箱已存在' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    // 只插入必要字段，role/status 使用默认值
    const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, passwordHash);

    const token = await createUserToken({ userId: result.lastInsertRowid, username, email });

    const response = NextResponse.json({
      success: true,
      token,
      user: { id: result.lastInsertRowid, username, email }
    });

    response.headers.set('Set-Cookie', `user_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}
