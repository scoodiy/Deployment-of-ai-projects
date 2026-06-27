import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { safeError } from '@/lib/api/error-handler';
import { hashPassword } from '@/lib/auth/user';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const digits = '23456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(randomInt(chars.length));
  }
  result += digits.charAt(randomInt(digits.length));
  result = result.split('').sort(() => randomInt(2) - randomInt(2)).join('');
  return result;
}

export const PUT = withAdminAuth<{ params: Promise<{ id: string }> }>(async (request, admin, { params }) => {
  const { id } = await params;
  const db = getDb();
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!targetUser) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const newPassword = body.new_password || generateTempPassword();

    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      return NextResponse.json({ error: '密码至少8位且包含数字' }, { status: 400 });
    }

    const hash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, id);

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      Number(admin.adminId), 'reset_password', 'user', id, `重置密码: ${targetUser.username}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({
      success: true,
      message: '密码重置成功',
      temp_password: body.new_password ? undefined : newPassword,
    });
  } catch (error) {
    return safeError('重置失败', 500, error);
  }
});
