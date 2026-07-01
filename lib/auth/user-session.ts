import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyUserToken } from './user';

/**
 * 检查用户是否已登录
 * @returns 已登录返回用户 payload，未登录返回 null
 */
export async function checkUserAuth(): Promise<Record<string, unknown> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('user_token')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyUserToken(token);
}

/**
 * 要求用户已登录，否则重定向到登录页
 * @returns 已登录返回用户 payload
 */
export async function requireUserAuth(): Promise<Record<string, unknown>> {
  const user = await checkUserAuth();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}