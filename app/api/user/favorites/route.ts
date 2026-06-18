import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/user';
import { idempotentFavorite, idempotentUnfavorite } from '@/lib/concurrency';
import { rateLimitMiddleware } from '@/lib/rate-limit';

// GET /api/user/favorites - 获取用户收藏列表
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('target_type') || 'blog';

  const { getDb } = await import('@/lib/db');
  const db = getDb();
  const favorites = db.prepare(
    'SELECT * FROM favorites WHERE user_id = ? AND target_type = ? ORDER BY created_at DESC'
  ).all(user.userId, targetType);

  return NextResponse.json({ favorites });
}

// POST /api/user/favorites - 收藏（幂等）
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

    const result = idempotentFavorite(user.userId, target_type, target_id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Favorite error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

// DELETE /api/user/favorites - 取消收藏（幂等）
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

    const result = idempotentUnfavorite(user.userId, target_type, target_id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Unfavorite error:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
