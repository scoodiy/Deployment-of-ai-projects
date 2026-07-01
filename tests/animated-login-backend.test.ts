import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const animatedLoginPath = path.join(process.cwd(), 'public', 'animated-login');
const assetsPath = path.join(animatedLoginPath, 'assets');

function readAnimatedLoginBundle() {
  const jsFile = readdirSync(assetsPath).find((name) => name.endsWith('.js'));
  assert.ok(jsFile, 'animated login JavaScript bundle should exist');
  return readFileSync(path.join(assetsPath, jsFile), 'utf8');
}

test('animated login page uses site user APIs for login, registration, and verification codes', () => {
  const bundle = readAnimatedLoginBundle();

  assert.match(bundle, /\/api\/user\/login/);
  assert.match(bundle, /\/api\/user\/register/);
  assert.match(bundle, /\/api\/user\/send-code/);
  assert.match(bundle, /window\.parent\.location\.href/);
});

test('animated login page does not expose the demo Google login button', () => {
  const bundle = readAnimatedLoginBundle();
  const index = readFileSync(path.join(animatedLoginPath, 'index.html'), 'utf8');

  assert.doesNotMatch(bundle, /Log in with Google/);
  assert.doesNotMatch(bundle, /Google Sign In/);
  assert.doesNotMatch(index, /Log in with Google/);
});

test('animated login page is localized to Chinese and removes the lower-left footer links', () => {
  const bundle = readAnimatedLoginBundle();

  assert.match(bundle, /欢迎回来/);
  assert.match(bundle, /登录/);
  assert.match(bundle, /注册/);
  assert.match(bundle, /发送验证码/);
  assert.doesNotMatch(bundle, /Privacy Policy/);
  assert.doesNotMatch(bundle, /Terms of Service/);
  assert.doesNotMatch(bundle, /Welcome back/);
  assert.doesNotMatch(bundle, /Remember for 30 days/);
  assert.doesNotMatch(bundle, /Forgot password/);
});

test('animated login page offers direct guest entry with desktop and mobile-specific labels', () => {
  const bundle = readAnimatedLoginBundle();

  assert.match(bundle, /直接访问/);
  assert.match(bundle, /立即访问/);
  assert.match(bundle, /y悠悠/);
  assert.match(bundle, /mobile-direct-link/);
  assert.match(bundle, /sessionStorage\.setItem\("animated-login-entered","1"\)/);
  assert.match(bundle, /sessionStorage\.setItem\("curtain-played","1"\)/);
  assert.match(bundle, /postMessage\(\{type:"animated-login-enter"\}/);
  assert.match(bundle, /window\.parent\.location\.href/);
  assert.match(bundle, /href:"\/home"/);
  assert.doesNotMatch(bundle, /趣味登录/);
});

test('login route listens for animated login direct-entry messages', () => {
  const page = readFileSync(path.join(process.cwd(), 'app', 'login', 'page.tsx'), 'utf8');
  const client = readFileSync(path.join(process.cwd(), 'app', 'login', 'LoginPageClient.tsx'), 'utf8');

  assert.match(page, /LoginPageClient/);
  assert.match(client, /addEventListener\('message'/);
  assert.match(client, /animated-login-enter/);
  assert.match(client, /router\.replace\('\/home'\)/);
  assert.match(client, /sessionStorage\.setItem\('animated-login-entered', '1'\)/);
  assert.match(client, /sessionStorage\.setItem\('curtain-played', '1'\)/);
});
