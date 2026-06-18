import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 标记风险为已解决
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  try {
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
      admin.adminId, 'resolve_risk', 'user', risk.user_id, `标记风险为已解决: ${risk.risk_type}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, message: '风险已标记为解决' });
  } catch (error) {
    console.error('Resolve risk error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}