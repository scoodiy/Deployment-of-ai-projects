import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { safeError } from '@/lib/api/error-handler';

// 批量添加/移除标签
export const POST = withAdminAuth(async (request, admin) => {
  try {
    const body = await request.json();
    const { user_ids, tag_id, action } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: '请选择用户' }, { status: 400 });
    }

    if (!tag_id) {
      return NextResponse.json({ error: '请选择标签' }, { status: 400 });
    }

    const db = getDb();

    // 检查标签是否存在
    const tag = db.prepare('SELECT id, name FROM user_tags WHERE id = ?').get(tag_id) as Record<string, unknown> | undefined;
    if (!tag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const userId of user_ids) {
      try {
        // 检查用户是否存在
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (!user) {
          errorCount++;
          continue;
        }

        if (action === 'add') {
          // 检查是否已添加
          const existing = db.prepare('SELECT id FROM user_tag_relations WHERE user_id = ? AND tag_id = ?').get(userId, tag_id);
          if (existing) {
            errorCount++;
            continue;
          }
          db.prepare('INSERT INTO user_tag_relations (user_id, tag_id) VALUES (?, ?)').run(userId, tag_id);
        } else if (action === 'remove') {
          db.prepare('DELETE FROM user_tag_relations WHERE user_id = ? AND tag_id = ?').run(userId, tag_id);
        }

        successCount++;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Batch tag operation error for user ${userId}:`, error);
        }
        errorCount++;
      }
    }

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      Number(admin.adminId), `batch_${action}_tag`, 'user', 0, `批量${action === 'add' ? '添加' : '移除'}标签: ${tag.name}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ 
      success: true, 
      message: `操作完成: 成功 ${successCount} 个, 失败 ${errorCount} 个`,
      successCount,
      errorCount
    });
  } catch (error) {
    return safeError('操作失败', 500, error);
  }
});