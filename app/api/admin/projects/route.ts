import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

// GET /api/admin/projects — 返回全部项目
export const GET = withAdminAuth(async (_request) => {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC').all();
  return NextResponse.json({ projects });
});

// POST /api/admin/projects — 新增项目
export const POST = withAdminAuth(async (request, admin) => {
  const body = await request.json();
  const { name, description, icon, github_url, tags, sort_order, is_enabled } = body;

  if (!name) {
    return NextResponse.json({ error: '项目名称必填' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO projects (name, description, icon, github_url, tags, sort_order, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, description || '', icon || '🚀', github_url || '', tags || '[]', sort_order || 0, is_enabled !== false ? 1 : 0);

  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'create', 'project', result.lastInsertRowid, `添加项目: ${name}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true, id: result.lastInsertRowid });
});
