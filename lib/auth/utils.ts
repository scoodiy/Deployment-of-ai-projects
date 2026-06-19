import { SignJWT, jwtVerify } from 'jose';
import bcryptjs from 'bcryptjs';
import { cookies } from 'next/headers';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production');
    }
    return new TextEncoder().encode('dev-secret-key-not-for-production');
  }
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();

const TOKEN_NAME = 'admin_token';
const TOKEN_EXPIRY = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export async function createToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getTokenFromRequest(request: Request): Promise<string | null> {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Check cookie
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const tokenCookie = cookies.find(c => c.startsWith(`${TOKEN_NAME}=`));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }

  return null;
}

export async function getAdminFromRequest(request: Request): Promise<Record<string, unknown> | null> {
  const token = await getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export function setTokenCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${7 * 24 * 60 * 60}`;
}

export function clearTokenCookie(): string {
  return `${TOKEN_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
