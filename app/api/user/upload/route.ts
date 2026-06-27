import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/user';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import Busboy from 'busboy';
import { Readable } from 'stream';
import { hasValidFileSignature } from '@/lib/uploads/file-validation';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const CONTENT_LENGTH_LIMIT = 5 * 1024 * 1024; // 5MB

function parseMultipart(request: Request): Promise<{ file: Buffer; filename: string; mimeType: string; usageType: string }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });

    const bb = Busboy({ headers, limits: { fileSize: MAX_SIZE } });
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
      if (!fileBuffer) reject(new Error('请选择文件'));
      else resolve({ file: fileBuffer, filename, mimeType, usageType });
    });

    bb.on('error', (err) => reject(err));

    Readable.fromWeb(request.body as unknown as Parameters<typeof Readable.fromWeb>[0]).pipe(bb);
  });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Content-Length 预检查
  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > CONTENT_LENGTH_LIMIT) {
    return NextResponse.json({ error: '文件大小超过限制(5MB)' }, { status: 413 });
  }

  // IP 限流：每分钟最多 20 次上传
  const uploadRateCheck = checkRateLimit('upload', ip, {
    maxRequests: 20,
    windowSeconds: 60,
    keyPrefix: 'rl:upload:user:ip',
    errorMessage: '上传过于频繁，请稍后再试',
  });
  if (uploadRateCheck.limited) {
    return NextResponse.json({ error: uploadRateCheck.message }, {
      status: 429,
      headers: { 'Retry-After': String(uploadRateCheck.retryAfter) },
    });
  }

  const payload = await getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const user = db.prepare('SELECT status FROM users WHERE id = ?').get(payload.userId) as Record<string, unknown> | undefined;

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  if (user.status === 'banned') {
    return NextResponse.json({ error: '账号已被封禁' }, { status: 403 });
  }

  try {
    const { file, filename: origFilename, mimeType, usageType } = await parseMultipart(request);

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: '只允许 jpg、png、webp、gif 格式' }, { status: 400 });
    }

    if (!hasValidFileSignature(file, mimeType)) {
      return NextResponse.json({ error: '文件内容与声明的图片格式不匹配' }, { status: 400 });
    }

    if (file.length > MAX_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 5MB' }, { status: 400 });
    }

    const ext = path.extname(origFilename).toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9.]/g, '');
    const filename = `${randomUUID()}${safeExt}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'users', String(payload.userId));

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), file);

    const fileUrl = `/uploads/users/${payload.userId}/${filename}`;

    const result = db.prepare(`
      INSERT INTO media_files (file_type, filename, original_name, url, size, mime_type, usage_type, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('image', filename, origFilename, fileUrl, file.length, mimeType, usageType, payload.userId);

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      url: fileUrl,
      filename,
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('User upload error:', error);
    }
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}

// 用户查看自己的上传列表
export async function GET(request: Request) {
  const payload = await getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const db = getDb();
  const files = db.prepare('SELECT * FROM media_files WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(payload.userId);

  return NextResponse.json({ files });
}
