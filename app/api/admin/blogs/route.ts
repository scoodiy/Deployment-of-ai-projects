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

  return NextResponse.json({
    blogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug, summary, content, cover_image, category, tags, status } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: '标题和slug必填' }, { status: 400 });
    }

    const db = getDb();

    // Check slug uniqueness
    const existing = db.prepare('SELECT id FROM blogs WHERE slug = ?').get(slug);
    if (existing) {
      return NextResponse.json({ error: 'slug已存在' }, { status: 400 });
    }

    const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
    const publishedAt = status === 'published' ? new Date().toISOString() : null;

    const result = db.prepare(`
      INSERT INTO blogs (title, slug, summary, content, cover_image, category, tags, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, slug, summary || '', content || '', cover_image || '', category || '', tagsStr, status || 'draft', publishedAt);

    // Log operation
    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'create', 'blog', result.lastInsertRowid, `创建博客: ${title}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create blog error:', error);
    return NextResponse.json({ error: '创建博客失败' }, { status: 500 });
  }
}
