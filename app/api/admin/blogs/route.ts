import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { apiSuccess, apiError, getIp } from '@/lib/api/response';

export const GET = withAdminAuth(async (request, admin) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const keyword = searchParams.get('keyword');
  const offset = (page - 1) * limit;

  const db = getDb();
  let query = 'SELECT * FROM blogs';
  let countQuery = 'SELECT COUNT(*) as total FROM blogs';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (keyword) {
    conditions.push('(title LIKE ? OR summary LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const total = (db.prepare(countQuery).get(...params) as Record<string, number>).total;
  const blogs = db.prepare(query).all(...params, limit, offset);

  return apiSuccess({
    blogs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withAdminAuth(async (request, admin) => {
  const body = await request.json();
  const { title, slug, summary, content, cover_image, category, tags, status } = body;

  if (!title || !slug) {
    return apiError('MISSING_FIELDS', '标题和slug必填');
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM blogs WHERE slug = ?').get(slug);
  if (existing) {
    return apiError('DUPLICATE_SLUG', 'slug已存在');
  }

  const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
  const publishedAt = status === 'published' ? new Date().toISOString() : null;

  const result = db.prepare(`
    INSERT INTO blogs (title, slug, summary, content, cover_image, category, tags, status, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, slug, summary || '', content || '', cover_image || '', category || '', tagsStr, status || 'draft', publishedAt);

  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    admin.adminId, 'create', 'blog', result.lastInsertRowid, `创建博客: ${title}`, getIp(request)
  );

  return apiSuccess({ id: result.lastInsertRowid }, '博客创建成功');
});
