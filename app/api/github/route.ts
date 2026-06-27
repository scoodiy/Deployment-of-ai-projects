import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { safeError } from '@/lib/api/error-handler';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://ayuu.fun',
  'https://www.ayuu.fun',
];

function validateReferer(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
    return true;
  }

  if (referer) {
    return ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed));
  }

  return false;
}

export async function POST(req: Request) {
  try {
    if (!validateReferer(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ip = getClientIp(req);
    const rateCheck = checkRateLimit('sendCode', `github-oauth:${ip}`);
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: rateCheck.message || '请求过于频繁，请稍后再试' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } }
      );
    }

    const body = await req.text();

    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    });

    const data = await githubRes.json();
    return NextResponse.json(data);

  } catch (error) {
    return safeError('代理请求失败', 500, error);
  }
}