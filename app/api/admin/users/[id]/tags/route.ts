import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 获取用户的标签
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const tags = db.prepare(`
    SELECT t.* FROM user_tags t
    JOIN user_tag_relations r ON t.id = r.tag_id
    WHERE r.user_id = ?
    ORDER BY t.name
  `).all(id);

  return NextResponse.json({ tags });
}

// 为用户添加标签
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  try {
    const body = await request.json();
    const { tag_id } = body;

    if (!tag_id) {
      return NextResponse.json({ error: '请选择标签' }, { status: 400 });
    }

    // 检查用户是否存在
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 检查标签是否存在
    const tag = db.prepare('SELECT id, name FROM user_tags WHERE id = ?').get(tag_id) as Record<string, unknown> | undefined;
    if (!tag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 });
    }

    // 检查是否已添加
    const existing = db.prepare('SELECT id FROM user_tag_relations WHERE user_id = ? AND tag_id = ?').get(id, tag_id);
    if (existing) {
      return NextResponse.json({ error: '用户已有此标签' }, { status: 400 });
    }

    db.prepare('INSERT INTO user_tag_relations (user_id, tag_id) VALUES (?, ?)').run(id, tag_id);

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'add_tag', 'user', id, `为用户添加标签: ${tag.name}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, message: '标签添加成功' });
  } catch (error) {
    console.error('Add tag error:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}