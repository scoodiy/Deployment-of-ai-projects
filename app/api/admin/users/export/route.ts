import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { safeError } from '@/lib/api/error-handler';

// 导出用户数据为 CSV
export const GET = withAdminAuth(async (request, admin) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const role = searchParams.get('role') || '';

  const db = getDb();

  try {
    let query = 'SELECT id, username, email, nickname, role, status, last_login_at, created_at FROM users';
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push('(username LIKE ? OR email LIKE ? OR nickname LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const users = db.prepare(query).all(...params) as Record<string, unknown>[];

    // 生成 CSV
    const headers = ['ID', '用户名', '邮箱', '昵称', '角色', '状态', '最后登录', '注册时间'];
    const csvRows = [headers.join(',')];

    for (const user of users) {
      const row = [
        user.id,
        `"${(user.username as string || '').replace(/"/g, '""')}"`,
        `"${((user.email as string) ?? '').replace(/"/g, '""')}"`,
        `"${((user.nickname as string) || '').replace(/"/g, '""')}"`,
        user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : '普通用户',
        user.status === 'active' ? '正常' : '已封禁',
        user.last_login_at ? `"${user.last_login_at}"` : '""',
        `"${user.created_at}"`
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      Number(admin.adminId), 'export_users', 'user', 0, `导出用户数据: ${users.length} 条`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return safeError('导出失败', 500, error);
  }
});