import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendVerificationEmail, generateCode } from '@/lib/email';
import { rateLimitMiddleware, getClientIp } from '@/lib/rate-limit';

// POST /api/user/send-code - 发送验证码
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = rateLimitMiddleware('sendCode', request, ip);
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  try {
    const { email, type } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '请输入邮箱' }, { status: 400 });
    }

    const validTypes = ['register', 'reset_password'];
    const codeType = validTypes.includes(type) ? type : 'register';

    const db = getDb();

    // For registration, check if email already exists
    if (codeType === 'register') {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
      }
    }

    // For password reset, check if email exists
    if (codeType === 'reset_password') {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (!existing) {
        return NextResponse.json({ error: '该邮箱未注册' }, { status: 400 });
      }
    }

    // Check if there's a recent code (rate limit: 1 per minute)
    const recentCode = db.prepare(
      "SELECT id FROM verification_codes WHERE email = ? AND type = ? AND created_at > datetime('now', '-1 minute')"
    ).get(email, codeType);

    if (recentCode) {
      return NextResponse.json({ error: '验证码发送过于频繁，请1分钟后再试' }, { status: 429 });
    }

    // Generate and save code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    db.prepare(
      'INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)'
    ).run(email, code, codeType, expiresAt);

    // Send email
    const sent = await sendVerificationEmail(email, code, codeType);
    if (!sent) {
      return NextResponse.json({ error: '验证码发送失败，请稍后再试' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '验证码已发送到您的邮箱' });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}
