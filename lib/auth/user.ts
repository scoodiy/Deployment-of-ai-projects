import { SignJWT, jwtVerify } from 'jose';
import bcryptjs from 'bcryptjs';

let userJwtSecret: Uint8Array | null = null;

function getUserJwtSecret(): Uint8Array {
  if (userJwtSecret) return userJwtSecret;

  const secret = process.env.USER_JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: USER_JWT_SECRET environment variable is required');
  }
  userJwtSecret = new TextEncoder().encode(secret);
  return userJwtSecret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export async function createUserToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getUserJwtSecret());
}

export async function verifyUserToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getUserJwtSecret());
    return payload as Record<string, unknown>;
  } catch (e) {
    console.error('User token verification error:', e);
    return null;
  }
}

export async function getUserFromRequest(request: Request): Promise<Record<string, unknown> | null> {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Check cookie if no header
  if (!token) {
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const tokenCookie = cookies.find(c => c.startsWith('user_token='));
      if (tokenCookie) {
        token = tokenCookie.split('=').slice(1).join('=');
      }
    }
  }

  if (!token) return null;
  return verifyUserToken(token);
}
