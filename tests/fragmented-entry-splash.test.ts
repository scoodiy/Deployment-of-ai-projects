import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const splashPath = path.join(process.cwd(), 'components', 'SplashScreen.tsx');
const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
const curtainPagePath = path.join(process.cwd(), 'public', 'curtain-reveal', 'index.html');
const animatedLoginPagePath = path.join(process.cwd(), 'public', 'animated-login', 'index.html');
const loginPagePath = path.join(process.cwd(), 'app', 'login', 'page.tsx');
const publicChromePath = path.join(process.cwd(), 'components', 'PublicChrome.tsx');
const pageTransitionPath = path.join(process.cwd(), 'components', 'PageTransition.tsx');

function readLayout() {
  return readFileSync(layoutPath, 'utf8');
}

function readSplash() {
  return readFileSync(splashPath, 'utf8');
}

function readLoginPage() {
  return readFileSync(loginPagePath, 'utf8');
}

function readCurtainPage() {
  return readFileSync(curtainPagePath, 'utf8');
}

function readPageTransition() {
  return readFileSync(pageTransitionPath, 'utf8');
}

test('front-end loading page uses the provided curtain reveal html page', () => {
  assert.equal(existsSync(curtainPagePath), true);

  const source = readCurtainPage();
  assert.match(source, /<title>Curtain Reveal<\/title>/);
  assert.match(source, /点击任意位置跳过/);
  assert.match(source, /sessionStorage\.getItem\('curtain-played'\)/);
  assert.match(source, /finishCurtain\(\)/);
  assert.match(source, /curtain-left/);
  assert.match(source, /line-container/);
  assert.doesNotMatch(source, /欢迎光临/);
  assert.doesNotMatch(source, /幕布展开后显示/);
  assert.doesNotMatch(source, /content-inner/);
});

test('root layout mounts the loading page without restoring the old splash gate', () => {
  const source = readLayout();

  assert.match(source, /import SplashScreen from "\.\.\/components\/SplashScreen"/);
  assert.match(source, /<SplashScreen \/>/);
  assert.match(source, /curtain-pending/);
  assert.match(source, /<script\s+id="handle-curtain-logic"/);
  assert.match(source, /sessionStorage\.getItem\('curtain-played'\)/);
  assert.doesNotMatch(source, /import Script from 'next\/script'/);
  assert.doesNotMatch(source, /<Script id="handle-curtain-logic"/);
  assert.doesNotMatch(source, /handle-splash-logic/);
  assert.doesNotMatch(source, /splash-pending/);
  assert.doesNotMatch(source, /splash-seen/);
  assert.doesNotMatch(source, /hasEnteredSplash/);
});

test('splash component embeds the provided page as the only loading surface', () => {
  assert.equal(existsSync(splashPath), true);

  const source = readSplash();

  assert.match(source, /src="\/curtain-reveal\/index\.html"/);
  assert.match(source, /sessionStorage\.getItem\('curtain-played'\)/);
  assert.match(source, /document\.documentElement\.classList\.remove\('curtain-pending'\)/);
  assert.match(source, /setShow\(false\)/);
  assert.doesNotMatch(source, /欢迎光临/);
  assert.doesNotMatch(source, /Curtain Reveal/);
});

test('curtain completion sends the first home entry to the animated login page', () => {
  const source = readSplash();

  assert.match(source, /animated-login-entered/);
  assert.match(source, /useRouter/);
  assert.match(source, /usePathname/);
  assert.match(source, /window\.addEventListener\('message'/);
  assert.match(source, /curtain-opening/);
  assert.match(source, /const LOGIN_PATH = '\/login'/);
  assert.match(source, /router\.replace\(LOGIN_PATH\)/);
  assert.doesNotMatch(source, /window\.location\.replace\('\/login'\)/);
});

test('login route embeds the provided animated characters login page without rewriting it', () => {
  assert.equal(existsSync(animatedLoginPagePath), true);

  const staticLogin = readFileSync(animatedLoginPagePath, 'utf8');
  const page = readLoginPage();

  assert.match(staticLogin, /动画角色登录页面/);
  assert.match(staticLogin, /\/animated-login\/assets\//);
  assert.match(page, /src="\/animated-login\/index\.html"/);
  assert.doesNotMatch(page, /useSearchParams/);
  assert.doesNotMatch(page, /api\/user\/login/);
});

test('login route is not covered by public site overlays', () => {
  const source = readFileSync(publicChromePath, 'utf8');

  assert.match(source, /function useIsStandaloneRoute\(\)/);
  assert.match(source, /pathname === '\/login'/);
  assert.match(source, /if \(useIsStandaloneRoute\(\)\) return null;/);
});

test('root layout hides the app from the first server paint until the curtain is ready', () => {
  const source = readLayout();

  assert.match(source, /className=\{`\$\{geistSans\.variable\} \$\{geistMono\.variable\} h-full antialiased curtain-pending`\}/);
  assert.match(source, /html\.curtain-pending #app-mount-root \{ opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; \}/);
  assert.match(source, /html\.curtain-ready #app-mount-root \{ opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; transition: none !important; \}/);
  assert.match(source, /document\.documentElement\.classList\.remove\('curtain-pending'\)/);
  assert.match(source, /document\.documentElement\.classList\.add\('curtain-ready'\)/);
});

test('curtain iframe opens onto the parent page instead of an internal black frame', () => {
  const source = readCurtainPage();

  assert.match(source, /background:\s*transparent/);
  assert.match(source, /notifyCurtainOpening\(\)/);
  assert.match(source, /postMessage\(\{ type: 'curtain-opening' \}/);
  assert.match(source, /notifyCurtainOpening\(\);\s*curtainLeft\.classList\.add\('open'\)/s);
  assert.match(source, /notifyCurtainOpening\(\);\s*skipHint\.classList\.add\('hidden'\)/s);
  assert.doesNotMatch(source, /html,\s*body\s*\{[^}]*background:\s*#1a1a1a/s);
});

test('page transitions do not fade visible pages in from a blank state', () => {
  const source = readPageTransition();

  assert.match(source, /initial=\{false\}/);
  assert.match(source, /duration:\s*0\.28/);
  assert.doesNotMatch(source, /opacity:\s*0/);
  assert.doesNotMatch(source, /duration:\s*0\.8/);
});
