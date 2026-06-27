import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

// 更新备注
export const PUT = withAdminAuth(async (request, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const db = getDb();

  const body = await request.json();
  const { content } = body;

  if (!content) {
    return NextResponse.json({ error: '备注内容不能为空' }, { status: 400 });
  }

  // 检查备注是否存在
  const note = db.prepare('SELECT * FROM user_admin_notes WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!note) {
    return NextResponse.json({ error: '备注不存在' }, { status: 404 });
  }

  db.prepare('UPDATE user_admin_notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(content, id);

  // 写入操作日志
  db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'update_note', 'user', note.user_id, `更新管理员备注`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true, message: '备注已更新' });
});

// 删除备注
export const DELETE = withAdminAuth(async (request, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const db = getDb();

  // 检查备注是否存在
  const note = db.prepare('SELECT * FROM user_admin_notes WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!note) {
    return NextResponse.json({ error: '备注不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM user_admin_notes WHERE id = ?').run(id);

  // 写入操作日志
  db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'delete_note', 'user', note.user_id, `删除管理员备注`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true, message: '备注已删除' });
});
