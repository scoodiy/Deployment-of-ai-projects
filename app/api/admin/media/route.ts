import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { apiSuccess } from '@/lib/api/response';

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const fileType = searchParams.get('type');
  const keyword = searchParams.get('keyword');
  const offset = (page - 1) * limit;

  const db = getDb();
  let query = 'SELECT * FROM media_files';
  let countQuery = 'SELECT COUNT(*) as total FROM media_files';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (fileType) {
    conditions.push('file_type = ?');
    params.push(fileType);
  }
  if (keyword) {
    conditions.push('(original_name LIKE ? OR alt_text LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const total = (db.prepare(countQuery).get(...params) as Record<string, number>).total;
  const files = db.prepare(query).all(...params, limit, offset);

  return apiSuccess({
    files,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
