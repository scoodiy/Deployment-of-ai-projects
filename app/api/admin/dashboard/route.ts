import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdminAuth } from '@/lib/auth/with-admin-auth';

export const GET = withAdminAuth(async (_request) => {
  const db = getDb();

  const totalBlogs = db.prepare('SELECT COUNT(*) as count FROM blogs').get() as Record<string, number>;
  const publishedBlogs = db.prepare("SELECT COUNT(*) as count FROM blogs WHERE status = 'published'").get() as Record<string, number>;
  const draftBlogs = db.prepare("SELECT COUNT(*) as count FROM blogs WHERE status = 'draft'").get() as Record<string, number>;
  const totalMedia = db.prepare('SELECT COUNT(*) as count FROM media_files').get() as Record<string, number>;
  const totalMusic = db.prepare('SELECT COUNT(*) as count FROM music').get() as Record<string, number>;
  const recentLogs = db.prepare(`
    SELECT ol.*, a.username, a.nickname 
    FROM operation_logs ol 
    LEFT JOIN admins a ON ol.admin_id = a.id 
    ORDER BY ol.created_at DESC 
    LIMIT 10
  `).all();

  const lastBlogUpdate = db.prepare('SELECT updated_at FROM blogs ORDER BY updated_at DESC LIMIT 1').get() as Record<string, unknown> | undefined;

  return NextResponse.json({
    stats: {
      totalBlogs: totalBlogs.count,
      publishedBlogs: publishedBlogs.count,
      draftBlogs: draftBlogs.count,
      totalMedia: totalMedia.count,
      totalMusic: totalMusic.count,
      lastBlogUpdate: lastBlogUpdate?.updated_at || null,
    },
    recentLogs,
  });
});
