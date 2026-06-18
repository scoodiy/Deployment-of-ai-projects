import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest, verifyPassword, hashPassword } from '@/lib/auth/user';

export async function PUT(request: Request) {
  const payload = await getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { old_password, new_password } = await request.json();

    if (!old_password || !new_password) {
      return NextResponse.json({ error: '请输入旧密码和新密码' }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: '新密码至少6位' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as Record<string, unknown> | undefined;

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    if (user.status === 'banned') {
      return NextResponse.json({ error: '账号已被封禁' }, { status: 403 });
    }

    const valid = await verifyPassword(old_password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: '旧密码错误' }, { status: 401 });
    }

    const newHash = await hashPassword(new_password);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, payload.userId);

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: '修改失败' }, { status: 500 });
  }
}
