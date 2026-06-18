import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';
import { rateLimitMiddleware, getClientIp } from '@/lib/rate-limit';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/flac'],
  video: ['video/mp4', 'video/webm'],
  document: ['application/pdf'],
};

const MAX_SIZE: Record<string, number> = {
  image: 10 * 1024 * 1024,   // 10MB
  audio: 20 * 1024 * 1024,   // 20MB
  video: 50 * 1024 * 1024,   // 50MB
  document: 10 * 1024 * 1024, // 10MB
};

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

export async function POST(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // 限流检查：每天最多10次上传
  const ip = getClientIp(request);
  const rateCheck = rateLimitMiddleware('upload', request, String(admin.adminId));
  if (rateCheck.blocked) {
    return rateCheck.response;
  }

  let filePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const usageType = (formData.get('usage_type') as string) || 'other';

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    // 文件类型验证
    const category = getFileCategory(file.type);
    const allowedMimes = ALLOWED_TYPES[category] || [];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json({
        error: `不支持的文件类型: ${file.type}。支持: ${allowedMimes.join(', ')}`,
      }, { status: 400 });
    }

    // 文件大小验证
    const maxSize = MAX_SIZE[category] || 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `文件大小超过限制(${Math.round(maxSize / 1024 / 1024)}MB)`,
      }, { status: 400 });
    }

    // UUID文件名（避免并发冲突和文件名注入）
    const ext = path.extname(file.name).toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9.]/g, '');
    const filename = `${randomUUID()}${safeExt}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    filePath = path.join(uploadDir, filename);

    // 先写文件
    await writeFile(filePath, buffer);

    // 再写数据库（如果DB写入失败，清理文件）
    const db = getDb();
    try {
      const result = db.prepare(`
        INSERT INTO media_files (file_type, filename, original_name, url, size, mime_type, usage_type, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(category, filename, file.name, `/uploads/${filename}`, file.size, file.type, usageType, admin.adminId);

      // 操作日志
      db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
        admin.adminId, 'upload', 'media', result.lastInsertRowid,
        `上传文件: ${file.name} (${category}, ${Math.round(file.size / 1024)}KB)`,
        ip
      );

      return NextResponse.json({
        success: true,
        id: result.lastInsertRowid,
        url: `/uploads/${filename}`,
        filename,
      });
    } catch (dbError) {
      // DB写入失败，清理已上传文件
      if (filePath) {
        try { await unlink(filePath); } catch {}
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
