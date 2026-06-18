import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// 获取所有标签
export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const tags = db.prepare('SELECT * FROM user_tags ORDER BY created_at DESC').all();
  return NextResponse.json({ tags });
}

// 创建标签
export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ error: '标签名不能为空' }, { status: 400 });
    }

    const db = getDb();
    
    // 检查标签名是否已存在
    const existing = db.prepare('SELECT id FROM user_tags WHERE name = ?').get(name);
    if (existing) {
      return NextResponse.json({ error: '标签名已存在' }, { status: 400 });
    }

    const result = db.prepare('INSERT INTO user_tags (name, color) VALUES (?, ?)').run(name, color || '#3B82F6');
    
    // 写入操作日志
    db.prepare('INSERT INTO admin_operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'create', 'tag', result.lastInsertRowid, `创建标签: ${name}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ 
      success: true, 
      tag: { id: result.lastInsertRowid, name, color: color || '#3B82F6' }
    });
  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}