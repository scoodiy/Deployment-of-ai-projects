import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 删除标签
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  // 检查标签是否存在
  const tag = db.prepare('SELECT * FROM user_tags WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!tag) {
    return NextResponse.json({ error: '标签不存在' }, { status: 404 });
  }

  try {
    // 删除关联关系
    db.prepare('DELETE FROM user_tag_relations WHERE tag_id = ?').run(id);
    // 删除标签
    db.prepare('DELETE FROM user_tags WHERE id = ?').run(id);

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'delete', 'tag', id, `删除标签: ${tag.name}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, message: '标签已删除' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}