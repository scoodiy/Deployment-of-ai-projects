import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

// 标记风险为已解决
export const PUT = withAdminAuth(async (request, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const db = getDb();

  // 检查风险标记是否存在
  const risk = db.prepare('SELECT * FROM user_risk_flags WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!risk) {
    return NextResponse.json({ error: '风险标记不存在' }, { status: 404 });
  }

  if (risk.status === 'resolved') {
    return NextResponse.json({ error: '风险已标记为解决' }, { status: 400 });
  }

  db.prepare('UPDATE user_risk_flags SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?').run('resolved', id);

  // 写入操作日志
  db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
    Number(admin.adminId), 'resolve_risk', 'user', risk.user_id, `标记风险为已解决: ${risk.risk_type}`, request.headers.get('x-forwarded-for') || 'unknown'
  );

  return NextResponse.json({ success: true, message: '风险已标记为解决' });
});
