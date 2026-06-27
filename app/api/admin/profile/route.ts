import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

export const GET = withAdminAuth(async (request, admin) => {
  const db = getDb();
  const adminData = db.prepare('SELECT id, username, nickname, avatar, role, created_at, last_login_at FROM admins WHERE id = ?').get(Number(admin.adminId));

  return NextResponse.json({ admin: adminData });
});
