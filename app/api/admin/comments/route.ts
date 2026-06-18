import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// GET /api/admin/comments?status=approved
export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const db = getDb();
  let comments;
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    comments = db.prepare(`
      SELECT c.*, u.nickname, u.avatar, u.username
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = ?
      ORDER BY c.created_at DESC
    `).all(status);
  } else {
    comments = db.prepare(`
      SELECT c.*, u.nickname, u.avatar, u.username
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `).all();
  }

  return NextResponse.json({ comments });
}
