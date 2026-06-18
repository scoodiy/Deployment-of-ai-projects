import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

// GET /api/admin/projects — 返回全部项目
export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC').all();
  return NextResponse.json({ projects });
}

// POST /api/admin/projects — 新增项目
export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, icon, github_url, tags, sort_order, is_enabled } = body;

    if (!name) {
      return NextResponse.json({ error: '项目名称必填' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO projects (name, description, icon, github_url, tags, sort_order, is_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description || '', icon || '🚀', github_url || '', tags || '[]', sort_order || 0, is_enabled !== false ? 1 : 0);

    db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
      admin.adminId, 'create', 'project', result.lastInsertRowid, `添加项目: ${name}`, request.headers.get('x-forwarded-for') || 'unknown'
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: '添加项目失败' }, { status: 500 });
  }
}
