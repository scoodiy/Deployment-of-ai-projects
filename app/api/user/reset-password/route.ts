import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth/user';
import { rateLimitMiddleware, getClientIp } from '@/lib/rate-limit';

// POST /api/user/reset-password - 重置密码
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = rateLimitMiddleware('reset_password', request, ip);
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  try {
    const { email, code, new_password } = await request.json();

    if (!email || !code || !new_password) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    const db = getDb();

    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      return NextResponse.json({ error: '该邮箱未注册' }, { status: 400 });
    }

    // Verify code
    const validCode = db.prepare(
      "SELECT id FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND used = 0 AND expires_at > datetime('now')"
    ).get(email, code, 'reset_password');

    if (!validCode) {
      return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
    }

    // Mark code as used
    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(validCode.id);

    // Update password
    const passwordHash = await hashPassword(new_password);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?').run(passwordHash, email);

    return NextResponse.json({ success: true, message: '密码重置成功，请重新登录' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: '重置失败' }, { status: 500 });
  }
}
