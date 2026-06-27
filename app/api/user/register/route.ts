import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth/user';

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
    const { username, email, password, code } = body;

    // 只提取需要的字段，忽略其他所有字段（如 role、status 等）
    if (!username || !email || !password || !code) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少8位' }, { status: 400 });
    }

    if (!/\d/.test(password)) {
      return NextResponse.json({ error: '密码必须包含至少一个数字' }, { status: 400 });
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

    // Verify email code
    const validCode = db.prepare(
      "SELECT id FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > datetime('now')"
    ).get(email, code, 'register') as Record<string, unknown> | undefined;

    if (!validCode) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
    }

    // Mark code as used
    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(validCode.id);

    const passwordHash = await hashPassword(password);
    const result = db.prepare('INSERT INTO users (username, email, password_hash, email_verified) VALUES (?, ?, ?, 1)').run(username, email, passwordHash);

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: { id: result.lastInsertRowid, username, email }
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Register error:', error);
    }
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}
