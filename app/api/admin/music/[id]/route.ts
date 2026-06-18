import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  db.prepare(`
    UPDATE music SET 
      title = COALESCE(?, title),
      artist = COALESCE(?, artist),
      url = COALESCE(?, url),
      cover_image = COALESCE(?, cover_image),
      duration = COALESCE(?, duration),
      sort_order = COALESCE(?, sort_order),
      is_background = COALESCE(?, is_background),
      is_enabled = COALESCE(?, is_enabled),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(body.title, body.artist, body.url, body.cover_image, body.duration, body.sort_order, body.is_background, body.is_enabled, id);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const music = db.prepare('SELECT title FROM music WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!music) {
    return NextResponse.json({ error: '音乐不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM music WHERE id = ?').run(id);

  // Log operation
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    admin.adminId, 'delete', 'music', id, `删除音乐: ${music.title}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
}
