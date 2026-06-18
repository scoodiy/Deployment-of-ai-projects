import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 管理员可修改的字段
const ALLOWED_FIELDS = ['nickname', 'avatar', 'bio', 'signature', 'admin_remark', 'ai_daily_limit'];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, nickname, avatar, bio, signature, role, status, ban_reason, admin_remark, ai_daily_limit, must_change_password, last_login_at, created_at, updated_at FROM users WHERE id = ?').get(id);

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  return NextResponse.json({ user });
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

  // 权限检查：普通管理员不能修改超级管理员
  if (targetUser.role === 'super_admin' && admin.role !== 'super_admin') {
    return NextResponse.json({ error: '无权修改超级管理员' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updates: string[] = [];
    const values: (string | number)[] = [];

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(field === 'ai_daily_limit' ? Number(body[field]) : String(body[field]));
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: '没有需要更新的内容' }, { status: 400 });
    }

    values.push(Number(id));
    db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'update', 'user', id, `编辑用户资料: ${targetUser.username}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, message: '保存成功' });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
