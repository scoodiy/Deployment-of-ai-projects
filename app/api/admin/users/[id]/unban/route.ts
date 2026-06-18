import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';
import { idempotentUnban } from '@/lib/concurrency';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!targetUser) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 使用幂等解封函数
    const result = idempotentUnban(Number(id), admin.adminId, ip);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      already_active: result.alreadyActive || false,
    });
  } catch (error) {
    console.error('Unban user error:', error);
    return NextResponse.json({ error: '解封失败' }, { status: 500 });
  }
}
