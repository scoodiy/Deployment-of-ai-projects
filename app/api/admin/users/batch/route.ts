import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 批量封禁用户
export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { user_ids, reason, action } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: '请选择用户' }, { status: 400 });
    }

    const db = getDb();
    let successCount = 0;
    let errorCount = 0;

    for (const userId of user_ids) {
      try {
        // 检查用户是否存在
        const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
        if (!user) {
          errorCount++;
          continue;
        }

        // 不能封禁超级管理员
        if (user.role === 'super_admin' && admin.role !== 'super_admin') {
          errorCount++;
          continue;
        }

        if (action === 'ban') {
          if (!reason) {
            errorCount++;
            continue;
          }
          db.prepare('UPDATE users SET status = ?, ban_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('banned', reason, userId);
          
          // 写入操作日志
          db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
            admin.adminId, 'batch_ban', 'user', userId, `批量封禁用户: ${user.username}`, request.headers.get('x-forwarded-for') || 'unknown'
          );
        } else if (action === 'unban') {
          db.prepare('UPDATE users SET status = ?, ban_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('active', '', userId);
          
          // 写入操作日志
          db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
            admin.adminId, 'batch_unban', 'user', userId, `批量解封用户: ${user.username}`, request.headers.get('x-forwarded-for') || 'unknown'
          );
        }
        successCount++;
      } catch (error) {
        console.error(`Batch operation error for user ${userId}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `操作完成: 成功 ${successCount} 个, 失败 ${errorCount} 个`,
      successCount,
      errorCount
    });
  } catch (error) {
    console.error('Batch operation error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}