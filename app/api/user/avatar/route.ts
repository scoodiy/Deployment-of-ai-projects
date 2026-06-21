import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/user';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import Busboy from 'busboy';
import { Readable } from 'stream';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function parseMultipart(request: Request): Promise<{ file: Buffer; filename: string; mimeType: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await request.arrayBuffer();
      const bodyBuffer = Buffer.from(arrayBuffer);

      const readable = new Readable({
        read() { this.push(bodyBuffer); this.push(null); },
      });

      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });
      (readable as any).headers = headers;

      const bb = Busboy({ headers, limits: { fileSize: MAX_SIZE } });
      let fileBuffer: Buffer | null = null;
      let filename = '';
      let mimeType = '';
      const chunks: Buffer[] = [];

      bb.on('file', (fieldname, fileStream, info) => {
        filename = info.filename || 'unknown';
        mimeType = info.mimeType || 'application/octet-stream';
        fileStream.on('data', (data: Buffer) => chunks.push(data));
        fileStream.on('end', () => { fileBuffer = Buffer.concat(chunks); });
      });

      bb.on('close', () => {
        if (!fileBuffer) reject(new Error('请选择文件'));
        else resolve({ file: fileBuffer, filename, mimeType });
      });

      bb.on('error', (err) => reject(err));
      readable.pipe(bb);
    } catch (err) { reject(err); }
  });
}

export async function POST(request: Request) {
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
    const { file, filename: origFilename, mimeType } = await parseMultipart(request);

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: '只允许 jpg、jpeg、png、webp 格式' }, { status: 400 });
    }

    if (file.length > MAX_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 2MB' }, { status: 400 });
    }

    const ext = path.extname(origFilename);
    const filename = `avatar_${payload.userId}_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), file);

    const avatarUrl = `/uploads/avatars/${filename}`;
    db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatarUrl, payload.userId);

    return NextResponse.json({ success: true, url: avatarUrl });
  } catch (error: any) {
    console.error('Upload avatar error:', error);
    return NextResponse.json({ error: error.message || '上传失败' }, { status: 500 });
  }
}
