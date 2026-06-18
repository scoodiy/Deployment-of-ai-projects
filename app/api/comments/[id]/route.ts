import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/user';

// DELETE /api/comments/[id] — 只能删除自己的评论
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(Number(id)) as Record<string, unknown> | undefined;

  if (!comment) {
    return NextResponse.json({ error: '评论不存在' }, { status: 404 });
  }

  if (comment.user_id !== user.userId) {
    return NextResponse.json({ error: '只能删除自己的评论' }, { status: 403 });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(Number(id));
  return NextResponse.json({ success: true });
}
