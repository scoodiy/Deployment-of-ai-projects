import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { apiSuccess, getIp } from '@/lib/api/response';

export const GET = withAdminAuth(async () => {
  const db = getDb();
  const configs = db.prepare('SELECT * FROM site_config ORDER BY id ASC').all();
  return apiSuccess({ configs });
});

export const PUT = withAdminAuth(async (request, admin) => {
  const body = await request.json();
  const db = getDb();

  const ip = getIp(request);
  const updateTransaction = db.transaction(() => {
    const updateStmt = db.prepare(`
      INSERT INTO site_config (config_key, config_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(config_key) DO UPDATE SET
        config_value = excluded.config_value,
        updated_at = CURRENT_TIMESTAMP
    `);
    const updates = Object.entries(body).filter(([k]) => !k.startsWith('_')) as [string, string][];

    for (const [key, value] of updates) {
      updateStmt.run(key, String(value));
    }

    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, detail, ip) VALUES (?, ?, ?, ?, ?)').run(
      Number(admin.adminId), 'update', 'site_config', `更新网站配置: ${updates.length}项`, ip
    );
  });

  updateTransaction();
  return apiSuccess(null, '配置更新成功');
});
