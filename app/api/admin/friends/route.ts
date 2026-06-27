import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

// GET /api/admin/friends — 返回全部友链
export const GET = withAdminAuth(async (_request) => {
  const db = getDb();
  const friends = db.prepare('SELECT * FROM friends ORDER BY sort_order ASC, created_at DESC').all();
  return NextResponse.json({ friends });
});

// POST /api/admin/friends — 新增友链
export const POST = withAdminAuth(async (request, admin) => {
  const body = await request.json();
  const { name, url, description, avatar, theme_color, sort_order, is_enabled } = body;

  if (!name || !url) {
    return NextResponse.json({ error: '名称和URL必填' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO friends (name, url, description, avatar, theme_color, sort_order, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, url, description || '', avatar || '', theme_color || 'rgba(99, 102, 241, 0.5)', sort_order || 0, is_enabled !== false ? 1 : 0);

  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'create', 'friend', result.lastInsertRowid, `添加友链: ${name}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true, id: result.lastInsertRowid });
});
