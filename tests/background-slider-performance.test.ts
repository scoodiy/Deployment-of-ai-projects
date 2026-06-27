import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sliderUrl = new URL('../components/BackgroundSlider.tsx', import.meta.url);
const configUrl = new URL('../siteConfig.ts', import.meta.url);

test('background slider limits the initial page to the active transition layers', async () => {
  const source = await readFile(sliderUrl, 'utf8');

  assert.doesNotMatch(source, /images\.map\(/);
  assert.match(source, /const activeImage = images\[index\]/);
  assert.match(source, /previousImage/);
});

test('background slider uses the optimized WebP image set', async () => {
  const source = await readFile(configUrl, 'utf8');

  assert.match(source, /"\/images\/optimized\/bg-1\.webp"/);
  assert.match(source, /"\/images\/optimized\/bg-10\.webp"/);
  assert.doesNotMatch(source, /"\/bg\/1\.jpg"/);
});
