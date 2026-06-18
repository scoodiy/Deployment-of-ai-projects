import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/user';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

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

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '只允许 jpg、jpeg、png、webp 格式' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 2MB' }, { status: 400 });
    }

    const ext = path.extname(file.name);
    const filename = `avatar_${payload.userId}_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatarUrl, payload.userId);

    return NextResponse.json({ success: true, url: avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500 });
  }
}
