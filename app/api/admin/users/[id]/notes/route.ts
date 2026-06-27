import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { safeError } from '@/lib/api/error-handler';

// 获取用户的管理员备注
export const GET = withAdminAuth<{ params: Promise<{ id: string }> }>(async (request, admin, { params }) => {
  const { id } = await params;
  const db = getDb();

  const notes = db.prepare(`
    SELECT n.*, a.username as admin_name 
    FROM user_admin_notes n
    LEFT JOIN admins a ON n.admin_id = a.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
  `).all(id);

  return NextResponse.json({ notes });
});

// 添加管理员备注
export const POST = withAdminAuth<{ params: Promise<{ id: string }> }>(async (request, admin, { params }) => {
  const { id } = await params;
  const db = getDb();

  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: '备注内容不能为空' }, { status: 400 });
    }

    // 检查用户是否存在
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const result = db.prepare('INSERT INTO user_admin_notes (user_id, admin_id, content) VALUES (?, ?, ?)').run(id, Number(admin.adminId), content);

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      Number(admin.adminId), 'add_note', 'user', id, `添加管理员备注`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ 
      success: true, 
      note: { id: result.lastInsertRowid, content, admin_name: admin.username }
    });
  } catch (error) {
    return safeError('添加失败', 500, error);
  }
});