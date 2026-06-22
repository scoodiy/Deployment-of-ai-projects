import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const componentUrl = new URL('../components/CyberCat.tsx', import.meta.url);

test('cyber cat uses a compact, edge-anchored mobile layout', async () => {
  const source = await readFile(componentUrl, 'utf8');

  assert.match(source, /bottom-4 right-3[\s\S]*?md:bottom-20 md:right-20/);
  assert.match(source, /w-16 h-16[\s\S]*?md:w-\[120px\] md:h-\[120px\]/);
  assert.match(source, /bottom-full[\s\S]*?mb-2[\s\S]*?md:-bottom-14 md:mb-0/);
});
