import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const offset = (page - 1) * limit;

  const db = getDb();
  let query = "SELECT id, title, slug, summary, cover_image, category, tags, view_count, published_at FROM blogs WHERE status = 'published'";
  let countQuery = "SELECT COUNT(*) as total FROM blogs WHERE status = 'published'";
  const params: (string | number)[] = [];

  if (category) {
    query += ' AND category = ?';
    countQuery += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';

  const total = (db.prepare(countQuery).get(...params) as Record<string, number>).total;
  const blogs = db.prepare(query).all(...params, limit, offset);

  return NextResponse.json({
    blogs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
