import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

// PUT /api/admin/projects/[id]
export const PUT = withAdminAuth(async (request, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      icon = COALESCE(?, icon),
      github_url = COALESCE(?, github_url),
      tags = COALESCE(?, tags),
      sort_order = COALESCE(?, sort_order),
      is_enabled = COALESCE(?, is_enabled),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(body.name, body.description, body.icon, body.github_url, body.tags, body.sort_order, body.is_enabled, id);

  return NextResponse.json({ success: true });
});

// DELETE /api/admin/projects/[id]
export const DELETE = withAdminAuth(async (request, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const db = getDb();
  const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!project) {
    return NextResponse.json({ error: '项目不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);

  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'delete', 'project', id, `删除项目: ${project.name}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
});
