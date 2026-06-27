import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const navbarUrl = new URL('../components/Navbar.tsx', import.meta.url);
const loginPageUrl = new URL('../app/login/page.tsx', import.meta.url);

test('mobile wheel provides separate login and registration touch targets', async () => {
  const navbar = await readFile(navbarUrl, 'utf8');

  assert.match(navbar, /const mobileWheelRadius = 125;/);
  assert.match(navbar, /translateY\(-\$\{mobileWheelRadius\}px\)/);
  assert.match(navbar, /href="\/login\?mode=register"/);
  assert.match(navbar, /w-\[104px\] h-11/);
  assert.doesNotMatch(
    navbar,
    /<span className="text-\[10px\] font-black">登录<\/span>\s*<span className="text-\[7px\] mt-0\.5">注册<\/span>/,
  );
});

test('login page opens registration mode for the registration link', async () => {
  const loginPage = await readFile(loginPageUrl, 'utf8');

  assert.match(loginPage, /useSearchParams/);
  assert.match(loginPage, /searchParams\.get\('mode'\) === 'register'/);
});
