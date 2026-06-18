import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';

export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const adminData = db.prepare('SELECT id, username, nickname, avatar, role, created_at, last_login_at FROM admins WHERE id = ?').get(admin.adminId);

  return NextResponse.json({ admin: adminData });
}
