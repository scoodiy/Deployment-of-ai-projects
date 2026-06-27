import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = (page - 1) * limit;

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as total FROM operation_logs').get() as Record<string, number>).total;
  const logs = db.prepare(`
    SELECT ol.id, ol.admin_id, ol.action, ol.target_type, ol.target_id, ol.detail, ol.ip, ol.created_at, a.username, a.nickname 
    FROM operation_logs ol 
    LEFT JOIN admins a ON ol.admin_id = a.id 
    ORDER BY ol.created_at DESC 
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  return NextResponse.json({ logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
