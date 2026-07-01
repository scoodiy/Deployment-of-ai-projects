import { getDb } from '@/lib/db';

export function checkUserNotBanned(userId: number): boolean {
  const db = getDb();
  const user = db.prepare('SELECT status FROM users WHERE id = ?').get(userId) as { status: string } | undefined;
  if (!user) return false; // 用户不存在也算未禁止
  return user.status !== 'banned';
}
