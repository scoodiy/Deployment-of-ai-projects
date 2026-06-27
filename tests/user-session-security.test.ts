import assert from 'node:assert/strict';
import test from 'node:test';

import { clearUserTokenCookie, setUserTokenCookie } from '../lib/auth/user-cookie.ts';

test('production user session cookies are secure and HTTP-only', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const cookie = setUserTokenCookie('signed-token');

  assert.match(cookie, /^user_token=signed-token;/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);

  process.env.NODE_ENV = previousNodeEnv;
});

test('clearing a user session retains the same security attributes', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const cookie = clearUserTokenCookie();

  assert.match(cookie, /Max-Age=0/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);

  process.env.NODE_ENV = previousNodeEnv;
});
