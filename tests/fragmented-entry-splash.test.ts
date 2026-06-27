import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const splashPath = path.join(process.cwd(), 'components', 'SplashScreen.tsx');
const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');

function readSplash() {
  return readFileSync(splashPath, 'utf8');
}

function readLayout() {
  return readFileSync(layoutPath, 'utf8');
}

test('fragmented entry splash exposes the intended entrance actions', () => {
  const source = readSplash();

  assert.match(source, /进入宝藏之地/);
  assert.match(source, /登录 \/ 注册/);
  assert.match(source, /href="\/login"/);
});

test('fragmented entry splash remembers explicit entry for the current browser session', () => {
  const source = readSplash();

  assert.match(source, /const enterSite = \(\) =>/);
  assert.match(source, /sessionStorage\.setItem\('hasEnteredSplash', 'true'\)/);
  assert.match(source, /document\.documentElement\.classList\.add\('splash-seen'\)/);
});

test('root layout reveals the app before hydration when the entry was already accepted', () => {
  const source = readLayout();

  assert.match(source, /import Script from 'next\/script'/);
  assert.match(source, /sessionStorage\.getItem\('hasEnteredSplash'\) === 'true'/);
  assert.match(source, /document\.documentElement\.classList\.add\('splash-seen'\)/);
});

test('fragmented entry splash uses explicit phases for assemble and exit', () => {
  const source = readSplash();

  assert.match(source, /type SplashPhase = 'assembling' \| 'ready' \| 'exiting'/);
  assert.match(source, /setPhase\('ready'\)/);
  assert.match(source, /setPhase\('exiting'\)/);
});

test('fragmented entry splash renders fragment layers for the assembly effect', () => {
  const source = readSplash();

  assert.match(source, /const fragments = \[/);
  assert.match(source, /fragments\.map/);
  assert.match(source, /backdrop-blur/);
});
