import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createUserToken } from '@/lib/auth/user';

import { rateLimitMiddleware, getClientIp } from '@/lib/rate-limit';
import { setUserTokenCookie } from '@/lib/auth/user-cookie';

// In-memory rate limiting: IP → { fails, lastFail }
const ipAttempts = new Map<string, { fails: number; lastFail: number }>();
// In-memory account lock: email → { fails, lockedUntil }
const accountLocks = new Map<string, { fails: number; lockedUntil: number }>();

const IP_WINDOW = 5 * 60 * 1000;   // 5 minutes
const IP_MAX_FAILS = 10;
const ACCOUNT_MAX_FAILS = 5;
const ACCOUNT_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string, email: string): string | null {
  const now = Date.now();

  // Check IP rate limit
  const ipData = ipAttempts.get(ip);
  if (ipData && now - ipData.lastFail < IP_WINDOW && ipData.fails >= IP_MAX_FAILS) {
    return '请求过于频繁，请5分钟后再试';
  }

  // Check account lock
  const acctData = accountLocks.get(email);
  if (acctData && now < acctData.lockedUntil) {
    const mins = Math.ceil((acctData.lockedUntil - now) / 60000);
    return `账号已锁定，请${mins}分钟后再试`;
  }

  return null;
}

function recordFail(ip: string, email: string) {
  const now = Date.now();

  // Update IP attempts
  const ipData = ipAttempts.get(ip);
  if (ipData && now - ipData.lastFail < IP_WINDOW) {
    ipData.fails++;
    ipData.lastFail = now;
  } else {
    ipAttempts.set(ip, { fails: 1, lastFail: now });
  }

  // Update account attempts
  const acctData = accountLocks.get(email);
  if (acctData) {
    acctData.fails++;
    if (acctData.fails >= ACCOUNT_MAX_FAILS) {
      acctData.lockedUntil = now + ACCOUNT_LOCK_DURATION;
    }
  } else {
    accountLocks.set(email, { fails: 1, lockedUntil: 0 });
  }
}

function recordSuccess(ip: string, email: string) {
  ipAttempts.delete(ip);
  accountLocks.delete(email);
}

export async function POST(request: Request) {
  // 限流检查
  const ip = getClientIp(request);
  const rateCheck = rateLimitMiddleware('login', request, ip);
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  try {
    const { email, password } = await request.json();
    const userAgent = request.headers.get('user-agent') || '';

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    // Check account lock + IP rate limit
    const rateLimitError = checkRateLimit(ip, email);
    if (rateLimitError) {
      return NextResponse.json({ error: rateLimitError }, { status: 429 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as Record<string, unknown> | undefined;

    if (!user) {
      recordFail(ip, email);
      db.prepare('INSERT INTO login_logs (username, ip, user_agent, success, fail_reason) VALUES (?, ?, ?, ?, ?)').run(email, ip, userAgent, 0, '邮箱未注册');
      return NextResponse.json({ error: '该邮箱未注册' }, { status: 401 });
    }

    if (user.status === 'banned') {
      db.prepare('INSERT INTO login_logs (username, ip, user_agent, success, fail_reason) VALUES (?, ?, ?, ?, ?)').run(email, ip, userAgent, 0, '账号已封禁');
      return NextResponse.json({ error: '账号已被封禁' }, { status: 403 });
    }

    if (!user.email_verified) {
      db.prepare('INSERT INTO login_logs (username, ip, user_agent, success, fail_reason) VALUES (?, ?, ?, ?, ?)').run(email, ip, userAgent, 0, '邮箱未验证');
      return NextResponse.json({ error: '邮箱未验证，请先验证邮箱后再登录', code: 'EMAIL_NOT_VERIFIED' }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password_hash as string);
    if (!valid) {
      recordFail(ip, email);
      db.prepare('INSERT INTO login_logs (username, ip, user_agent, success, fail_reason) VALUES (?, ?, ?, ?, ?)').run(email, ip, userAgent, 0, '密码错误');
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    // Success
    recordSuccess(ip, email);
    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    db.prepare('INSERT INTO login_logs (username, ip, user_agent, success) VALUES (?, ?, ?, ?)').run(email, ip, userAgent, 1);

    const token = await createUserToken({ userId: user.id, username: user.username, email: String(user.email) });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, email: String(user.email) }
    });

    response.headers.set('Set-Cookie', setUserTokenCookie(token));
    return response;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error);
    }
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
