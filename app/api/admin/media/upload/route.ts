import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth/utils';
import { rateLimitMiddleware, getClientIp } from '@/lib/rate-limit';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import Busboy from 'busboy';
import { Readable } from 'stream';

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

/** 用 busboy 解析 multipart/form-data（绕过 Next.js 16 formData bug） */
function parseMultipart(request: Request): Promise<{ file: Buffer; filename: string; mimeType: string; usageType: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const contentType = request.headers.get('content-type') || '';
      const arrayBuffer = await request.arrayBuffer();
      const bodyBuffer = Buffer.from(arrayBuffer);

      // 将 Buffer 转为 Node Readable stream
      const readable = new Readable({
        read() {
          this.push(bodyBuffer);
          this.push(null);
        },
      });

      // 模拟 Node IncomingMessage headers
      (readable as any).headers = {};
      request.headers.forEach((value, key) => {
        (readable as any).headers[key.toLowerCase()] = value;
      });

      const bb = Busboy({ headers: (readable as any).headers, limits: { fileSize: 50 * 1024 * 1024 } });
      let fileBuffer: Buffer | null = null;
      let filename = '';
      let mimeType = '';
      let usageType = 'other';
      const chunks: Buffer[] = [];

      bb.on('file', (fieldname, fileStream, info) => {
        filename = info.filename || 'unknown';
        mimeType = info.mimeType || 'application/octet-stream';
        fileStream.on('data', (data: Buffer) => chunks.push(data));
        fileStream.on('end', () => { fileBuffer = Buffer.concat(chunks); });
      });

      bb.on('field', (name, value) => {
        if (name === 'usage_type') usageType = value;
      });

      bb.on('close', () => {
        if (!fileBuffer) {
          reject(new Error('请选择文件'));
        } else {
          resolve({ file: fileBuffer, filename, mimeType, usageType });
        }
      });

      bb.on('error', (err) => reject(err));
      readable.pipe(bb);
    } catch (err) {
      reject(err);
    }
  });
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
    const { file, filename: origFilename, mimeType, usageType } = await parseMultipart(request);

    // 文件类型验证
    const category = getFileCategory(mimeType);
    const allowedMimes = ALLOWED_TYPES[category] || [];
    if (!allowedMimes.includes(mimeType)) {
      return NextResponse.json({
        error: `不支持的文件类型: ${mimeType}。支持: ${allowedMimes.join(', ')}`,
      }, { status: 400 });
    }

    // 文件大小验证
    const maxSize = MAX_SIZE[category] || 10 * 1024 * 1024;
    if (file.length > maxSize) {
      return NextResponse.json({
        error: `文件大小超过限制(${Math.round(maxSize / 1024 / 1024)}MB)`,
      }, { status: 400 });
    }

    // UUID文件名（避免并发冲突和文件名注入）
    const ext = path.extname(origFilename).toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9.]/g, '');
    const filename = `${randomUUID()}${safeExt}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    await mkdir(uploadDir, { recursive: true });

    filePath = path.join(uploadDir, filename);

    // 先写文件
    await writeFile(filePath, file);

    // 再写数据库（如果DB写入失败，清理文件）
    const db = getDb();
    try {
      const result = db.prepare(`
        INSERT INTO media_files (file_type, filename, original_name, url, size, mime_type, usage_type, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(category, filename, origFilename, `/uploads/${filename}`, file.length, mimeType, usageType, admin.adminId);

      // 操作日志
      db.prepare('INSERT INTO operation_logs (admin_id, action, target_type, target_id, detail, ip) VALUES (?, ?, ?, ?, ?, ?)').run(
        admin.adminId, 'upload', 'media', result.lastInsertRowid,
        `上传文件: ${origFilename} (${category}, ${Math.round(file.length / 1024)}KB)`,
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
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || '上传失败' }, { status: 500 });
  }
}
