import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/announcements — 公开接口，返回当前有效的公告
export async function GET() {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE announcements SET status = 'offline', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'published' AND end_at IS NOT NULL AND end_at <= ?
  `).run(now);

  const announcements = db.prepare(`
    SELECT id, title, content, type, is_important, is_pinned, publish_at, end_at, version, display_scope
    FROM announcements
    WHERE status = 'published'
      AND (publish_at IS NULL OR publish_at <= ?)
      AND (end_at IS NULL OR end_at > ?)
    ORDER BY is_pinned DESC, publish_at DESC
  `).all(now, now);
  return NextResponse.json({ announcements });
}
