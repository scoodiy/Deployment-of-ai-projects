import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/user';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const usageType = (formData.get('usage_type') as string) || 'other';

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '只允许 jpg、png、webp、gif 格式' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 5MB' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const safeExt = ext.replace(/[^a-z0-9.]/g, '');
    const filename = `${randomUUID()}${safeExt}`;
    // 存放在 uploads/users/{userId}/ 下
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'users', String(payload.userId));

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const fileUrl = `/uploads/users/${payload.userId}/${filename}`;

    // 写入 media_files 表，关联 user_id
    const result = db.prepare(`
      INSERT INTO media_files (file_type, filename, original_name, url, size, mime_type, usage_type, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('image', filename, file.name, fileUrl, file.size, file.type, usageType, payload.userId);

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      url: fileUrl,
      filename,
    });
  } catch (error) {
    console.error('User upload error:', error);
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
