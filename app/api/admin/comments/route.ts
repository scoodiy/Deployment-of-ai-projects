import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { apiSuccess } from '@/lib/api/response';

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const db = getDb();
  let query = `
    SELECT c.*, u.nickname, u.avatar, u.username
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
  `;
  const params: string[] = [];

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query += ' WHERE c.status = ?';
    params.push(status);
  }

  query += ' ORDER BY c.created_at DESC';
  const comments = db.prepare(query).all(...params);

  return apiSuccess({ comments });
});
