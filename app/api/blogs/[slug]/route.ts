import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  
  const blog = db.prepare("SELECT * FROM blogs WHERE slug = ? AND status = 'published'").get(slug) as Record<string, unknown> | undefined;
  
  if (!blog) {
    return NextResponse.json({ error: '博客不存在' }, { status: 404 });
  }

  // Increment view count
  db.prepare('UPDATE blogs SET view_count = view_count + 1 WHERE id = ?').run(blog.id);

  return NextResponse.json({ blog });
}
