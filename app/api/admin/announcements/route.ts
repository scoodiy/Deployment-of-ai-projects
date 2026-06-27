import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

// GET /api/admin/announcements — 返回全部公告
export const GET = withAdminAuth(async (_request) => {
  const db = getDb();
  const announcements = db.prepare('SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC').all();
  return NextResponse.json({ announcements });
});

// POST /api/admin/announcements — 新增公告
export const POST = withAdminAuth(async (request, admin) => {
  const body = await request.json();
  const { title, content, type, is_important, is_pinned, status, publish_at, end_at, display_scope } = body;

  if (!title) {
    return NextResponse.json({ error: '标题必填' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO announcements (title, content, type, is_important, is_pinned, status, publish_at, end_at, display_scope)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    content || '',
    type || 'notice',
    is_important ? 1 : 0,
    is_pinned ? 1 : 0,
    status || 'draft',
    publish_at || null,
    end_at || null,
    display_scope || 'all'
  );

  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'create', 'announcement', result.lastInsertRowid, `添加公告: ${title}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true, id: result.lastInsertRowid });
});
