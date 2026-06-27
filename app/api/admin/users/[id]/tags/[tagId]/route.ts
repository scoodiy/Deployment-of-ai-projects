import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { safeError } from '@/lib/api/error-handler';

// 移除用户的标签
export const DELETE = withAdminAuth<{ params: Promise<{ id: string; tagId: string }> }>(async (request, admin, { params }) => {
  const { id, tagId } = await params;
  const db = getDb();

  try {
    // 检查关联是否存在
    const relation = db.prepare('SELECT id FROM user_tag_relations WHERE user_id = ? AND tag_id = ?').get(id, tagId);
    if (!relation) {
      return NextResponse.json({ error: '用户没有此标签' }, { status: 404 });
    }

    // 获取标签名称用于日志
    const tag = db.prepare('SELECT name FROM user_tags WHERE id = ?').get(tagId) as Record<string, unknown> | undefined;

    db.prepare('DELETE FROM user_tag_relations WHERE user_id = ? AND tag_id = ?').run(id, tagId);

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      Number(admin.adminId), 'remove_tag', 'user', id, `移除用户标签: ${tag?.name || tagId}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, message: '标签已移除' });
  } catch (error) {
    return safeError('移除失败', 500, error);
  }
});