import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest, verifyPassword, hashPassword } from '@/lib/auth/utils';

export async function PUT(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '请输入旧密码和新密码' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码至少6位' }, { status: 400 });
    }

    const db = getDb();
    const adminData = db.prepare('SELECT password_hash FROM admins WHERE id = ?').get(admin.adminId) as Record<string, unknown>;

    const valid = await verifyPassword(oldPassword, adminData.password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: '旧密码错误' }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    db.prepare('UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, admin.adminId);

    // Log operation
    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, detail, ip) VALUES (?, ?, ?, ?, ?)').run(
      admin.adminId, 'update', 'admin', '修改管理员密码', request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: '修改密码失败' }, { status: 500 });
  }
}
