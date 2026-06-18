import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// PUT /api/admin/comments/[id] — 修改状态
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

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
    admin.adminId, 'update', 'comment', id, `修改评论状态: ${status}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/comments/[id] — 管理员删除任意评论
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(Number(id));
  if (!comment) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(Number(id));

  // Log operation
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    admin.adminId, 'delete', 'comment', id, '删除评论', request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
}
