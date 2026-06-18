import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const configs = db.prepare('SELECT * FROM site_config ORDER BY id ASC').all();
  return NextResponse.json({ configs });
}

export async function PUT(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const db = getDb();

    // 乐观锁检查（如果前端传了version）
    if (body._version !== undefined) {
      // 检查任一配置项的版本
      const firstConfig = db.prepare('SELECT version FROM site_config LIMIT 1').get() as Record<string, unknown> | undefined;
      if (firstConfig && firstConfig.version !== body._version) {
        return NextResponse.json({ error: '配置已被其他人修改，请刷新后再编辑。' }, { status: 409 });
      }
    }

    // 事务：批量更新 + 版本递增 + 日志
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const updateTransaction = db.transaction(() => {
      const updateStmt = db.prepare('UPDATE site_config SET config_value = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?');
      const updates = Object.entries(body).filter(([k]) => !k.startsWith('_')) as [string, string][];
      
      for (const [key, value] of updates) {
        updateStmt.run(String(value), key);
      }

      // Log operation
      db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, detail, ip) VALUES (?, ?, ?, ?, ?)').run(
        admin.adminId, 'update', 'site_config', `更新网站配置: ${updates.length}项`, ip
      );
    });

    updateTransaction();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update site config error:', error);
    return NextResponse.json({ error: '更新配置失败' }, { status: 500 });
  }
}
