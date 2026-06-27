import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/user';

// 禁止用户修改的字段
const FORBIDDEN_FIELDS = ['id', 'username', 'password_hash', 'password', 'role', 'status', 'is_admin', 'is_superuser', 'is_active', 'created_at', 'updated_at', 'ai_quota'];

export async function GET(request: Request) {
  const payload = await getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  // 只查询安全字段，不暴露 password_hash
  const user = db.prepare('SELECT id, username, email, nickname, avatar, bio, signature, status, created_at FROM users WHERE id = ?').get(payload.userId);

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const payload = await getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as Record<string, unknown> | undefined;

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  if (user.status === 'banned') {
    return NextResponse.json({ error: '账号已被封禁，无法修改资料' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // 安全检查：拒绝包含禁止字段的请求
    const bodyKeys = Object.keys(body);
    const hasForbidden = bodyKeys.some(key => FORBIDDEN_FIELDS.includes(key));
    if (hasForbidden) {
      return NextResponse.json({ error: '包含不允许修改的字段' }, { status: 400 });
    }

    // 只允许修改这四个字段
    const ALLOWED_FIELDS = ['nickname', 'bio', 'signature', 'email'];
    const updates: string[] = [];
    const values: (string | null)[] = [];

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        // 邮箱需要检查唯一性
        if (field === 'email') {
          const email = String(body[field]);
          if (!email || !email.includes('@')) {
            return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
          }
          const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, payload.userId);
          if (existing) {
            return NextResponse.json({ error: '该邮箱已被使用' }, { status: 400 });
          }
        }
        updates.push(`${field} = ?`);
        values.push(String(body[field]));
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: '没有需要更新的内容' }, { status: 400 });
    }

    values.push(String(payload.userId));
    db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);

    return NextResponse.json({ success: true, message: '保存成功' });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Update profile error:', error);
    }
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}
