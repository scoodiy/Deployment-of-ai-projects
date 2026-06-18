import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as total FROM operation_logs').get() as Record<string, number>).total;
  const logs = db.prepare(`
    SELECT ol.*, a.username, a.nickname 
    FROM operation_logs ol 
    LEFT JOIN admins a ON ol.admin_id = a.id 
    ORDER BY ol.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  return NextResponse.json({ logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
