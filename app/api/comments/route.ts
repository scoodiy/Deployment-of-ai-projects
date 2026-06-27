import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/user';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const SENSITIVE_WORDS = [
  'fuck', 'shit', 'asshole', 'bitch', 'dick', 'porn', 'sex',
  '傻逼', '煞笔', '脑残', '废物', '蠢货', '白痴', '死全家',
  '代开发票', '办证', '刻章', '信用卡套现', '高利贷', '赌博',
  '六合彩', '时时彩', '赌场', '吸毒', '招嫖', '卖淫',
  '枪支', '炸药', '假币', '迷药', '窃听器', '跟踪器',
];

function filterSensitiveWords(text: string): { filtered: boolean; content: string } {
  let content = text;
  let filtered = false;
  for (const word of SENSITIVE_WORDS) {
    if (content.toLowerCase().includes(word.toLowerCase())) {
      content = content.replace(new RegExp(word, 'gi'), '***');
      filtered = true;
    }
  }
  return { filtered, content };
}

// GET /api/comments?target_type=music&target_id=0
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get('target_type');
  const targetId = searchParams.get('target_id');

  if (!targetType || targetId === null) {
    return NextResponse.json({ error: '缺少 target_type 或 target_id' }, { status: 400 });
  }

  const db = getDb();
  const comments = db.prepare(`
    SELECT c.id, c.user_id, c.target_type, c.target_id, c.content, c.parent_id, c.status, c.created_at, c.updated_at,
           u.nickname, u.avatar, u.username
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.target_type = ? AND c.target_id = ? AND c.status = 'approved'
    ORDER BY c.created_at DESC
  `).all(targetType, Number(targetId));

  return NextResponse.json({ comments });
}

// POST /api/comments
export async function POST(request: Request) {
  const ip = getClientIp(request);

  const ipLimit = checkRateLimit('commentIp', ip);
  if (ipLimit.limited) {
    return new Response(JSON.stringify({ error: ipLimit.message }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(ipLimit.retryAfter) },
    });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '请先登录后评论' }, { status: 401 });
  }

  const db = getDb();

  const userRecord = db.prepare('SELECT status FROM users WHERE id = ?').get(Number(user.userId)) as Record<string, unknown> | undefined;
  if (!userRecord) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }
  if (userRecord.status === 'banned') {
    return NextResponse.json({ error: '账号已被封禁，无法评论' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { target_type, target_id, content, parent_id } = body;

    if (!target_type || target_id === undefined || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const validTypes = ['blog', 'media', 'music', 'friend', 'project'];
    if (!validTypes.includes(target_type)) {
      return NextResponse.json({ error: '无效的 target_type' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: '评论内容不能超过1000字' }, { status: 400 });
    }

    const trimmedContent = content.trim();

    const dupCheck = checkRateLimit('commentDuplicate', `${Number(user.userId)}:${trimmedContent}`);
    if (dupCheck.limited) {
      return new Response(JSON.stringify({ error: dupCheck.message }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': String(dupCheck.retryAfter) },
      });
    }

    const { content: filteredContent } = filterSensitiveWords(trimmedContent);

    const needApproval = (db.prepare(
      "SELECT config_value FROM site_config WHERE config_key = 'comments_need_approval'"
    ).get() as { config_value?: string } | undefined)?.config_value === 'true';
    const status = needApproval ? 'pending' : 'approved';

    const result = db.prepare(`
      INSERT INTO comments (user_id, target_type, target_id, content, parent_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(Number(user.userId), target_type, Number(target_id), filteredContent, parent_id || null, status);

    return NextResponse.json({ success: true, id: result.lastInsertRowid, status });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Create comment error:', error);
    }
    return NextResponse.json({ error: '评论失败' }, { status: 500 });
  }
}
