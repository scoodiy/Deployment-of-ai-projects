import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const user = db.prepare(
    'SELECT id, username, nickname, avatar, bio, signature, status, created_at FROM users WHERE id = ?'
  ).get(Number(id));

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  // Get comment count
  const commentCount = db.prepare(
    'SELECT COUNT(*) as cnt FROM comments WHERE user_id = ? AND status = ?'
  ).get(Number(id), 'approved') as { cnt: number };

  return NextResponse.json({
    user: {
      ...(user as Record<string, unknown>),
      comment_count: commentCount.cnt,
    },
  });
}
