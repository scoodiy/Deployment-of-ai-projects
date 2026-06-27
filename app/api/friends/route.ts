import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/friends — 公开接口，返回 is_enabled=1 的友链
export async function GET() {
  const db = getDb();
  const friends = db.prepare('SELECT * FROM friends WHERE is_enabled = 1 ORDER BY sort_order ASC, created_at DESC').all();
  return NextResponse.json({ friends });
}
