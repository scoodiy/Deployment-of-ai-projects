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
  const limit = parseInt(searchParams.get('limit') || '20');
  const fileType = searchParams.get('type');
  const offset = (page - 1) * limit;

  const db = getDb();
  let query = 'SELECT * FROM media_files';
  let countQuery = 'SELECT COUNT(*) as total FROM media_files';
  const params: (string | number)[] = [];

  if (fileType) {
    query += ' WHERE file_type = ?';
    countQuery += ' WHERE file_type = ?';
    params.push(fileType);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const total = (db.prepare(countQuery).get(...params) as Record<string, number>).total;
  const files = db.prepare(query).all(...params, limit, offset);

  return NextResponse.json({ files, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
