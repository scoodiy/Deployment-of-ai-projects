import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { apiSuccess, apiError, getIp } from '@/lib/api/response';

export const GET = withAdminAuth(async () => {
  const db = getDb();
  const configs = db.prepare('SELECT * FROM site_config ORDER BY id ASC').all();
  return apiSuccess({ configs });
});

export const PUT = withAdminAuth(async (request, admin) => {
  const body = await request.json();
  const db = getDb();

  // 乐观锁检查
  if (body._version !== undefined) {
    const firstConfig = db.prepare('SELECT version FROM site_config LIMIT 1').get() as Record<string, unknown> | undefined;
    if (firstConfig && firstConfig.version !== body._version) {
      return apiError('VERSION_CONFLICT', '配置已被其他人修改，请刷新后再编辑。', 409);
    }
  }

  const ip = getIp(request);
  const updateTransaction = db.transaction(() => {
    const updateStmt = db.prepare('UPDATE site_config SET config_value = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?');
    const updates = Object.entries(body).filter(([k]) => !k.startsWith('_')) as [string, string][];

    for (const [key, value] of updates) {
      updateStmt.run(String(value), key);
    }

    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, detail, ip) VALUES (?, ?, ?, ?, ?)').run(
      admin.adminId, 'update', 'site_config', `更新网站配置: ${updates.length}项`, ip
    );
  });

  updateTransaction();
  return apiSuccess(null, '配置更新成功');
});
