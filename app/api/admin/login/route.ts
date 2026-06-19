import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createToken, setTokenCookie } from '@/lib/auth/utils';
import { apiSuccess, apiError, getIp } from '@/lib/api/response';

// In-memory rate limiting: IP → { fails, lockedUntil }
const ipAttempts = new Map<string, { fails: number; lastFail: number }>();
const accountLocks = new Map<string, { fails: number; lockedUntil: number }>();

const IP_WINDOW = 5 * 60 * 1000;   // 5 minutes
const IP_MAX_FAILS = 5;
const ACCOUNT_MAX_FAILS = 10;
const ACCOUNT_LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

function checkRateLimit(ip: string, username: string): string | null {
  const now = Date.now();

  // Check IP rate limit
  const ipData = ipAttempts.get(ip);
  if (ipData && now - ipData.lastFail < IP_WINDOW && ipData.fails >= IP_MAX_FAILS) {
    return '请求过于频繁，请5分钟后再试';
  }

  // Check account lock
  const acctData = accountLocks.get(username);
  if (acctData && now < acctData.lockedUntil) {
    const mins = Math.ceil((acctData.lockedUntil - now) / 60000);
    return `账号已锁定，请${mins}分钟后再试`;
  }

  return null;
}

function recordFail(ip: string, username: string) {
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
  const acctData = accountLocks.get(username);
  if (acctData) {
    acctData.fails++;
    if (acctData.fails >= ACCOUNT_MAX_FAILS) {
      acctData.lockedUntil = now + ACCOUNT_LOCK_DURATION;
    }
  } else {
    accountLocks.set(username, { fails: 1, lockedUntil: 0 });
  }
}

function recordSuccess(ip: string, username: string) {
  ipAttempts.delete(ip);
  accountLocks.delete(username);
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const ip = getIp(request);
    const userAgent = request.headers.get('user-agent') || '';

    if (!username || !password) {
      return apiError('MISSING_FIELDS', '请输入用户名和密码', 400);
    }

    // Check rate limits
    const rateLimitError = checkRateLimit(ip, username);
    if (rateLimitError) {
      return apiError('RATE_LIMITED', rateLimitError, 429);
    }

    const db = getDb();
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as Record<string, unknown> | undefined;

    if (!admin) {
      recordFail(ip, username);
      // Log failed attempt
      db.prepare('INSERT INTO login_logs (username, ip, user_agent, success, fail_reason) VALUES (?, ?, ?, ?, ?)').run(username, ip, userAgent, 0, '用户不存在');
      return apiError('INVALID_CREDENTIALS', '用户名或密码错误', 401);
    }

    const valid = await verifyPassword(password, admin.password_hash as string);
    if (!valid) {
      recordFail(ip, username);
      db.prepare('INSERT INTO login_logs (username, ip, user_agent, success, fail_reason) VALUES (?, ?, ?, ?, ?)').run(username, ip, userAgent, 0, '密码错误');
      return apiError('INVALID_CREDENTIALS', '用户名或密码错误', 401);
    }

    // Success
    recordSuccess(ip, username);
    db.prepare('UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id);
    db.prepare('INSERT INTO login_logs (username, ip, user_agent, success) VALUES (?, ?, ?, ?)').run(username, ip, userAgent, 1);

    const token = await createToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    // Log operation
    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, detail, ip) VALUES (?, ?, ?, ?, ?)').run(
      admin.id, 'login', 'admin', '管理员登录', ip
    );

    const response = apiSuccess({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname,
        role: admin.role,
      },
    });

    response.headers.set('Set-Cookie', setTokenCookie(token));
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return apiError('INTERNAL_ERROR', '登录失败', 500);
  }
}
