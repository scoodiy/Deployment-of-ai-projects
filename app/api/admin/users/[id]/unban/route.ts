import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';
import { safeError } from '@/lib/api/error-handler';
import { idempotentUnban } from '@/lib/concurrency';

export const PUT = withAdminAuth<{ params: Promise<{ id: string }> }>(async (request, admin, { params }) => {
  const { id } = await params;
  const db = getDb();
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!targetUser) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 使用幂等解封函数
    const result = idempotentUnban(Number(id), Number(admin.adminId), ip);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      already_active: result.alreadyActive || false,
    });
  } catch (error) {
    return safeError('解封失败', 500, error);
  }
});
