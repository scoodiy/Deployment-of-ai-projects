import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const configs = db.prepare('SELECT config_key, config_value FROM site_config').all();
    return NextResponse.json({ configs });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load site config:', error);
    }
    return NextResponse.json({ configs: [] });
  }
}
