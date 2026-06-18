import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/user';

// GET /api/comments?target_type=music&target_id=0
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('target_type');
  const targetId = searchParams.get('target_id');

  if (!targetType || targetId === null) {
    return NextResponse.json({ error: '缺少 target_type 或 target_id' }, { status: 400 });
  }

  const db = getDb();
  const comments = db.prepare(`
    SELECT c.id, c.user_id, c.target_type, c.target_id, c.content, c.parent_id, c.status, c.created_at, c.updated_at,
           u.nickname, u.avatar, u.username
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.target_type = ? AND c.target_id = ? AND c.status = 'approved'
    ORDER BY c.created_at DESC
  `).all(targetType, Number(targetId));

  return NextResponse.json({ comments });
}

// POST /api/comments
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '请先登录后评论' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { target_type, target_id, content, parent_id } = body;

    if (!target_type || target_id === undefined || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const validTypes = ['blog', 'media', 'music', 'friend', 'project'];
    if (!validTypes.includes(target_type)) {
      return NextResponse.json({ error: '无效的 target_type' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: '评论内容不能超过2000字' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO comments (user_id, target_type, target_id, content, parent_id, status)
      VALUES (?, ?, ?, ?, ?, 'approved')
    `).run(user.userId, target_type, Number(target_id), content.trim(), parent_id || null);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: '评论失败' }, { status: 500 });
  }
}
