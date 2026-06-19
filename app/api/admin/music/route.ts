import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { apiSuccess, apiError, getIp } from '@/lib/api/response';

export const GET = withAdminAuth(async (request) => {
  const db = getDb();
  const music = db.prepare('SELECT * FROM music ORDER BY sort_order ASC, created_at DESC').all();
  return apiSuccess({ music });
});

export const POST = withAdminAuth(async (request, admin) => {
  const body = await request.json();
  const { title, artist, url, cover_image, duration, sort_order, is_background, is_enabled } = body;

  if (!title || !url) {
    return apiError('MISSING_FIELDS', '标题和URL必填');
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO music (title, artist, url, cover_image, duration, sort_order, is_background, is_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, artist || '', url, cover_image || '', duration || 0, sort_order || 0, is_background ? 1 : 0, is_enabled !== false ? 1 : 0);

  db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    admin.adminId, 'create', 'music', result.lastInsertRowid, `添加音乐: ${title}`, getIp(request)
  );

  return apiSuccess({ id: result.lastInsertRowid }, '音乐添加成功');
});
