import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and API login endpoint
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  // Allow /admin root (redirect handled by page)
  if (pathname === '/admin') {
    return NextResponse.next();
  }

  // Check admin routes
  if (pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')) {
    // Check cookie first
    const tokenFromCookie = request.cookies.get('admin_token')?.value;
    // Check Authorization header
    const authHeader = request.headers.get('Authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
