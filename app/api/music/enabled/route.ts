import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const music = db.prepare('SELECT id, title, artist, url, cover_image, duration, is_background FROM music WHERE is_enabled = 1 ORDER BY sort_order ASC').all();
  return NextResponse.json({ music });
}
