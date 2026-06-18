import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';
import { idempotentBan } from '@/lib/concurrency';
import { rateLimitMiddleware } from '@/lib/rate-limit';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // 限流检查
  const rateCheck = rateLimitMiddleware('global', request, String(admin.adminId));
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  const { id } = await params;
  const db = getDb();
  const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!targetUser) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  // 不能封禁自己
  if (Number(id) === admin.adminId) {
    return NextResponse.json({ error: '不能封禁自己' }, { status: 400 });
  }

  // 不能封禁超级管理员
  if (targetUser.role === 'super_admin') {
    return NextResponse.json({ error: '不能封禁超级管理员' }, { status: 403 });
  }

  // 普通管理员不能封禁管理员
  if (targetUser.role === 'admin' && admin.role !== 'super_admin') {
    return NextResponse.json({ error: '无权封禁管理员' }, { status: 403 });
  }

  try {
    const { reason } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // 使用幂等封禁函数
    const result = idempotentBan(Number(id), reason || '', admin.adminId, ip);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      already_banned: result.alreadyBanned || false,
    });
  } catch (error) {
    console.error('Ban user error:', error);
    return NextResponse.json({ error: '封禁失败' }, { status: 500 });
  }
}
