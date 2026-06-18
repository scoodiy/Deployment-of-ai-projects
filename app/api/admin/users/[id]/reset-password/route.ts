import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';
import { hashPassword } from '@/lib/auth/user';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!targetUser) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const newPassword = body.new_password || generateTempPassword();

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    const hash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, id);

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'reset_password', 'user', id, `重置密码: ${targetUser.username}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({
      success: true,
      message: '密码重置成功',
      temp_password: body.new_password ? undefined : newPassword,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: '重置失败' }, { status: 500 });
  }
}
