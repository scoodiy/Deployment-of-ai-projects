import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const timelineUrl = new URL('../components/TimelineClient.tsx', import.meta.url);
const timelineNodeUrl = new URL('../components/TimelineNode.tsx', import.meta.url);
const configUrl = new URL('../siteConfig.ts', import.meta.url);

test('article cards recover from missing cover URLs with a local fallback image', async () => {
  const source = await readFile(timelineUrl, 'utf8');

  assert.match(source, /const fallbackCover = ['"]\/images\/optimized\/default-cover\.webp['"]/);
  assert.match(source, /onError=/);
  assert.match(source, /event\.currentTarget\.src = fallbackCover/);
});

test('timeline nodes recover from missing cover URLs with the same local fallback image', async () => {
  const source = await readFile(timelineNodeUrl, 'utf8');

  assert.match(source, /const fallbackCover = ['"]\/images\/optimized\/default-cover\.webp['"]/);
  assert.match(source, /onError=/);
  assert.match(source, /event\.currentTarget\.src = fallbackCover/);
});

test('default post cover is served locally instead of a third-party image host', async () => {
  const source = await readFile(configUrl, 'utf8');

  assert.match(source, /defaultPostCover: ['"]\/images\/optimized\/default-cover\.webp['"]/);
  assert.doesNotMatch(source, /defaultPostCover:\s*['"]https:\/\/bu\.dusays\.com/);
});
