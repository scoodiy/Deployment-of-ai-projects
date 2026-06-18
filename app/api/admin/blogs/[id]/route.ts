import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const blog = db.prepare('SELECT * FROM blogs WHERE id = ?').get(id);

  if (!blog) {
    return NextResponse.json({ error: '博客不存在' }, { status: 404 });
  }

  return NextResponse.json({ blog });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, summary, content, cover_image, category, tags, status } = body;

    const db = getDb();
    const blog = db.prepare('SELECT * FROM blogs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!blog) {
      return NextResponse.json({ error: '博客不存在' }, { status: 404 });
    }

    // 乐观锁检查
    const currentVersion = (blog.version as number) || 1;
    if (body.version !== undefined && body.version !== currentVersion) {
      return NextResponse.json({ error: '内容已被其他人修改，请刷新后再编辑。' }, { status: 409 });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== blog.slug) {
      const existing = db.prepare('SELECT id FROM blogs WHERE slug = ? AND id != ?').get(slug, id);
      if (existing) {
        return NextResponse.json({ error: 'slug已存在' }, { status: 400 });
      }
    }

    const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
    const publishedAt = status === 'published' && blog.status !== 'published' ? new Date().toISOString() : blog.published_at;

    // 事务：更新博客 + 版本号递增 + 操作日志
    const updateTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE blogs SET 
          title = COALESCE(?, title),
          slug = COALESCE(?, slug),
          summary = COALESCE(?, summary),
          content = COALESCE(?, content),
          cover_image = COALESCE(?, cover_image),
          category = COALESCE(?, category),
          tags = COALESCE(?, tags),
          status = COALESCE(?, status),
          published_at = ?,
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND version = ?
      `).run(title, slug, summary, content, cover_image, category, tagsStr, status, publishedAt, id, currentVersion);
      
      db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
        admin.adminId, 'update', 'blog', id, `更新博客: ${title || blog.title}`, request.headers.get('x-forwarded-for') || 'unknown'
      );
    });
    
    updateTransaction();

    // Log operation
    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'update', 'blog', id, `更新博客: ${title || blog.title}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update blog error:', error);
    return NextResponse.json({ error: '更新博客失败' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const blog = db.prepare('SELECT title FROM blogs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!blog) {
    return NextResponse.json({ error: '博客不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM blogs WHERE id = ?').run(id);

  // Log operation
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    admin.adminId, 'delete', 'blog', id, `删除博客: ${blog.title}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
}
