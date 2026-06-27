import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const componentUrl = new URL('../components/CyberCat.tsx', import.meta.url);

test('cyber cat uses a compact, edge-anchored mobile layout', async () => {
  const source = await readFile(componentUrl, 'utf8');

  assert.match(source, /hidden/);
  assert.match(source, /md:flex/);
  assert.match(source, /md:bottom-20 md:right-20/);
});
