const TOKEN_NAME = 'user_token';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

function secureAttribute(): string {
  return process.env.NODE_ENV === 'production' ? '; Secure' : '';
}

export function setUserTokenCookie(token: string): string {
  return `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${secureAttribute()}; Max-Age=${TOKEN_MAX_AGE}`;
}

export function clearUserTokenCookie(): string {
  return `${TOKEN_NAME}=; Path=/; HttpOnly; SameSite=Lax${secureAttribute()}; Max-Age=0`;
}
