import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { rateLimitMiddleware, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = rateLimitMiddleware('verify_email', request, ip);
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: '请填写邮箱和验证码' }, { status: 400 });
    }

    const db = getDb();

    const user = db.prepare('SELECT id, email_verified FROM users WHERE email = ?').get(email) as Record<string, unknown> | undefined;
    if (!user) {
      return NextResponse.json({ error: '该邮箱未注册' }, { status: 400 });
    }

    if (user.email_verified) {
      return NextResponse.json({ error: '邮箱已验证，无需重复验证' }, { status: 400 });
    }

    // Verify code
    const validCode = db.prepare(
      "SELECT id FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > datetime('now')"
    ).get(email, code, 'verify_email') as Record<string, unknown> | undefined;

    if (!validCode) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
    }

    // Mark code as used
    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(validCode.id);

    // Mark email as verified
    db.prepare('UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE email = ?').run(email);

    return NextResponse.json({ success: true, message: '邮箱验证成功，请登录' });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Verify email error:', error);
    }
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}
