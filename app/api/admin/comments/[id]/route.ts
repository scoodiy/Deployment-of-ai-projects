import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

// PUT /api/admin/comments/[id] — 修改状态
export const PUT = withAdminAuth<{ params: Promise<{ id: string }> }>(async (request, admin, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: '无效的状态值' }, { status: 400 });
  }

  const db = getDb();
  const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(Number(id));
  if (!comment) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 });
  }

  db.prepare('UPDATE comments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, Number(id));

  // Log operation
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'update', 'comment', id, `修改评论状态: ${status}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
});

// DELETE /api/admin/comments/[id] — 管理员删除任意评论
export const DELETE = withAdminAuth<{ params: Promise<{ id: string }> }>(async (request, admin, { params }) => {
  const { id } = await params;
  const db = getDb();
  const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(Number(id));
  if (!comment) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(Number(id));

  // Log operation
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'delete', 'comment', id, '删除评论', request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
});
