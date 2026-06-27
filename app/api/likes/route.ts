import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/user';
import { idempotentLike, idempotentUnlike } from '@/lib/concurrency';
import { getDb } from '@/lib/db';

// GET /api/likes?target_type=blog&target_id=1 - 获取点赞数 + 当前用户是否已点赞
export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetType = url.searchParams.get('target_type');
  const targetId = url.searchParams.get('target_id');

  if (!targetType || !targetId) {
    return NextResponse.json({ error: '缺少 target_type 或 target_id' }, { status: 400 });
  }

  const db = getDb();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM likes WHERE target_type = ? AND target_id = ?')
    .get(targetType, Number(targetId)) as Record<string, unknown>;
  const count = (countRow?.count as number) || 0;

  let liked = false;
  const user = await getUserFromRequest(request);
  if (user) {
    const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?')
      .get(Number(Number(user.userId)), targetType, Number(targetId));
    liked = !!existing;
  }

  return NextResponse.json({ count, liked });
}

// POST /api/likes - 点赞（幂等）
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  // 检查用户状态
  const { getDb } = await import('@/lib/db');
  const db = getDb();
  const userRecord = db.prepare('SELECT status FROM users WHERE id = ?').get(Number(Number(user.userId))) as Record<string, unknown> | undefined;
  if (!userRecord || userRecord.status === 'banned') {
    return NextResponse.json({ error: '账号已被封禁' }, { status: 403 });
  }

  try {
    const { target_type, target_id } = await request.json();
    if (!target_type || !target_id) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const result = idempotentLike(Number(Number(user.userId)), target_type, target_id);
    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Like error:', error);
    }
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

    const result = idempotentUnlike(Number(Number(user.userId)), target_type, target_id);
    return NextResponse.json(result);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Unlike error:', error);
    }
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
