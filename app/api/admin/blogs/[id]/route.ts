import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { safeError } from '@/lib/api/error-handler';

export const GET = withAdminAuth<{ params: Promise<{ id: string }> }>(async (request, admin, { params }) => {
  const { id } = await params;
  const db = getDb();
  const blog = db.prepare('SELECT * FROM blogs WHERE id = ?').get(id);

  if (!blog) {
    return NextResponse.json({ error: '博客不存在' }, { status: 404 });
  }

  return NextResponse.json({ blog });
});

export const PUT = withAdminAuth<{ params: Promise<{ id: string }> }>(async (request, admin, { params }) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, summary, content, cover_image, category, tags, status, seo_title, seo_description, og_image } = body;

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
          seo_title = COALESCE(?, seo_title),
          seo_description = COALESCE(?, seo_description),
          og_image = COALESCE(?, og_image),
          published_at = ?,
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND version = ?
      `).run(title, slug, summary, content, cover_image, category, tagsStr, status, seo_title, seo_description, og_image, publishedAt, id, currentVersion);
      
      db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
        Number(admin.adminId), 'update', 'blog', id, `更新博客: ${title || blog.title}`, request.headers.get('x-forwarded-for') || 'unknown'
      );
    });
    
    updateTransaction();

    return NextResponse.json({ success: true });
  } catch (error) {
    return safeError('更新博客失败', 500, error);
  }
});

export const DELETE = withAdminAuth<{ params: Promise<{ id: string }> }>(async (request, admin, { params }) => {
  const { id } = await params;
  const db = getDb();
  const blog = db.prepare('SELECT title FROM blogs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!blog) {
    return NextResponse.json({ error: '博客不存在' }, { status: 404 });
  }

  db.prepare('DELETE FROM blogs WHERE id = ?').run(id);

  // Log operation
  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'delete', 'blog', id, `删除博客: ${blog.title}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true });
});
