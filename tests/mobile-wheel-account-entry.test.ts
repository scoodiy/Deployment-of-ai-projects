import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navbarUrl = new URL('../components/Navbar.tsx', import.meta.url);
const loginPageUrl = new URL('../app/login/page.tsx', import.meta.url);

test('mobile wheel provides separate login and registration touch targets', async () => {
  const navbar = await readFile(navbarUrl, 'utf8');

  assert.match(navbar, /const mobileWheelRadius = 112;/);
  assert.match(navbar, /translateY\(-\$\{mobileWheelRadius\}px\)/);
  assert.match(navbar, /href="\/login\?mode=register"/);
  assert.match(navbar, /w-\[92px\] h-10/);
  assert.match(navbar, /w-\[292px\] h-\[292px\]/);
  assert.match(navbar, /w-12 h-12 -ml-6 -mt-6/);
  assert.doesNotMatch(
    navbar,
    /<span className="text-\[10px\] font-black">登录<\/span>\s*<span className="text-\[7px\] mt-0\.5">注册<\/span>/,
  );
});

test('mobile wheel side trigger is compact and does not dominate the screen edge', async () => {
  const navbar = await readFile(navbarUrl, 'utf8');

  assert.match(navbar, /w-8 h-20/);
  assert.match(navbar, /shadow-\[-3px_0_14px_rgba\(99,102,241,0\.32\)\]/);
  assert.match(navbar, /w-1 h-1/);
  assert.doesNotMatch(navbar, /w-12 h-28/);
});

test('login page embeds the animated characters login experience', async () => {
  const loginPage = await readFile(loginPageUrl, 'utf8');

  assert.match(loginPage, /src="\/animated-login\/index\.html"/);
  assert.doesNotMatch(loginPage, /useSearchParams/);
});
