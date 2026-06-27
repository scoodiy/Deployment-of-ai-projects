import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth/utils';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

export const PUT = withAdminAuth(async (request, admin) => {
  const { oldPassword, newPassword } = await request.json();

  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: '请输入旧密码和新密码' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: '新密码至少8位' }, { status: 400 });
  }

  if (!/\d/.test(newPassword)) {
    return NextResponse.json({ error: '新密码必须包含至少一个数字' }, { status: 400 });
  }

  const db = getDb();
  const adminData = db.prepare('SELECT password_hash FROM admins WHERE id = ?').get(Number(admin.adminId)) as Record<string, unknown>;

  const valid = await verifyPassword(oldPassword, adminData.password_hash as string);
  if (!valid) {
    return NextResponse.json({ error: '旧密码错误' }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  db.prepare('UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, Number(admin.adminId));

  // Log operation
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, detail, ip) VALUES (?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'update', 'admin', '修改管理员密码', request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true, message: '密码修改成功' });
});
