import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createToken, setTokenCookie } from '@/lib/auth/utils';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '请输入用户名和密码' }, { status: 400 });
    }

    const db = getDb();
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as Record<string, unknown> | undefined;

    if (!admin) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // Update last login time
    db.prepare('UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(admin.id);

    // Create JWT token
    const token = await createToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    // Log operation
    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, detail, ip) VALUES (?, ?, ?, ?, ?)').run(
      admin.id, 'login', 'admin', '管理员登录', request.headers.get('x-forwarded-for') || 'unknown'
    );

    const response = NextResponse.json({
      success: true,
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
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
