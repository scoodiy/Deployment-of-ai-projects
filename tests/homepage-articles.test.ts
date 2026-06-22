import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const componentUrl = new URL('../components/LatestPostsCarousel.tsx', import.meta.url);

test('homepage articles render a stable four-entry collection instead of an automatic carousel', async () => {
  const source = await readFile(componentUrl, 'utf8');

  assert.match(source, /posts\.slice\(0,\s*4\)/);
  assert.doesNotMatch(source, /setInterval\(/);
  assert.match(source, /post\.slug !== 'none' && post\.cover/);
});
