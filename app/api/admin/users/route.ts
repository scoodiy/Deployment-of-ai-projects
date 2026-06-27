import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { apiSuccess } from '@/lib/api/response';

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const role = searchParams.get('role') || '';
  const sortBy = searchParams.get('sort') || 'created_at';
  const sortOrder = searchParams.get('order') || 'DESC';
  const offset = (page - 1) * limit;

  const db = getDb();
  let query = 'SELECT id, username, email, nickname, avatar, role, status, created_at, last_login_at, login_count FROM users';
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push('(username LIKE ? OR email LIKE ? OR nickname LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }

  const allowedSorts = ['created_at', 'last_login_at', 'username', 'email'];
  const sortColumn = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${sortColumn} ${order} LIMIT ? OFFSET ?`;

  const total = (db.prepare(countQuery).get(...params) as Record<string, number>).total;
  const users = db.prepare(query).all(...params, limit, offset);

  return apiSuccess({
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
