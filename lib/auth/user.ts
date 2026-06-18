import { SignJWT, jwtVerify } from 'jose';
import bcryptjs from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.USER_JWT_SECRET || 'ayuu-fun-user-secret-key-2026'
);

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
    .sign(JWT_SECRET);
}

export async function verifyUserToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as Record<string, unknown>;
  } catch {
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
        token = tokenCookie.split('=')[1];
      }
    }
  }

  if (!token) return null;
  return verifyUserToken(token);
}
