import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 获取用户统计信息
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  try {
    // 检查用户是否存在
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取各种统计
    const loginCount = db.prepare('SELECT login_count FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    
    const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE user_id = ?').get(id) as Record<string, unknown>;
    
    const favoriteCount = db.prepare('SELECT COUNT(*) as count FROM favorites WHERE user_id = ?').get(id) as Record<string, unknown>;
    
    const likeCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE user_id = ?').get(id) as Record<string, unknown>;
    
    const banCount = db.prepare('SELECT COUNT(*) as count FROM admin_operation_logs WHERE target_id = ? AND action LIKE ?').get(id, '%ban%') as Record<string, unknown>;

    const noteCount = db.prepare('SELECT COUNT(*) as count FROM user_admin_notes WHERE user_id = ?').get(id) as Record<string, unknown>;
    
    const riskCount = db.prepare('SELECT COUNT(*) as count FROM user_risk_flags WHERE user_id = ? AND status = ?').get(id, 'active') as Record<string, unknown>;

    return NextResponse.json({
      login_count: loginCount?.login_count || 0,
      comment_count: commentCount?.count || 0,
      favorite_count: favoriteCount?.count || 0,
      like_count: likeCount?.count || 0,
      ban_count: banCount?.count || 0,
      note_count: noteCount?.count || 0,
      risk_count: riskCount?.count || 0
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}