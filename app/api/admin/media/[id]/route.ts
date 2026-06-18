import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';
import { unlink } from 'fs/promises';
import path from 'path';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  db.prepare('UPDATE media_files SET usage_type = COALESCE(?, usage_type), alt_text = COALESCE(?, alt_text) WHERE id = ?').run(
    body.usage_type, body.alt_text, id
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const file = db.prepare('SELECT * FROM media_files WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!file) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  // Delete physical file
  try {
    await unlink(path.join(process.cwd(), 'public', file.url as string));
  } catch {}

  db.prepare('DELETE FROM media_files WHERE id = ?').run(id);

  // Log operation
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    admin.adminId, 'delete', 'media', id, `删除文件: ${file.original_name}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
}
