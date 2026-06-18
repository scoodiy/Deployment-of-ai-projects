import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 获取用户的管理员备注
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const notes = db.prepare(`
    SELECT n.*, a.username as admin_name 
    FROM user_admin_notes n
    LEFT JOIN admins a ON n.admin_id = a.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
  `).all(id);

  return NextResponse.json({ notes });
}

// 添加管理员备注
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: '备注内容不能为空' }, { status: 400 });
    }

    // 检查用户是否存在
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const result = db.prepare('INSERT INTO user_admin_notes (user_id, admin_id, content) VALUES (?, ?, ?)').run(id, admin.adminId, content);

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'add_note', 'user', id, `添加管理员备注`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ 
      success: true, 
      note: { id: result.lastInsertRowid, content, admin_name: admin.username }
    });
  } catch (error) {
    console.error('Add note error:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}