import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// PUT /api/admin/friends/[id]
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  db.prepare(`
    UPDATE friends SET
      name = COALESCE(?, name),
      url = COALESCE(?, url),
      description = COALESCE(?, description),
      avatar = COALESCE(?, avatar),
      theme_color = COALESCE(?, theme_color),
      sort_order = COALESCE(?, sort_order),
      is_enabled = COALESCE(?, is_enabled),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(body.name, body.url, body.description, body.avatar, body.theme_color, body.sort_order, body.is_enabled, id);

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/friends/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const friend = db.prepare('SELECT name FROM friends WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!friend) {
    return NextResponse.json({ error: '友链不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM friends WHERE id = ?').run(id);

  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    admin.adminId, 'delete', 'friend', id, `删除友链: ${friend.name}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
}
