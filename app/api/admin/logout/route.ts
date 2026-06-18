import { NextResponse } from 'next/server';
import { clearTokenCookie } from '@/lib/auth/utils';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.set('Set-Cookie', clearTokenCookie());
  return response;
}
