import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-not-for-production'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and API login/logout endpoints
  if (pathname === '/admin/login' || pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
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

    // Verify JWT token
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      // Token is valid, pass admin info to downstream via headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-admin-id', String(payload.adminId || ''));
      requestHeaders.set('x-admin-role', String(payload.role || ''));
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      // Token is invalid or expired
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
