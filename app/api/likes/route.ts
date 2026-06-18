import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/user';
import { idempotentLike, idempotentUnlike } from '@/lib/concurrency';

// POST /api/likes - 点赞（幂等）
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  // 检查用户状态
  const { getDb } = await import('@/lib/db');
  const db = getDb();
  const userRecord = db.prepare('SELECT status FROM users WHERE id = ?').get(user.userId) as Record<string, unknown> | undefined;
  if (!userRecord || userRecord.status === 'banned') {
    return NextResponse.json({ error: '账号已被封禁' }, { status: 403 });
  }

  try {
    const { target_type, target_id } = await request.json();
    if (!target_type || !target_id) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const result = idempotentLike(user.userId, target_type, target_id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

// DELETE /api/likes - 取消点赞（幂等）
export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  try {
    const { target_type, target_id } = await request.json();
    if (!target_type || !target_id) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const result = idempotentUnlike(user.userId, target_type, target_id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Unlike error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
