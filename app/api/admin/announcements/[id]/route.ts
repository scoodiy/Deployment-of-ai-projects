import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

// PUT /api/admin/announcements/[id]
export const PUT = withAdminAuth(async (request, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  db.prepare(`
    UPDATE announcements SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      type = COALESCE(?, type),
      is_important = COALESCE(?, is_important),
      is_pinned = COALESCE(?, is_pinned),
      status = COALESCE(?, status),
      display_scope = COALESCE(?, display_scope),
      publish_at = ?,
      end_at = ?,
      version = version + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    body.title, body.content, body.type,
    body.is_important != null ? (body.is_important ? 1 : 0) : null,
    body.is_pinned != null ? (body.is_pinned ? 1 : 0) : null,
    body.status,
    body.display_scope,
    body.publish_at || null,
    body.end_at || null,
    id
  );

  return NextResponse.json({ success: true });
});

// DELETE /api/admin/announcements/[id]
export const DELETE = withAdminAuth(async (request, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const db = getDb();
  const announcement = db.prepare('SELECT title FROM announcements WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!announcement) {
    return NextResponse.json({ error: '公告不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM announcements WHERE id = ?').run(id);

  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'delete', 'announcement', id, `删除公告: ${announcement.title}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
});
