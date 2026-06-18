import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/projects — 公开接口，返回 is_enabled=1 的项目
export async function GET() {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects WHERE is_enabled = 1 ORDER BY sort_order ASC, created_at DESC').all();
  return NextResponse.json({ projects });
}
