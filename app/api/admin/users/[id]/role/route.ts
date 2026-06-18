import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 修改用户角色
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // 只有超级管理员才能修改角色
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: '只有超级管理员才能修改用户角色' }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();

  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: '无效的角色，可选: user/admin/super_admin' }, { status: 400 });
    }

    // 检查用户是否存在
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 不能修改自己的角色
    if (Number(id) === admin.adminId) {
      return NextResponse.json({ error: '不能修改自己的角色' }, { status: 400 });
    }

    db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, id);

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'change_role', 'user', id, `修改用户角色: ${user.username} -> ${role}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, message: `用户角色已更新为 ${role}` });
  } catch (error) {
    console.error('Change role error:', error);
    return NextResponse.json({ error: '修改失败' }, { status: 500 });
  }
}