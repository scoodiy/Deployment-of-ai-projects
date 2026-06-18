import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 获取用户的风险标记
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  const risks = db.prepare(`
    SELECT * FROM user_risk_flags 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(id);

  return NextResponse.json({ risks });
}

// 添加风险标记
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();

  try {
    const body = await request.json();
    const { risk_type, reason } = body;

    if (!risk_type) {
      return NextResponse.json({ error: '风险类型不能为空' }, { status: 400 });
    }

    // 检查用户是否存在
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const result = db.prepare('INSERT INTO user_risk_flags (user_id, risk_type, reason) VALUES (?, ?, ?)').run(id, risk_type, reason || '');

    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'add_risk', 'user', id, `添加风险标记: ${risk_type}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ 
      success: true, 
      risk: { id: result.lastInsertRowid, risk_type, reason, status: 'active' }
    });
  } catch (error) {
    console.error('Add risk error:', error);
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}