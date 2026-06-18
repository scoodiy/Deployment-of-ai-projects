import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// GET /api/admin/friends — 返回全部友链
export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const friends = db.prepare('SELECT * FROM friends ORDER BY sort_order ASC, created_at DESC').all();
  return NextResponse.json({ friends });
}

// POST /api/admin/friends — 新增友链
export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
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
      admin.adminId, 'create', 'friend', result.lastInsertRowid, `添加友链: ${name}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create friend error:', error);
    return NextResponse.json({ error: '添加友链失败' }, { status: 500 });
  }
}
