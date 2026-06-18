import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const music = db.prepare('SELECT * FROM music ORDER BY sort_order ASC, created_at DESC').all();
  return NextResponse.json({ music });
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, artist, url, cover_image, duration, sort_order, is_background, is_enabled } = body;

    if (!title || !url) {
      return NextResponse.json({ error: '标题和URL必填' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO music (title, artist, url, cover_image, duration, sort_order, is_background, is_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, artist || '', url, cover_image || '', duration || 0, sort_order || 0, is_background ? 1 : 0, is_enabled !== false ? 1 : 0);

    // Log operation
    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'create', 'music', result.lastInsertRowid, `添加音乐: ${title}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create music error:', error);
    return NextResponse.json({ error: '添加音乐失败' }, { status: 500 });
  }
}
