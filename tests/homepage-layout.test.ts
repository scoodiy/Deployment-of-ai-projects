import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageUrl = new URL('../app/page.tsx', import.meta.url);

test('homepage composes the life-journal sections in responsive reading order', async () => {
  const source = await readFile(pageUrl, 'utf8');

  assert.match(source, /grid-cols-1\s+lg:grid-cols-12/);
  assert.match(source, /lg:col-span-4[\s\S]*?<ProfileCard/);
  assert.match(source, /<ProfileCard[\s\S]*?<LatestChatterCarousel[\s\S]*?latestAlbum\.cover/);
  assert.match(source, /<LatestPostsCarousel[\s\S]*?<CloudPlayer[\s\S]*?<LyricBar/);
  assert.match(source, /href="\/photowall"[\s\S]*?aspect-\[16\/9\]/);
  assert.doesNotMatch(source, /rounded-3xl/);
  assert.match(source, /import fs from 'node:fs'/);
  assert.doesNotMatch(source, /require\(/);
  assert.doesNotMatch(source, /\bany\b/);
});
